import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, RefreshCw, Check, User } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { toast } from "sonner";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessageBubble({ message, onRegenerate, streaming }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyMsg = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.role}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-md bg-[hsl(35_100%_62%)]/15 border border-[hsl(35_100%_62%)]/30 text-[hsl(35_100%_62%)] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
          AI
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[88%]`}>
        {isUser ? (
          <div className="bg-[hsl(240_5%_11%)] border border-border rounded-2xl rounded-tr-sm px-4 py-3 text-zinc-100 shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
          </div>
        ) : (
          <div className={`text-zinc-200 ${streaming ? "stream-cursor" : ""}`}>
            <MarkdownRenderer content={message.content} citations={message.citations || []} />
          </div>
        )}

        <div
          className={`flex items-center gap-2 mt-1.5 px-1 text-[10px] text-zinc-600 ${
            isUser ? "flex-row-reverse" : ""
          }`}
        >
          <span className="font-mono">{formatTime(message.created_at)}</span>
          {!isUser && !streaming && (
            <>
              <span>·</span>
              <button
                onClick={copyMsg}
                className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                data-testid={`copy-msg-${message.id}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                copy
              </button>
              {onRegenerate && (
                <>
                  <span>·</span>
                  <button
                    onClick={onRegenerate}
                    className="hover:text-zinc-300 transition-colors flex items-center gap-1"
                    data-testid={`regen-msg-${message.id}`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    regenerate
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 text-black flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}
