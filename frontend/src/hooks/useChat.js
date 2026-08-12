import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createSession, listMessages, sendChat, streamChat } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

/**
 * useChat — encapsulates session messages, sending, and SSE streaming.
 */
export default function useChat(sessionId) {
  const navigate = useNavigate();
  const setActiveCitations = useAppStore((s) => s.setActiveCitations);
  const settings = useAppStore((s) => s.settings);
  const streamingEnabled = settings.streaming;

  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [streamingCitations, setStreamingCitations] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);
  const scrollerRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  // Load existing messages whenever sessionId changes.
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setActiveCitations([]);
      return undefined;
    }
    let cancelled = false;
    listMessages(sessionId)
      .then((m) => {
        if (cancelled) return;
        setMessages(m);
        const lastAssistant = [...m].reverse().find((x) => x.role === "assistant");
        setActiveCitations(lastAssistant?.citations || []);
        scrollToEnd();
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        toast.error("Could not load chat history");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, setActiveCitations, scrollToEnd]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const s = await createSession("New Chat");
    navigate(`/c/${s.id}`, { replace: true });
    return s.id;
  }, [sessionId, navigate]);

  const appendUserMessage = useCallback(
    (sid, text) => {
      const msg = {
        id: `u-${Date.now()}`,
        session_id: sid,
        role: "user",
        content: text,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((p) => [...p, msg]);
      scrollToEnd();
      return msg;
    },
    [scrollToEnd]
  );

  const runStream = useCallback(
    async (sid, text) => {
      const controller = new AbortController();
      abortRef.current = controller;
      let aiId = null;
      let acc = "";
      let cites = [];

      const onMeta = (m) => {
        aiId = m.id;
        cites = m.citations || [];
        setStreamingCitations(cites);
        setActiveCitations(cites);
      };
      const onToken = (t) => {
        acc += t;
        setStreamingText(acc);
        scrollToEnd();
      };
      const onDone = () => {
        setMessages((p) => [
          ...p,
          {
            id: aiId || `a-${Date.now()}`,
            session_id: sid,
            role: "assistant",
            content: acc,
            citations: cites,
            created_at: new Date().toISOString(),
          },
        ]);
        setStreamingText("");
        setStreamingCitations([]);
        setIsStreaming(false);
        abortRef.current = null;
      };
      const onError = (err) => {
        console.error("Stream error:", err);
        toast.error("Stream failed");
        setIsStreaming(false);
      };

      await streamChat(sid, text, {
        onMeta,
        onToken,
        onDone,
        onError,
        signal: controller.signal,
      }, settings);
    },
    [setActiveCitations, scrollToEnd, settings]
  );

  const runRequest = useCallback(
    async (sid, text) => {
      try {
        const ai = await sendChat(sid, text, settings);
        setMessages((p) => [...p, ai]);
        setActiveCitations(ai.citations || []);
      } catch (err) {
        console.error("Send chat failed:", err);
        toast.error("Failed to send");
      } finally {
        setIsStreaming(false);
      }
    },
    [setActiveCitations, settings]
  );

  const send = useCallback(
    async (text) => {
      const q = (text || "").trim();
      if (!q || isStreaming) return;
      const sid = await ensureSession();
      appendUserMessage(sid, q);
      setStreamingText("");
      setStreamingCitations([]);
      setIsStreaming(true);
      if (streamingEnabled) {
        await runStream(sid, q);
      } else {
        await runRequest(sid, q);
      }
    },
    [isStreaming, ensureSession, appendUserMessage, streamingEnabled, runStream, runRequest]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    if (streamingText) {
      setMessages((p) => [
        ...p,
        {
          id: `a-${Date.now()}`,
          session_id: sessionId,
          role: "assistant",
          content: streamingText + "\n\n*(stopped)*",
          citations: streamingCitations,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreamingText("");
    }
  }, [streamingText, streamingCitations, sessionId]);

  const regenerate = useCallback(
    (idx) => {
      const userBefore = [...messages.slice(0, idx)].reverse().find((m) => m.role === "user");
      if (!userBefore) return;
      setMessages((p) => p.slice(0, idx));
      send(userBefore.content);
    },
    [messages, send]
  );

  return {
    messages,
    streamingText,
    streamingCitations,
    isStreaming,
    scrollerRef,
    send,
    stop,
    regenerate,
  };
}
