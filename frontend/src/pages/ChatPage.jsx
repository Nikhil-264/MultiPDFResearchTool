import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import MessageBubble from "@/components/chat/MessageBubble";
import StreamingDots from "@/components/chat/StreamingDots";
import ChatInput from "@/components/chat/ChatInput";
import UploadModal from "@/components/upload/UploadModal";
import useChat from "@/hooks/useChat";
import { useParams } from "react-router-dom";

export default function ChatPage() {
  const { sessionId } = useParams();
  const [input, setInput] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const {
    messages,
    streamingText,
    streamingCitations,
    isStreaming,
    scrollerRef,
    send,
    stop,
    regenerate,
  } = useChat(sessionId);

  const handleSend = () => {
    const q = input;
    setInput("");
    send(q);
  };

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full" data-testid="chat-page">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto thin-scroll">
        {!hasContent ? (
          <ChatEmptyState onAsk={(q) => send(q)} onOpenUpload={() => setShowUpload(true)} />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRegenerate={m.role === "assistant" && !isStreaming ? () => regenerate(i) : null}
              />
            ))}
            {isStreaming && (
              <MessageBubble
                streaming
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamingText || "",
                  citations: streamingCitations,
                  created_at: new Date().toISOString(),
                }}
              />
            )}
            {isStreaming && !streamingText && (
              <div className="pl-11">
                <StreamingDots />
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={stop}
        isStreaming={isStreaming}
        onAttach={() => setShowUpload(true)}
      />

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
