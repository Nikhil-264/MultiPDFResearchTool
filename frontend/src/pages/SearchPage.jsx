import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon, FileText, Loader2, Sparkles } from "lucide-react";
import { semanticSearch } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const segments = text.split(re);
  return segments.map((segment, i) => {
    // Stable key using position offset within the source text.
    const offset = segments.slice(0, i).reduce((n, s) => n + s.length, 0);
    const key = `seg-${offset}-${segment.length}`;
    if (re.test(segment)) {
      return (
        <mark
          key={key}
          className="bg-[hsl(35_100%_62%)]/20 text-[hsl(35_100%_62%)] px-0.5 rounded-sm"
        >
          {segment}
        </mark>
      );
    }
    return <span key={key}>{segment}</span>;
  });
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const setPreview = useAppStore((s) => s.setPreview);

  const run = async (q) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setParams({ q: text });
    try {
      const data = await semanticSearch(text, 8);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ) run(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto thin-scroll" data-testid="search-page">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
            Retrieval
          </div>
          <h1 className="text-3xl tracking-tighter font-medium">Semantic search</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Find the most relevant chunks across your indexed PDFs.
          </p>
        </header>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="e.g. retrieval augmented generation, attention scaling…"
              className="w-full h-11 bg-[hsl(240_4%_10%)] border border-border rounded-lg pl-10 pr-3 text-[15px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              data-testid="search-page-input"
            />
          </div>
          <button
            onClick={() => run()}
            disabled={loading}
            className="h-11 px-5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-50 flex items-center gap-2"
            data-testid="search-page-submit"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Search
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-[hsl(240_4%_10%)] border border-border animate-pulse"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-zinc-500">
            {query ? "No matches yet. Try uploading PDFs first." : "Enter a query above to retrieve chunks."}
          </div>
        ) : (
          <div className="space-y-2.5" data-testid="search-results">
            {results.map((r, i) => {
              const isOpen = expanded === r.id;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-[hsl(240_4%_9%)] hover:border-zinc-600 transition-colors"
                  data-testid={`search-result-${r.id}`}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="w-full p-4 flex items-start gap-3 text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-[hsl(35_100%_62%)]/10 border border-[hsl(35_100%_62%)]/30 text-[hsl(35_100%_62%)] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-100 truncate">
                          {r.filename}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          p.{r.page}
                        </span>
                        <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[hsl(35_100%_62%)]/15 text-[hsl(35_100%_62%)] border border-[hsl(35_100%_62%)]/30">
                          {r.score.toFixed(3)}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-[13.5px] text-zinc-400 leading-relaxed ${
                          !isOpen ? "line-clamp-2" : ""
                        }`}
                      >
                        {highlight(r.text, query)}
                      </p>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 -mt-1 flex justify-end">
                      <button
                        onClick={() =>
                          setPreview({
                            id: r.id,
                            document_id: r.document_id,
                            filename: r.filename,
                            page: r.page,
                            snippet: r.text,
                          })
                        }
                        className="text-[11px] text-[hsl(35_100%_62%)] hover:underline"
                        data-testid={`open-preview-${r.id}`}
                      >
                        Open in PDF preview →
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
