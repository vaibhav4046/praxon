"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Paperclip, Send, Square, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Provider = { name: string; free: boolean; local: boolean };

const SLASH = [
  { cmd: "/research", label: "Deep web research", expand: "Run deep research on: " },
  { cmd: "/code", label: "Write code", expand: "Write code that " },
  { cmd: "/explain", label: "Explain like an expert", expand: "Explain in detail: " },
  { cmd: "/summarize", label: "Summarize a URL", expand: "Fetch and summarize: " },
  { cmd: "/plan", label: "Plan a multi-step task", expand: "Plan a step-by-step approach to: " },
  { cmd: "/agent", label: "Launch autonomous agent", expand: "Run autonomous agent with goal: " },
];

type Skill = { id: string; name: string; description: string };

export function Composer({
  onSend, onStop, onAttach, busy, provider, setProvider, providers,
  skills = [], skillId, setSkillId,
}: {
  onSend: (text: string) => void;
  onStop?: () => void;
  onAttach?: (files: File[]) => void;
  busy: boolean;
  provider?: string;
  setProvider?: (p: string) => void;
  providers: Provider[];
  skills?: Skill[];
  skillId?: string;
  setSkillId?: (id: string | undefined) => void;
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const slashFiltered = SLASH.filter((s) => s.cmd.startsWith(text.trim().toLowerCase().split(/\s/)[0]));

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(220, taRef.current.scrollHeight) + "px";
    }
  }, [text]);

  useEffect(() => {
    setSlashOpen(text.startsWith("/") && slashFiltered.length > 0);
    setSlashIdx(0);
  }, [text, slashFiltered.length]);

  function send() {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setSlashOpen(false);
    onSend(t);
  }

  function applySlash(i: number) {
    const s = slashFiltered[i];
    if (!s) return;
    setText(s.expand);
    setSlashOpen(false);
    setTimeout(() => taRef.current?.focus(), 0);
  }

  function startVoice() {
    type SRConstructor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: ((ev: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; [k: number]: { transcript: string } }> }) => void) | null;
      onend: (() => void) | null;
      onerror: ((ev: Event) => void) | null;
    };
    const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome/Edge or a browser with SpeechRecognition API.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText(((finalText + " " + interim).trim()));
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recRef.current = { stop: () => rec.stop() };
    setRecording(true);
  }

  function stopVoice() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur p-3">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-xl border border-border bg-card/60 focus-within:ring-1 focus-within:ring-ring shadow-sm">
          {slashOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">Slash commands</div>
              {slashFiltered.map((s, i) => (
                <button
                  key={s.cmd}
                  onClick={() => applySlash(i)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent/10", i === slashIdx && "bg-accent/15")}
                >
                  <Zap className="w-3 h-3 text-accent" />
                  <code className="font-mono text-xs">{s.cmd}</code>
                  <span className="text-muted-foreground text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (slashOpen) {
                if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => Math.min(slashFiltered.length - 1, i + 1)); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setSlashIdx((i) => Math.max(0, i - 1)); return; }
                if (e.key === "Tab" || (e.key === "Enter" && slashFiltered.length > 0 && text.trim() === slashFiltered[slashIdx]?.cmd)) {
                  e.preventDefault(); applySlash(slashIdx); return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
              if (e.key === "Escape") setSlashOpen(false);
            }}
            placeholder="Ask Praxon to research, code, automate, browse… (type / for commands)"
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50">
            <div className="flex items-center gap-1">
              <label className="cursor-pointer p-2 rounded-md hover:bg-accent/20 text-muted-foreground" title="Attach files">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) onAttach?.(files);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={recording ? stopVoice : startVoice}
                className={cn(
                  "p-2 rounded-md hover:bg-accent/20 transition-colors",
                  recording ? "text-red-400" : "text-muted-foreground"
                )}
                title={recording ? "Stop recording" : "Voice input"}
                type="button"
              >
                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {providers.length > 0 && setProvider && (
                <select
                  value={provider ?? providers[0]?.name}
                  onChange={(e) => setProvider(e.target.value)}
                  className="ml-1 bg-transparent text-xs text-muted-foreground border-0 focus:outline-none cursor-pointer"
                  title="Pick provider"
                >
                  {providers.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}{p.local ? " (local)" : ""}
                    </option>
                  ))}
                </select>
              )}
              {skills.length > 0 && setSkillId && (
                <select
                  value={skillId ?? ""}
                  onChange={(e) => setSkillId(e.target.value || undefined)}
                  className="bg-transparent text-xs text-muted-foreground border-0 focus:outline-none cursor-pointer"
                  title="Pick skill (overrides system prompt)"
                >
                  <option value="">no skill</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              {busy && onStop ? (
                <button onClick={onStop} className="p-2 rounded-md bg-secondary hover:bg-secondary/80" type="button" title="Stop">
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!text.trim()}
                  className="p-2 rounded-md praxon-gradient text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  type="button"
                  title="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-2">
          Praxon runs on free LLMs. Outputs may vary by provider. <a href="/connections" className="underline hover:text-foreground">Connect more.</a>
        </div>
      </div>
    </div>
  );
}
