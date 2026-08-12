import { useEffect, useState } from "react";
import { FileText, CircleDot } from "lucide-react";
import { listDocuments } from "@/lib/api";

const POLL_INTERVAL = 6000;

export default function DocumentList() {
  const [docs, setDocs] = useState([]);

  const refresh = async () => {
    try {
      const data = await listDocuments();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
          <FileText className="w-3 h-3" /> Library
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">{docs.length}</span>
      </div>
      <div className="max-h-40 overflow-y-auto thin-scroll space-y-0.5">
        {docs.slice(0, 6).map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 text-xs text-zinc-400 px-1.5 py-1 rounded hover:bg-[hsl(240_4%_11%)]"
            title={d.filename}
          >
            <CircleDot className="w-2.5 h-2.5 text-[hsl(35_100%_62%)]" />
            <span className="truncate">{d.filename}</span>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="text-[11px] text-zinc-600">No PDFs uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
