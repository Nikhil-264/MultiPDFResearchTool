# Paperloop — PDF Research Assistant (PRD)

## Original Problem Statement
Build a modern production-style frontend for an AI-powered Multi-PDF Research
Assistant using React + Tailwind + shadcn/ui + Framer Motion + Zustand + Axios.
Inspired by Perplexity, ChatGPT, Notion, Linear. Backend will later use FastAPI
+ LangChain + Ollama + Chroma/Qdrant. Frontend must be modular so backend can
plug in later; do not hardcode AI logic. Dark mode default.

## Architecture
- Frontend: React 19 (JSX), TailwindCSS, shadcn/ui, Framer Motion, Zustand, Axios.
- Backend: FastAPI + MongoDB (Motor). Fully-mocked endpoints prefixed with `/api`.
- All HTTP via `REACT_APP_BACKEND_URL` + `/api`.

## Personas
- Researcher / grad student loading a corpus of PDFs to query.
- Engineer evaluating RAG quality before wiring real models.

## Core Requirements
1. Multi-PDF drag-and-drop upload with progress & status.
2. ChatGPT-style streaming chat with markdown, code blocks, copy/regenerate.
3. Inline citation chips linking to page-level source previews.
4. Document library: filter, sort, delete, summarize cards.
5. Chat sessions: create, rename, delete, persist.
6. Semantic search page: scored chunks with highlights and PDF preview.
7. Settings: LLM, embeddings, chunk size/overlap, top-K, temperature, theme, API endpoint.
8. Dark mode default + light mode toggle.
9. Responsive: sidebar collapses on mobile.
10. PDF preview modal with highlighted referenced passage.

## Implemented (2026-02)
- 3-column dark-themed shell (Obsidian + Amber palette, Cabinet Grotesk + Satoshi).
- Routes: `/`, `/c/:sessionId`, `/documents`, `/search`, `/settings`.
- Backend mock endpoints: `/api/upload`, `/api/documents`, `/api/documents/{id}`, `/api/documents/{id}/summary`, `/api/sessions` (CRUD), `/api/sessions/{id}/messages`, `/api/chat`, `/api/chat/stream` (SSE), `/api/search`.
- Zustand store persists theme + settings; sessions/documents fetched from server.
- Streaming chat via fetch SSE with abortable controller and stop button.
- Citation chips render from `[1] [2]` markers; clicking focuses the right-sidebar card and opens PDF preview modal.
- Document polling on Documents page (4s) + onComplete refresh.
- Toasts via sonner; data-testids on all interactive elements.

## Backlog
- P0: Wire real RAG pipeline (LangChain + Ollama + Chroma/Qdrant) once backend is ready.
- P1: Server-side PDF rendering for real page-image previews.
- P1: Multi-user auth (JWT or Google OAuth) + per-user libraries.
- P2: Keyboard shortcut palette (cmd-K), chat export, share session links.
- P2: Chunk inspector overlay (token boundaries, embedding viz).
- P2: Cost/latency telemetry per query.

## Next Tasks
- Replace `_mock_ai_answer` in `server.py` with real LangChain retrieval chain.
- Add object-storage upload + persistent PDF blob storage.
- Add auth boundary on `/api/sessions` & `/api/documents`.
