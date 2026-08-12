from app.rag.chain import ask_question


query = "What is this book about?"


response = ask_question(query)


print("\n========== ANSWER ==========\n")

print(response["answer"])


print("\n========== SOURCES ==========\n")

for doc in response["sources"]:

    print(doc.metadata)