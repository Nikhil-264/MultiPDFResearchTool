import { useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatInput({ value, onChange, onSend, onStop, isStreaming, onAttach }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  const submit = () => {
    if (!value.trim() || isStreaming) return;
    onSend();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-5 pt-2 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-[hsl(240_5%_9%)] border border-border rounded-2xl focus-within:border-zinc-500 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything about your indexed PDFs… (Shift+Enter for newline)"
            className="w-full bg-transparent resize-none outline-none px-4 pt-3.5 pb-1 text-[15px] text-zinc-100 placeholder:text-zinc-500 max-h-[200px] thin-scroll"
            data-testid="chat-input"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <button
              onClick={onAttach}
              className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-md hover:bg-[hsl(240_4%_14%)] transition-colors"
              data-testid="attach-pdf-btn"
              title="Attach PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">
                {isStreaming ? "generating…" : "shift + ⏎ newline"}
              </span>
              {isStreaming ? (
                <Button
                  onClick={onStop}
                  variant="secondary"
                  size="sm"
                  className="bg-[hsl(240_4%_14%)] border border-border hover:bg-[hsl(240_4%_18%)] h-8"
                  data-testid="stop-stream-btn"
                >
                  <Square className="w-3.5 h-3.5" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={!value.trim()}
                  size="sm"
                  className="bg-white text-black hover:bg-zinc-200 h-8 disabled:opacity-40"
                  data-testid="send-chat-btn"
                >
                  <ArrowUp className="w-4 h-4" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-center text-zinc-600 mt-2">
          Responses are grounded in your uploaded PDFs. Verify citations before relying on them.
        </p>
      </div>
    </div>
  );
}
