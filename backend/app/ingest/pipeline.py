from app.ingest.loader import load_pdf
from app.ingest.chunker import chunk_documents
from app.services.vectorstore_service import create_vectorstore


def process_pdf(
    pdf_path: str,
    doc_id: str,
    filename: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    embedding_model_name: str = "nomic-embed-text"
):
    # Load PDF
    documents = load_pdf(pdf_path)

    # Chunk PDF
    chunks = chunk_documents(documents, chunk_size, chunk_overlap)

    # Filter out empty or whitespace-only chunks
    chunks = [c for c in chunks if c.page_content and c.page_content.strip()]

    if not chunks:
        raise ValueError(
            "No indexable text chunks could be extracted from this PDF. "
            "It might be scanned (image-only), password-protected, or empty."
        )

    # Attach document metadata to each chunk
    for chunk in chunks:
        chunk.metadata["document_id"] = doc_id
        chunk.metadata["filename"] = filename

        # Normalize page number to 1-indexed
        page_idx = chunk.metadata.get("page", 0)
        chunk.metadata["page_number"] = page_idx + 1

    # Create Vector Store
    vectorstore = create_vectorstore(chunks, embedding_model_name)

    return vectorstore, len(documents)