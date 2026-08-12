import uuid
import asyncio
from typing import List
from fastapi import APIRouter
from app.models import SearchRequest, SearchChunk
from app.services.vectorstore_service import get_vectorstore

router = APIRouter()


@router.post("/search", response_model=List[SearchChunk])
async def semantic_search(body: SearchRequest):
    # 1. Get the vectorstore
    embed_model = body.embedding_model or "nomic-embed-text"
    vectorstore = get_vectorstore(embed_model)
    
    # 2. Query similarity search
    loop = asyncio.get_running_loop()
    try:
        # Try relevance scores first (normalized to [0, 1])
        docs_and_scores = await loop.run_in_executor(
            None,
            lambda: vectorstore.similarity_search_with_relevance_scores(body.query, k=body.top_k)
        )
    except Exception:
        # Fallback to raw L2 distance search and normalize
        docs_and_scores_raw = await loop.run_in_executor(
            None,
            lambda: vectorstore.similarity_search_with_score(body.query, k=body.top_k)
        )
        docs_and_scores = []
        for doc, dist in docs_and_scores_raw:
            # Map distance (usually 0 to 2) to relevance (0 to 1)
            relevance = max(0.0, min(1.0, 1.0 - (float(dist) / 2.0)))
            docs_and_scores.append((doc, relevance))
            
    # 3. Format outputs
    out: List[SearchChunk] = []
    for doc, score in docs_and_scores:
        doc_id = doc.metadata.get("document_id", "")
        filename = doc.metadata.get("filename", "")
        page = doc.metadata.get("page_number", doc.metadata.get("page", 0) + 1)
        
        out.append(SearchChunk(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            filename=filename,
            page=page,
            score=round(float(score), 3),
            text=doc.page_content
        ))
        
    return out
