import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/store/useAppStore";
import { FileText, BookOpen } from "lucide-react";

export default function PdfPreviewModal() {
  const preview = useAppStore((s) => s.preview);
  const setPreview = useAppStore((s) => s.setPreview);

  return (
    <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
      <DialogContent
        className="bg-[hsl(240_5%_8%)] border-border max-w-2xl"
        data-testid="pdf-preview-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <FileText className="w-4 h-4 text-[hsl(35_100%_62%)]" />
            {preview?.filename}
          </DialogTitle>
        </DialogHeader>
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="px-2 py-0.5 rounded bg-[hsl(35_100%_62%)]/10 text-[hsl(35_100%_62%)] border border-[hsl(35_100%_62%)]/30 font-mono">
                Page {preview.page}
              </span>
              <span className="font-mono">doc · {String(preview.document_id).slice(0, 8)}</span>
            </div>
            <div className="rounded-xl border border-border bg-[hsl(240_4%_5%)] p-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                <BookOpen className="w-3 h-3" />
                Referenced passage
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-200">
                <span className="bg-[hsl(35_100%_62%)]/20 border-b border-[hsl(35_100%_62%)]/40 px-1">
                  {preview.snippet}
                </span>
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 opacity-50">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded bg-zinc-700"
                    style={{ width: `${60 + ((i * 17) % 40)}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">
              Full PDF rendering will be wired to the backend once the RAG pipeline is connected.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
