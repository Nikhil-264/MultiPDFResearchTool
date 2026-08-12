from app.services.vectorstore_service import get_vectorstore


def get_retriever(embedding_model_name: str = "nomic-embed-text", top_k: int = 3):

    vectorstore = get_vectorstore(embedding_model_name)

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": top_k}
    )

    return retriever