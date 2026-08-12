from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    size: int
    pages: int
    status: str = "ready"  # uploading | embedding | ready | failed
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "New Chat"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class SessionRename(BaseModel):
    title: str

class Citation(BaseModel):
    id: str
    document_id: str
    filename: str
    page: int
    snippet: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # user | assistant
    content: str
    citations: List[Citation] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatRequest(BaseModel):
    message: str
    session_id: str
    # Settings parameters sent by client
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    streaming: Optional[bool] = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    embedding_model: Optional[str] = None

class SearchChunk(BaseModel):
    id: str
    document_id: str
    filename: str
    page: int
    score: float
    text: str
