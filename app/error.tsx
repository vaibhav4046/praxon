"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[praxon] error:", error);
  }, [error]);
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md w-full rounded-2xl glass-strong p-8 text-center anim-scale-in">
        <div className="w-12 h-12 rounded-full bg-destructive/10 grid place-items-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Something broke.</h1>
        <p className="text-sm text-muted-foreground mb-6">{error.message || "Unknown error"}</p>
        {error.digest && <code className="text-[10px] text-muted-foreground/60 block mb-4">digest: {error.digest}</code>}
        <div className="flex gap-2 justify-center">
          <button onClick={() => reset()} className="px-3 py-2 rounded-lg praxon-gradient text-white text-sm flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
          <Link href="/" className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </div>
    </main>
  );
}
