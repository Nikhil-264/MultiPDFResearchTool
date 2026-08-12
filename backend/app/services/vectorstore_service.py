import os
from langchain_chroma import Chroma
from app.services.embedding_service import get_embedding_model


from pathlib import Path
BASE_PERSIST_DIRECTORY = str(Path(__file__).parent.parent.parent / "vectorstore")



def get_vectorstore(embedding_model_name: str = "nomic-embed-text"):
    persist_dir = os.path.join(BASE_PERSIST_DIRECTORY, embedding_model_name)
    embedding_model = get_embedding_model(embedding_model_name)
    return Chroma(
        persist_directory=persist_dir,
        embedding_function=embedding_model
    )


def create_vectorstore(chunks, embedding_model_name: str = "nomic-embed-text"):
    persist_dir = os.path.join(BASE_PERSIST_DIRECTORY, embedding_model_name)
    embedding_model = get_embedding_model(embedding_model_name)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory=persist_dir
    )

    return vectorstore