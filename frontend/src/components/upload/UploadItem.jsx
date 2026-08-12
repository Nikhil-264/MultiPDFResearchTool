import { FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function StatusIcon({ status }) {
  if (status === "uploading") return <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />;
  if (status === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "failed") return <AlertCircle className="w-4 h-4 text-red-400" />;
  return null;
}

export default function UploadItem({ item, onRemove }) {
  return (
    <div
      className="flex items-center gap-3 bg-[hsl(240_4%_10%)] border border-border rounded-lg p-3"
      data-testid={`upload-item-${item.id}`}
    >
      <div className="w-9 h-9 rounded-md bg-[hsl(240_4%_14%)] flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-zinc-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-zinc-100 truncate">{item.file.name}</div>
          <div className="text-[11px] text-zinc-500 font-mono">{fmtBytes(item.file.size)}</div>
        </div>
        <div className="mt-1.5 h-1 bg-[hsl(240_4%_14%)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              item.status === "failed" ? "bg-red-500" : "bg-[hsl(35_100%_62%)]"
            }`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <StatusIcon status={item.status} />
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 rounded hover:bg-[hsl(240_4%_16%)] text-zinc-500 hover:text-zinc-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
