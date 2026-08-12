import { motion, AnimatePresence } from "framer-motion";
import { FileText, ExternalLink, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function RightSidebar() {
  const activeCitations = useAppStore((s) => s.activeCitations);
  const focusedCitationId = useAppStore((s) => s.focusedCitationId);
  const setPreview = useAppStore((s) => s.setPreview);

  return (
    <aside
      className="w-[320px] h-full border-l border-border bg-[hsl(240_5%_7%)] overflow-y-auto thin-scroll flex flex-col shrink-0"
      data-testid="right-sidebar"
    >
      <div className="px-5 pt-5 pb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Retrieved Sources
        </div>
        <div className="text-sm text-zinc-300 mt-1.5">
          Citations attached to the most recent AI response
        </div>
      </div>

      <div className="px-4 pb-6 space-y-2.5 flex-1">
        <AnimatePresence mode="popLayout">
          {activeCitations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-dashed border-border rounded-lg p-5 text-xs text-zinc-500 leading-relaxed"
              data-testid="right-sidebar-empty"
            >
              No sources yet. When the assistant cites your PDFs, they'll surface here with page
              numbers and snippets.
            </motion.div>
          ) : (
            activeCitations.map((c, i) => {
              const focused = focusedCitationId === c.id;
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  onClick={() => setPreview(c)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    focused
                      ? "border-[hsl(35_100%_62%)]/60 bg-[hsl(35_100%_62%)]/5 shadow-[0_0_25px_-12px_rgba(255,179,64,0.4)]"
                      : "border-border bg-[hsl(240_4%_10%)] hover:border-[hsl(35_100%_62%)]/40 hover:bg-[hsl(240_4%_12%)]"
                  }`}
                  data-testid={`citation-card-${c.id}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[hsl(35_100%_62%)]/15 border border-[hsl(35_100%_62%)]/30 text-[hsl(35_100%_62%)] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[hsl(35_100%_62%)]">
                          [{i + 1}]
                        </span>
                        <span className="text-sm font-medium text-zinc-100 truncate">
                          {c.filename}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        Page {c.page}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-400 line-clamp-3">
                    {c.snippet}
                  </p>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 py-3 border-t border-border text-[10px] text-zinc-600 font-mono">
        Grounded via local retriever (mock). Connect Ollama + Chroma later.
      </div>
    </aside>
  );
}
