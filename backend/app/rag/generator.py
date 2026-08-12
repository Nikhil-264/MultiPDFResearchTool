from app.services.llm_service import get_llm
from app.rag.prompts import RAG_PROMPT


def generate_answer(context, question, llm_model: str = "llama3", temperature: float = 0.3):

    llm = get_llm(model_name=llm_model, temperature=temperature)

    formatted_prompt = RAG_PROMPT.format(
        context=context,
        question=question
    )

    response = llm.invoke(formatted_prompt)

    return response.content