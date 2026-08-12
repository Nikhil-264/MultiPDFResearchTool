import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import CitationChip from "./CitationChip";

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);
  const value = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-[hsl(240_4%_8%)] rounded-t-[10px]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
          {match?.[1] || "code"}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={match?.[1] || "text"}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "transparent",
          fontSize: "12.5px",
          lineHeight: 1.6,
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

function tokenize(content) {
  // Split on citation markers [N] while preserving them; assign stable ids per occurrence.
  const re = /\[(\d+)\]/g;
  const parts = [];
  let lastIdx = 0;
  let occurrence = 0;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIdx) {
      parts.push({
        kind: "md",
        key: `md-${parts.length}-${lastIdx}`,
        text: content.slice(lastIdx, m.index),
      });
    }
    parts.push({
      kind: "cite",
      key: `cite-${occurrence}-${m.index}`,
      index: parseInt(m[1], 10) - 1,
    });
    occurrence += 1;
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    parts.push({
      kind: "md",
      key: `md-${parts.length}-${lastIdx}`,
      text: content.slice(lastIdx),
    });
  }
  return parts;
}

export default function MarkdownRenderer({ content, citations = [] }) {
  const parts = tokenize(content);
  return (
    <div className="md-body">
      {parts.map((part) => {
        if (part.kind === "cite") {
          const c = citations[part.index];
          if (c) return <CitationChip key={part.key} index={part.index + 1} citation={c} />;
          return <span key={part.key}>[{part.index + 1}]</span>;
        }
        return (
          <ReactMarkdown
            key={part.key}
            remarkPlugins={[remarkGfm]}
            components={{ code: CodeBlock }}
          >
            {part.text}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
