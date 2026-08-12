from app.rag.retriever import get_retriever
from app.rag.generator import generate_answer


def ask_question(
    question: str,
    llm_model: str = "llama3",
    embedding_model: str = "nomic-embed-text",
    temperature: float = 0.3,
    top_k: int = 3
):
    retriever = get_retriever(embedding_model_name=embedding_model, top_k=top_k)

    retrieved_docs = retriever.invoke(question)

    context = "\n\n".join(
        [doc.page_content for doc in retrieved_docs]
    )

    answer = generate_answer(
        context=context,
        question=question,
        llm_model=llm_model,
        temperature=temperature
    )

    return {
        "answer": answer,
        "sources": retrieved_docs
    }