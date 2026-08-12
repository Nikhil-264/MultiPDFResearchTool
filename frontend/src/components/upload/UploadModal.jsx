import { motion } from "framer-motion";
import UploadDropzone from "@/components/upload/UploadDropzone";

export default function UploadModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="upload-modal"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[hsl(240_5%_8%)] border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-medium mb-1">Add PDFs to your library</h3>
        <p className="text-xs text-zinc-500 mb-4">
          Documents are indexed and made searchable. (Mock pipeline.)
        </p>
        <UploadDropzone />
      </motion.div>
    </div>
  );
}
