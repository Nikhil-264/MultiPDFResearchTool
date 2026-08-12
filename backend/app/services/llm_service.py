from langchain_ollama import ChatOllama


def get_llm(model_name: str = "llama3", temperature: float = 0.3):

    llm = ChatOllama(
        model=model_name,
        temperature=temperature
    )

    return llm