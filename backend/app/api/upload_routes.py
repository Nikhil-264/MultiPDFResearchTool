import os
import uuid
import shutil
import asyncio
from pathlib import Path
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.db import db
from app.models import Document
from app.ingest.pipeline import process_pdf
from app.services.vectorstore_service import get_vectorstore
from app.services.llm_service import get_llm

router = APIRouter()

# Absolute path resolution to backend/uploads regardless of server execution context
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def run_ingestion(path: str, doc_id: str, name: str):
    try:
        # Run process_pdf (synchronous LangChain processing) in threadpool executor to not block main thread
        loop = asyncio.get_running_loop()
        _, pages = await loop.run_in_executor(
            None,
            lambda: process_pdf(
                pdf_path=path,
                doc_id=doc_id,
                filename=name,
                chunk_size=1000,
                chunk_overlap=200,
                embedding_model_name="nomic-embed-text"
            )
        )
        await db.documents.update_one(
            {"id": doc_id},
            {"$set": {"status": "ready", "pages": pages}}
        )
    except Exception as e:
        import logging
        logging.exception(f"Ingestion failed for doc {doc_id}")
        await db.documents.update_one(
            {"id": doc_id},
            {"$set": {"status": "failed"}}
        )



@router.post("/upload", response_model=Document)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # 1. Save uploaded file to disk
    file_id = str(uuid.uuid4())
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
    temp_file_path = UPLOAD_DIR / f"{file_id}_{safe_filename}"
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size = temp_file_path.stat().st_size
    
    # 2. Pre-create Document model in database with status="embedding"
    doc = Document(
        id=file_id,
        filename=file.filename,
        size=size,
        pages=0,
        status="embedding"
    )
    await db.documents.insert_one(doc.model_dump())
    
    # 3. Process PDF in background
    background_tasks.add_task(run_ingestion, str(temp_file_path), file_id, file.filename)
    
    return doc


@router.get("/documents", response_model=List[Document])
async def list_documents():
    docs = await db.documents.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(500)
    return docs


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    # Find doc
    doc = await db.documents.find_one({"id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from Chroma
    try:
        vectorstore = get_vectorstore("nomic-embed-text")
        res = vectorstore.get(where={"document_id": doc_id})
        if res and res.get("ids"):
            vectorstore.delete(ids=res["ids"])
    except Exception as e:
        import logging
        logging.error(f"Failed to delete from vectorstore: {e}")

    # Delete local file
    try:
        for path in UPLOAD_DIR.iterdir():
            if path.name.startswith(f"{doc_id}_"):
                path.unlink()
                break
    except Exception as e:
        import logging
        logging.error(f"Failed to delete local file: {e}")

    # Delete from MongoDB
    res = await db.documents.delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {"ok": True}


@router.get("/documents/{doc_id}/summary")
async def document_summary(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        vectorstore = get_vectorstore("nomic-embed-text")
        res = vectorstore.get(where={"document_id": doc_id}, limit=3)
        chunks = res.get("documents", [])
        if not chunks:
            return {
                "document_id": doc_id,
                "filename": doc["filename"],
                "summary": "This document has no indexable text chunks for summarization.",
                "key_findings": [],
                "keywords": []
            }
        
        context = "\n\n".join(chunks)
        llm = get_llm()
        
        prompt = (
            "You are an AI research assistant. Summarize the following extract of a document.\n"
            "Format the output strictly as a JSON object with the following fields:\n"
            '{\n  "summary": "a brief 3-sentence summary of the text",\n'
            '  "key_findings": ["finding 1", "finding 2", "finding 3"],\n'
            '  "keywords": ["keyword1", "keyword2", "keyword3"]\n}\n\n'
            f"Text:\n{context}\n\nJSON Output:"
        )
        
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, lambda: llm.invoke(prompt))
        
        import json
        import re
        content = response.content.strip()
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = json.loads(content)
            
        return {
            "document_id": doc_id,
            "filename": doc["filename"],
            "summary": data.get("summary", ""),
            "key_findings": data.get("key_findings", []),
            "keywords": data.get("keywords", [])
        }
    except Exception as e:
        import logging
        logging.error(f"Failed to generate summary: {e}")
        return {
            "document_id": doc_id,
            "filename": doc["filename"],
            "summary": f"Could not generate real summary automatically. Error: {e}",
            "key_findings": ["Error parsing content"],
            "keywords": ["error"]
        }
