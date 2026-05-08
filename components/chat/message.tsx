"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot, User, Wrench, Check, Loader2, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ChatMsg = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolCalls?: { id: string; name: string; args: Record<string, unknown>; status?: string }[];
  provider?: string;
  streaming?: boolean;
};

export function Message({ m, onRegenerate }: { m: ChatMsg; onRegenerate?: () => void }) {
  const isUser = m.role === "user";

  function copyMsg() {
    navigator.clipboard.writeText(m.content);
    toast.success("Copied");
  }

  return (
    <div className={cn("group flex gap-3 px-4 py-5 anim-fade-up", isUser ? "" : "bg-muted/20")}>
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-lg grid place-items-center text-[10px] font-medium",
        isUser ? "bg-secondary border border-border" : "praxon-gradient praxon-glow"
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium">{isUser ? "You" : "Praxon"}</span>
          {m.provider && !isUser && (
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">{m.provider}</span>
          )}
        </div>
        {m.toolCalls && m.toolCalls.length > 0 && (
          <div className="space-y-1">
            {m.toolCalls.map((tc) => (
              <div key={tc.id} className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card/40 anim-fade-in">
                <Wrench className="w-3 h-3 text-accent" />
                <code className="font-mono text-[11px]">{tc.name}</code>
                <span className="text-muted-foreground truncate flex-1">{JSON.stringify(tc.args).slice(0, 120)}</span>
                {tc.status === "running" ? <Loader2 className="w-3 h-3 animate-spin text-accent" /> : <Check className="w-3 h-3 text-green-500" />}
              </div>
            ))}
          </div>
        )}
        {m.content && (
          <div className="prose prose-sm prose-invert max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
                code: ({ className, children, ...props }) => {
                  const inline = !className;
                  return inline ? (
                    <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]" {...props}>{children}</code>
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  );
                },
                a: ({ children, ...props }) => (
                  <a className="text-accent hover:underline" target="_blank" rel="noreferrer" {...props}>{children}</a>
                ),
              }}
            >
              {m.content}
            </ReactMarkdown>
            {m.streaming && <span className="inline-block w-2 h-4 ml-0.5 bg-accent anim-cursor align-text-bottom" />}
          </div>
        )}
        {!m.content && m.streaming && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: "fadeIn 1s ease-in-out infinite" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: "fadeIn 1s ease-in-out infinite", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: "fadeIn 1s ease-in-out infinite", animationDelay: "300ms" }} />
            </span>
            Thinking…
          </div>
        )}
        {!isUser && m.content && !m.streaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyMsg} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/10 text-[10px] text-muted-foreground" title="Copy">
              <Copy className="w-3 h-3" /> Copy
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/10 text-[10px] text-muted-foreground" title="Regenerate">
                <RotateCcw className="w-3 h-3" /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  function copy() {
    const text = extractText(children);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className="relative group/code my-2">
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 rounded bg-card/80 border border-border text-[10px] flex items-center gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity"
      >
        {copied ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
      </button>
      <pre className="rounded-lg border border-border bg-card/60 p-3 overflow-x-auto text-xs" {...props}>{children}</pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}
