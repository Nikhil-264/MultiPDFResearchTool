import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ---------- Documents ----------
export const uploadDocument = (file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  return api
    .post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    })
    .then((r) => r.data);
};

export const listDocuments = () => api.get("/documents").then((r) => r.data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`).then((r) => r.data);
export const getDocumentSummary = (id) =>
  api.get(`/documents/${id}/summary`).then((r) => r.data);

// ---------- Sessions ----------
export const listSessions = () => api.get("/sessions").then((r) => r.data);
export const createSession = (title = "New Chat") =>
  api.post("/sessions", { title }).then((r) => r.data);
export const renameSession = (id, title) =>
  api.patch(`/sessions/${id}`, { title }).then((r) => r.data);
export const deleteSession = (id) => api.delete(`/sessions/${id}`).then((r) => r.data);
export const listMessages = (id) =>
  api.get(`/sessions/${id}/messages`).then((r) => r.data);

// ---------- Chat ----------
export const sendChat = (sessionId, message, settings) =>
  api.post("/chat", {
    session_id: sessionId,
    message,
    llm_model: settings?.llmModel,
    temperature: settings?.temperature,
    streaming: settings?.streaming,
  }).then((r) => r.data);

// ---------- Streaming helpers ----------
function dispatchSseEvent(line, { onMeta, onToken, onDone }) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return;
  let evt;
  try {
    evt = JSON.parse(trimmed.slice(5).trim());
  } catch (err) {
    console.warn("Could not parse SSE chunk:", err);
    return;
  }
  if (evt.type === "meta") onMeta?.(evt);
  else if (evt.type === "token") onToken?.(evt.token);
  else if (evt.type === "done") onDone?.();
}

async function consumeSseStream(body, handlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const line of parts) dispatchSseEvent(line, handlers);
  }
}

export async function streamChat(sessionId, message, handlers, settings) {
  const { onError, signal, ...sseHandlers } = handlers;
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        llm_model: settings?.llmModel,
        temperature: settings?.temperature,
        streaming: settings?.streaming,
      }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);
    await consumeSseStream(res.body, sseHandlers);
  } catch (err) {
    if (err.name !== "AbortError") onError?.(err);
  }
}


// ---------- Search ----------
export const semanticSearch = (query, top_k = 6) =>
  api.post("/search", { query, top_k }).then((r) => r.data);
