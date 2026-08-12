# Multi-PDF Research Assistant

A local, high-performance Retrieval-Augmented Generation (RAG) assistant designed for researchers, developers, and students. This tool allows you to upload multiple PDF research papers or manuals, index them in a local vector database, and perform semantic searches or have a grounded chat conversation with streaming token-by-token responses and clickable citations pointing to the exact page numbers in the source documents.

---

## Key Features

*   **Real-time SSE Token Streaming**: Answers stream back word-by-word, just like commercial LLM interfaces.
*   **Source Citation Mapping**: Clickable inline references detailing the source filename, page number, and the exact text snippet retrieved.
*   **Dual Ingest Protection**: Ingests files asynchronously in a background thread executor. Clean, defensive filtering automatically catches scanned (image-only) or empty PDFs and reports a failure status without crashing the database.
*   **Flexible Model Selection**: Customize the LLM, temperature, and embedding parameters dynamically directly from the settings panel in the UI.
*   **Local-First & Private**: Built entirely around Ollama, Chroma DB, and MongoDB. No API keys are required, and your data never leaves your computer.

---

## Technology Stack

### Backend
*   **Framework**: FastAPI (Asynchronous endpoints, SSE streaming)
*   **LLM Orchestrator**: LangChain (Community, Chroma, and Ollama modules)
*   **Vector Database**: Chroma DB (Local vector index storage)
*   **Primary Database**: MongoDB (Via `motor` async driver for chat logs and session history)
*   **Local Inference**: Ollama (`llama3` for chat/reasoning, `nomic-embed-text` for text embeddings)

### Frontend
*   **Core**: React 19 (UI Components)
*   **State Management**: Zustand (Persisted client-side configuration cache)
*   **Styling**: TailwindCSS & Radix UI primitives
*   **Animations**: Framer Motion

---

## Codebase Structure

```yaml
MultiPDFResearchTool-main/
│
├── backend/
│   ├── app/
│   │   ├── api/                  # Modular FastAPI routers
│   │   │   ├── chat_routes.py    # Session, messaging, and SSE RAG streaming
│   │   │   ├── search_routes.py  # Chroma DB semantic similarity search
│   │   │   └── upload_routes.py  # File upload, deletes, and summarization
│   │   │
│   │   ├── ingest/               # LangChain document loaders & splitters
│   │   │   ├── loader.py         # PyPDFLoader wrapper
│   │   │   ├── chunker.py        # RecursiveCharacterTextSplitter config
│   │   │   └── pipeline.py       # Full PDF -> chunk -> metadata injection pipeline
│   │   │
│   │   ├── rag/                  # RAG execution modules
│   │   │   ├── prompts.py        # System prompt constraints
│   │   │   ├── retriever.py      # Chroma vector DB retriever
│   │   │   ├── generator.py      # Ollama Chat model setup
│   │   │   └── chain.py          # Combined retriever + generator runner
│   │   │
│   │   ├── services/             # Core local service initializers
│   │   │   ├── embedding_service.py   # OllamaEmbeddings instantiator
│   │   │   ├── llm_service.py         # ChatOllama model connector
│   │   │   └── vectorstore_service.py # Chroma DB initialization & persistence
│   │   │
│   │   ├── db.py                 # Async MongoDB connection pool setup
│   │   └── models.py             # Pydantic schemas (Request/Response models)
│   │
│   ├── tests/
│   │   └── test_paperloop_api.py # Pytest API integration testing suite
│   │
│   ├── server.py                 # Backend entry point (FastAPI launcher)
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Local environment configurations (MongoDB, CORS)
│
└── frontend/                     # React Single Page Application (SPA)
    ├── src/
    │   ├── components/           # UI buttons, modals, and panel sidebars
    │   ├── hooks/                # Custom React hooks (including SSE stream consumer)
    │   ├── layouts/              # App skeleton structure
    │   ├── lib/                  # API client handler (Axios and SSE fetch wrapper)
    │   ├── pages/                # Chat Page, Documents Page, Search page, and Settings
    │   └── store/                # Zustand global settings store
    └── .env                      # React backend environment mapping
```

---

## Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/), [Python 3.10+](https://www.python.org/), and [MongoDB](https://www.mongodb.com/) installed and running locally.

### 1. Ollama Model Setup
Install [Ollama](https://ollama.com/) on your local machine and pull the required models:
```bash
# Pull the chat model
ollama pull llama3

# Pull the embedding model
ollama pull nomic-embed-text
```

### 2. Backend Installation
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create and activate your Python virtual environment.
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure your environment in `backend/.env`:
    ```env
    MONGO_URL=mongodb://localhost:27017
    DB_NAME=pdf_assistant
    CORS_ORIGINS=*
    ```
5.  Start the FastAPI server:
    ```bash
    python -m uvicorn server:app --reload --port 8000
    ```

### 3. Frontend Installation
1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Create your frontend environment file `frontend/.env`:
    ```env
    REACT_APP_BACKEND_URL=http://localhost:8000
    ```
3.  Install NPM dependencies (bypass dependency conflicts with legacy flag):
    ```bash
    npm install --legacy-peer-deps
    ```
4.  Start the web application:
    ```bash
    npm start
    ```

---

## Usage Guide

1.  Open **`http://localhost:3000`** in your browser.
2.  Go to the **Documents** page and click **Upload PDF** to add a text-based PDF file.
3.  Wait a few seconds for the document status to change to **`ready`**.
4.  Go to the **Settings** page and verify that your default LLM model is set to **`llama3`** (or select a different model if you have other weights pulled in Ollama).
5.  Start a new conversation on the **Chat** page and ask questions about your uploaded documents!

---

## Testing API Endpoints (Swagger UI)

You can interactively test the endpoints without the frontend by navigating to the Swagger UI playground at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
