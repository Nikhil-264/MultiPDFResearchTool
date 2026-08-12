import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { toast } from "sonner";
import UploadItem from "./UploadItem";

function isPdf(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function makeItemId(file) {
  return `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateFiles(files) {
  const pdfs = Array.from(files).filter(isPdf);
  if (pdfs.length === 0) {
    toast.error("Only PDF files are supported");
    return null;
  }
  return pdfs.map((f) => ({
    id: makeItemId(f),
    file: f,
    progress: 0,
    status: "uploading",
  }));
}

export default function UploadDropzone({ onComplete }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState([]);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const uploadOne = useCallback(
    async (item) => {
      try {
        await uploadDocument(item.file, (pct) => updateItem(item.id, { progress: pct }));
        updateItem(item.id, { status: "done", progress: 100 });
        toast.success(`Indexed ${item.file.name}`);
        onComplete?.();
      } catch (err) {
        console.error("Upload failed:", err);
        updateItem(item.id, { status: "failed", err: err.message });
        toast.error(`Failed: ${item.file.name}`);
      }
    },
    [updateItem, onComplete]
  );

  const handleFiles = useCallback(
    async (files) => {
      const newItems = validateFiles(files);
      if (!newItems) return;
      setItems((prev) => [...newItems, ...prev]);
      for (const it of newItems) {
        await uploadOne(it);
      }
    },
    [uploadOne]
  );

  return (
    <div className="w-full">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        animate={{ scale: dragOver ? 1.01 : 1 }}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-colors ${
          dragOver
            ? "border-[hsl(35_100%_62%)] bg-[hsl(35_100%_62%)]/5"
            : "border-border bg-[hsl(240_4%_8%)] hover:border-zinc-600"
        }`}
        data-testid="upload-pdf-dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-testid="upload-dropzone-input"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[hsl(240_4%_12%)] border border-border flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <div className="text-base font-medium text-zinc-100">
              Drop PDFs here or <span className="text-[hsl(35_100%_62%)] underline">browse</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Multiple files supported · Max ~20MB per file (mock)
            </div>
          </div>
        </div>
      </motion.div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((it) => (
            <UploadItem key={it.id} item={it} onRemove={removeItem} />
          ))}
        </div>
      )}
    </div>
  );
}
