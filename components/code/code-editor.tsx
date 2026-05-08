"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const Monaco = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

const EXT_LANG: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
  json: "json", md: "markdown", html: "html", css: "css", scss: "scss",
  yml: "yaml", yaml: "yaml", sh: "shell", toml: "ini", env: "ini",
  sql: "sql", c: "c", cpp: "cpp", h: "c", hpp: "cpp",
};

export function CodeEditor({
  path, value, onChange, readOnly,
}: {
  path: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const lang = useMemo(() => {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    return EXT_LANG[ext] ?? "plaintext";
  }, [path]);
  return (
    <Monaco
      height="100%"
      language={lang}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        lineNumbers: "on",
        readOnly,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}
