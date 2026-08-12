from langchain_ollama import OllamaEmbeddings


def get_embedding_model(model_name: str = "nomic-embed-text"):

    embedding_model = OllamaEmbeddings(
        model=model_name
    )

    return embedding_model