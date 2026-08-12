import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Trash2,
  Calendar,
  Layers,
  Search as SearchIcon,
  ArrowUpDown,
  Loader2,
  Sparkles,
  Tag,
  CheckCircle2,
} from "lucide-react";
import UploadDropzone from "@/components/upload/UploadDropzone";
import {
  listDocuments,
  deleteDocument,
  getDocumentSummary,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fmtSize(n) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const refresh = async () => {
    try {
      const d = await listDocuments();
      setDocs(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    let r = docs.filter((d) =>
      d.filename.toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "recent")
      r = [...r].sort((a, b) => (b.uploaded_at || "").localeCompare(a.uploaded_at || ""));
    else if (sort === "name") r = [...r].sort((a, b) => a.filename.localeCompare(b.filename));
    else if (sort === "pages") r = [...r].sort((a, b) => b.pages - a.pages);
    return r;
  }, [docs, query, sort]);

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setDocs((p) => p.filter((x) => x.id !== id));
      if (summary?.document_id === id) setSummary(null);
      toast.success("Document removed");
    } catch (_) {
      toast.error("Delete failed");
    }
  };

  const loadSummary = async (d) => {
    setSummaryLoading(true);
    setSummary({ document_id: d.id, filename: d.filename, loading: true });
    try {
      const s = await getDocumentSummary(d.id);
      setSummary(s);
    } catch (_) {
      toast.error("Could not load summary");
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto thin-scroll" data-testid="documents-page">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Library
            </div>
            <h1 className="text-3xl tracking-tighter font-medium">Documents</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {docs.length} indexed paper{docs.length === 1 ? "" : "s"} · grounded retrieval
            </p>
          </div>
        </header>

        <UploadDropzone onComplete={refresh} />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter documents…"
              className="w-full h-9 bg-[hsl(240_4%_10%)] border border-border rounded-md pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              data-testid="documents-filter-input"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              className="w-[160px] h-9 bg-[hsl(240_4%_10%)] border-border text-sm"
              data-testid="documents-sort-trigger"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="name">Name (A→Z)</SelectItem>
              <SelectItem value="pages">Most pages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-[hsl(240_4%_10%)] border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-zinc-500">
            No documents match. Upload PDFs above to start asking questions.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3" data-testid="documents-grid">
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group p-4 rounded-xl bg-[hsl(240_4%_9%)] border border-border hover:border-zinc-600 transition-all"
                data-testid={`document-card-${d.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-[hsl(35_100%_62%)]/10 border border-[hsl(35_100%_62%)]/30 text-[hsl(35_100%_62%)] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-100 truncate">{d.filename}</div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {d.pages}p
                      </span>
                      <span>{fmtSize(d.size)}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmtDate(d.uploaded_at)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" /> indexed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-[hsl(240_4%_16%)] text-zinc-500 hover:text-red-400"
                    data-testid={`document-delete-${d.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => loadSummary(d)}
                    className="text-[11px] flex items-center gap-1 text-zinc-400 hover:text-[hsl(35_100%_62%)] transition-colors"
                    data-testid={`document-summary-${d.id}`}
                  >
                    <Sparkles className="w-3 h-3" /> Summarize
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-[hsl(240_4%_9%)] border border-border"
            data-testid="summary-panel"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Research Summary
                </div>
                <div className="text-base font-medium text-zinc-100 mt-0.5">
                  {summary.filename}
                </div>
              </div>
              <button
                onClick={() => setSummary(null)}
                className="text-zinc-500 hover:text-zinc-200 text-xs"
              >
                Close
              </button>
            </div>
            {summaryLoading || summary.loading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Distilling insights…
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[14px] leading-relaxed text-zinc-300">{summary.summary}</p>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Key findings
                  </div>
                  <ul className="space-y-1.5">
                    {summary.key_findings?.map((k, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex gap-2">
                        <span className="text-[hsl(35_100%_62%)]">→</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Keywords
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.keywords?.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[hsl(240_4%_14%)] border border-border text-zinc-300"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
