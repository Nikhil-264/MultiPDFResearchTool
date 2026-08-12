import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.db import db
from app.models import (
    Session,
    SessionCreate,
    SessionRename,
    Message,
    Citation,
    ChatRequest
)
from app.rag.chain import ask_question
from app.rag.retriever import get_retriever
from app.rag.generator import get_llm
from app.rag.prompts import RAG_PROMPT

router = APIRouter()


@router.get("/sessions", response_model=List[Session])
async def list_sessions():
    sessions = await db.sessions.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return sessions


@router.post("/sessions", response_model=Session)
async def create_session(body: SessionCreate):
    s = Session(title=body.title or "New Chat")
    await db.sessions.insert_one(s.model_dump())
    return s


@router.patch("/sessions/{session_id}", response_model=Session)
async def rename_session(session_id: str, body: SessionRename):
    now = datetime.now(timezone.utc).isoformat()
    res = await db.sessions.find_one_and_update(
        {"id": session_id},
        {"$set": {"title": body.title, "updated_at": now}},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Session not found")
    return res


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    await db.sessions.delete_one({"id": session_id})
    await db.messages.delete_many({"session_id": session_id})
    return {"ok": True}


@router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def list_messages(session_id: str):
    msgs = await db.messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return msgs


@router.post("/chat", response_model=Message)
async def chat(body: ChatRequest):
    # Ensure session exists
    sess = await db.sessions.find_one({"id": body.session_id})
    if not sess:
        new_sess = Session(id=body.session_id, title=body.message[:48] or "New Chat")
        await db.sessions.insert_one(new_sess.model_dump())
        
    llm_model = body.llm_model or "llama3"
    temperature = body.temperature or 0.3
    embedding_model = "nomic-embed-text"
    top_k = 3
    
    # Run ask_question in thread executor (sync wrapper around sync LangChain methods)
    loop = asyncio.get_running_loop()
    res = await loop.run_in_executor(
        None,
        lambda: ask_question(
            question=body.message,
            llm_model=llm_model,
            embedding_model=embedding_model,
            temperature=temperature,
            top_k=top_k
        )
    )
    
    answer = res["answer"]
    retrieved_docs = res["sources"]
    
    # Build citations list
    citations = []
    for doc in retrieved_docs:
        doc_id = doc.metadata.get("document_id", "")
        filename = doc.metadata.get("filename", "")
        page = doc.metadata.get("page_number", doc.metadata.get("page", 0) + 1)
        citations.append(Citation(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            filename=filename,
            page=page,
            snippet=doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else "")
        ))
        
    # Save user message
    user_msg = Message(
        session_id=body.session_id,
        role="user",
        content=body.message
    )
    await db.messages.insert_one(user_msg.model_dump())
    
    # Save assistant message
    ai_msg = Message(
        session_id=body.session_id,
        role="assistant",
        content=answer,
        citations=citations
    )
    await db.messages.insert_one(ai_msg.model_dump())
    
    # Update session title and updated_at
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if not sess or sess.get("title") in (None, "", "New Chat"):
        update["title"] = body.message[:48]
    await db.sessions.update_one({"id": body.session_id}, {"$set": update})
    
    return ai_msg


async def stream_rag(body: ChatRequest, llm_model: str, embedding_model: str, temperature: float, top_k: int):
    try:
        # Retrieve context chunks
        retriever = get_retriever(embedding_model_name=embedding_model, top_k=top_k)
        
        loop = asyncio.get_running_loop()
        retrieved_docs = await loop.run_in_executor(None, lambda: retriever.invoke(body.message))
        
        # Build citations list
        citations = []
        for doc in retrieved_docs:
            doc_id = doc.metadata.get("document_id", "")
            filename = doc.metadata.get("filename", "")
            page = doc.metadata.get("page_number", doc.metadata.get("page", 0) + 1)
            citation_id = str(uuid.uuid4())
            citations.append(Citation(
                id=citation_id,
                document_id=doc_id,
                filename=filename,
                page=page,
                snippet=doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else "")
            ))
            
        ai_msg_id = str(uuid.uuid4())
        
        # Yield metadata first
        yield "data: " + json.dumps({
            "type": "meta",
            "id": ai_msg_id,
            "citations": [c.model_dump() for c in citations]
        }) + "\n\n"
        
        # Format RAG prompt
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        formatted_prompt = RAG_PROMPT.format(context=context, question=body.message)
        
        llm = get_llm(model_name=llm_model, temperature=temperature)
        
        # Stream response
        full_content = ""
        try:
            async for chunk in llm.astream(formatted_prompt):
                token = chunk.content
                full_content += token
                yield "data: " + json.dumps({
                    "type": "token",
                    "token": token
                }) + "\n\n"
        except Exception as streaming_err:
            import logging
            logging.error(f"Error during LLM token streaming: {streaming_err}")
            yield "data: " + json.dumps({
                "type": "token",
                "token": f"\n\n[Streaming Error: {streaming_err}]"
            }) + "\n\n"
            
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        
        # Persist messages to DB
        user_msg = Message(
            session_id=body.session_id,
            role="user",
            content=body.message
        )
        await db.messages.insert_one(user_msg.model_dump())
        
        ai_msg = Message(
            id=ai_msg_id,
            session_id=body.session_id,
            role="assistant",
            content=full_content,
            citations=citations
        )
        await db.messages.insert_one(ai_msg.model_dump())
        
        # Update session title and updated_at
        sess = await db.sessions.find_one({"id": body.session_id})
        update = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if not sess or sess.get("title") in (None, "", "New Chat"):
            update["title"] = body.message[:48]
        await db.sessions.update_one({"id": body.session_id}, {"$set": update})
        
    except Exception as general_err:
        import logging
        logging.error(f"General error in stream_rag generator: {general_err}")
        yield "data: " + json.dumps({
            "type": "token",
            "token": f"\n\n[System Error: {general_err}]"
        }) + "\n\n"
        yield "data: " + json.dumps({"type": "done"}) + "\n\n"


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    # Ensure session exists
    sess = await db.sessions.find_one({"id": body.session_id})
    if not sess:
        new_sess = Session(id=body.session_id, title=body.message[:48] or "New Chat")
        await db.sessions.insert_one(new_sess.model_dump())
        
    llm_model = body.llm_model or "llama3"
    temperature = body.temperature or 0.3
    embedding_model = "nomic-embed-text"
    top_k = 3
    
    return StreamingResponse(
        stream_rag(body, llm_model, embedding_model, temperature, top_k),
        media_type="text/event-stream"
    )
