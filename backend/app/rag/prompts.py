RAG_PROMPT = """
You are an AI research assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context, say:
"I could not find the answer in the provided documents."

Context:
{context}

Question:
{question}

Answer:
"""