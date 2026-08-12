"""Pytest suite for Paperloop FastAPI mock backend."""
import io
import json
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://knowledge-forge-70.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MIN_PDF = (
    b"%PDF-1.4\n1 0 obj<<>>endobj\n"
    b"trailer<<>>\n%%EOF\n"
)


@pytest.fixture(scope="session")
def session_http():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def uploaded_doc(session_http):
    files = {"file": ("TEST_paperloop_sample.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
    r = session_http.post(f"{API}/upload", files=files, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    # cleanup
    session_http.delete(f"{API}/documents/{data['id']}")


@pytest.fixture(scope="session")
def created_session(session_http):
    r = session_http.post(f"{API}/sessions", json={"title": "TEST_session"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    session_http.delete(f"{API}/sessions/{data['id']}")


# ---------- Health ----------
class TestHealth:
    def test_root_ok(self, session_http):
        r = session_http.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"


# ---------- Documents ----------
class TestDocuments:
    def test_upload_returns_metadata(self, uploaded_doc):
        d = uploaded_doc
        assert "id" in d and isinstance(d["id"], str)
        assert d["filename"] == "TEST_paperloop_sample.pdf"
        assert isinstance(d["pages"], int) and d["pages"] >= 1
        assert isinstance(d["size"], int) and d["size"] > 0
        assert d["status"] == "ready"

    def test_list_documents_contains_uploaded(self, session_http, uploaded_doc):
        r = session_http.get(f"{API}/documents", timeout=15)
        assert r.status_code == 200
        ids = [d["id"] for d in r.json()]
        assert uploaded_doc["id"] in ids

    def test_document_summary(self, session_http, uploaded_doc):
        r = session_http.get(f"{API}/documents/{uploaded_doc['id']}/summary", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["document_id"] == uploaded_doc["id"]
        assert "summary" in body and len(body["summary"]) > 0
        assert isinstance(body["key_findings"], list) and len(body["key_findings"]) > 0
        assert isinstance(body["keywords"], list) and len(body["keywords"]) > 0

    def test_summary_404_for_missing(self, session_http):
        r = session_http.get(f"{API}/documents/does-not-exist/summary", timeout=15)
        assert r.status_code == 404

    def test_delete_document_lifecycle(self, session_http):
        files = {"file": ("TEST_to_delete.pdf", io.BytesIO(MIN_PDF), "application/pdf")}
        c = session_http.post(f"{API}/upload", files=files, timeout=15)
        assert c.status_code == 200
        did = c.json()["id"]
        d = session_http.delete(f"{API}/documents/{did}", timeout=15)
        assert d.status_code == 200
        # verify gone
        r = session_http.get(f"{API}/documents/{did}/summary", timeout=15)
        assert r.status_code == 404

    def test_delete_unknown_returns_404(self, session_http):
        r = session_http.delete(f"{API}/documents/unknown-id", timeout=15)
        assert r.status_code == 404


# ---------- Sessions ----------
class TestSessions:
    def test_create_session(self, created_session):
        s = created_session
        assert "id" in s
        assert s["title"] == "TEST_session"

    def test_list_sessions_contains(self, session_http, created_session):
        r = session_http.get(f"{API}/sessions", timeout=15)
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert created_session["id"] in ids

    def test_rename_session(self, session_http, created_session):
        new_title = "TEST_renamed_session"
        r = session_http.patch(f"{API}/sessions/{created_session['id']}", json={"title": new_title}, timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == new_title
        # verify persistence
        r2 = session_http.get(f"{API}/sessions", timeout=15)
        names = {s["id"]: s["title"] for s in r2.json()}
        assert names.get(created_session["id"]) == new_title

    def test_rename_unknown_returns_404(self, session_http):
        r = session_http.patch(f"{API}/sessions/nope", json={"title": "x"}, timeout=15)
        assert r.status_code == 404

    def test_list_messages_empty_then(self, session_http, created_session):
        r = session_http.get(f"{API}/sessions/{created_session['id']}/messages", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Chat ----------
class TestChat:
    def test_chat_returns_assistant_with_citations(self, session_http, created_session, uploaded_doc):
        r = session_http.post(
            f"{API}/chat",
            json={"session_id": created_session["id"], "message": "What does the paper say about attention?"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "assistant"
        assert body["session_id"] == created_session["id"]
        assert isinstance(body["content"], str) and len(body["content"]) > 0
        # docs exist -> citations should be present
        assert isinstance(body["citations"], list)
        assert len(body["citations"]) >= 1
        c = body["citations"][0]
        assert all(k in c for k in ("id", "document_id", "filename", "page", "snippet"))

    def test_messages_persisted_after_chat(self, session_http, created_session):
        r = session_http.get(f"{API}/sessions/{created_session['id']}/messages", timeout=15)
        assert r.status_code == 200
        msgs = r.json()
        # should contain at least one user + one assistant message after chat
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles

    def test_chat_stream_sse_events(self, session_http, created_session):
        r = session_http.post(
            f"{API}/chat/stream",
            json={"session_id": created_session["id"], "message": "Stream test please"},
            timeout=60,
            stream=True,
        )
        assert r.status_code == 200
        types = []
        for raw in r.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            evt = json.loads(raw[5:].strip())
            types.append(evt.get("type"))
            if evt.get("type") == "done":
                break
        assert "meta" in types
        assert "token" in types
        assert "done" in types


# ---------- Search ----------
class TestSearch:
    def test_search_returns_chunks(self, session_http, uploaded_doc):
        r = session_http.post(f"{API}/search", json={"query": "transformer attention", "top_k": 4}, timeout=20)
        assert r.status_code == 200
        chunks = r.json()
        assert isinstance(chunks, list)
        assert len(chunks) >= 1
        c = chunks[0]
        for k in ("id", "document_id", "filename", "page", "score", "text"):
            assert k in c
        assert isinstance(c["score"], (int, float))
        assert isinstance(c["page"], int)
