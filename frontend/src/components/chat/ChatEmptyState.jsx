import { motion } from "framer-motion";
import { Sparkles, BookOpen, GraduationCap, FlaskConical, ScrollText } from "lucide-react";

const SUGGESTIONS = [
  { id: "s-summary", icon: GraduationCap, text: "Summarize the main contribution of each paper" },
  { id: "s-compare", icon: FlaskConical, text: "Compare methodologies across documents" },
  { id: "s-datasets", icon: ScrollText, text: "Extract every dataset & benchmark referenced" },
  { id: "s-open", icon: BookOpen, text: "What are the open research questions raised?" },
];

export default function ChatEmptyState({ onAsk, onOpenUpload }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-[hsl(240_4%_10%)] text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-6">
          <Sparkles className="w-3 h-3 text-[hsl(35_100%_62%)]" /> Paperloop · Research assistant
        </div>
        <h1 className="text-4xl sm:text-5xl tracking-tighter font-medium text-zinc-100">
          Ask anything across your <span className="text-[hsl(35_100%_62%)]">PDFs</span>
        </h1>
        <p className="mt-4 text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Drop in your research library and get answers with inline citations, page references,
          and semantic context — grounded in your own corpus.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-2.5 text-left">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => onAsk(s.text)}
                className="group flex items-start gap-2.5 p-4 rounded-xl border border-border bg-[hsl(240_4%_9%)] hover:bg-[hsl(240_4%_12%)] hover:border-zinc-600 transition-all"
                data-testid={`suggestion-${s.id}`}
              >
                <div className="w-7 h-7 rounded-md bg-[hsl(240_4%_14%)] border border-border flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[hsl(35_100%_62%)]" />
                </div>
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100">{s.text}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            onClick={onOpenUpload}
            className="text-xs text-zinc-500 hover:text-zinc-200 underline underline-offset-4"
            data-testid="open-upload-from-empty"
          >
            or upload PDFs to get started →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
