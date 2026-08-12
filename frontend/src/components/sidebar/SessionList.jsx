import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { listSessions, createSession, renameSession, deleteSession } from "@/lib/api";
import { toast } from "sonner";
import SessionItem from "./SessionItem";

const POLL_INTERVAL = 6000;

export default function SessionList() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const refresh = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const handleRename = async (id) => {
    try {
      await renameSession(id, editValue.trim() || "Untitled");
      setEditingId(null);
      refresh();
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error("Rename failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      if (sessionId === id) navigate("/");
      refresh();
      toast.success("Chat deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditValue(s.title || "");
  };

  return (
    <>
      <div className="px-3 pb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
          <MessagesSquare className="w-3 h-3" /> Chats
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">{sessions.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll px-2">
        <AnimatePresence initial={false}>
          {sessions.length === 0 && (
            <div className="px-3 py-6 text-xs text-zinc-500 leading-relaxed">
              No chats yet. Start a new conversation to ground your questions in your PDFs.
            </div>
          )}
          {sessions.map((s, i) => (
            <SessionItem
              key={s.id}
              session={s}
              active={sessionId === s.id}
              isEditing={editingId === s.id}
              editValue={editValue}
              onEditChange={setEditValue}
              onStartEdit={startEdit}
              onSubmitEdit={handleRename}
              onCancelEdit={() => setEditingId(null)}
              onDelete={handleDelete}
              onSelect={(id) => navigate(`/c/${id}`)}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
