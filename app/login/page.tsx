"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import { PraxonLogo } from "@/components/brand/logo";
import { getSupabaseBrowser, isSupabaseConfiguredBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [supaMode, setSupaMode] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setSupaMode(isSupabaseConfiguredBrowser());
    const e = search.get("err");
    if (e) setErr(e);
  }, [search]);

  async function tokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    document.cookie = `praxon_auth=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    const r = await fetch("/api/health", { headers: { "x-praxon-auth": token } });
    if (r.ok) router.push("/dashboard");
    else setErr("Wrong token");
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const supa = getSupabaseBrowser();
      if (!supa) { setErr("Supabase not configured"); return; }
      const { error } = await supa.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setErr(error.message); return; }
      toast.success(`Magic link sent to ${email} — check your inbox.`);
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl glass-strong p-8 anim-scale-in crt anim-scanline">
        <div className="flex items-center gap-2 mb-6">
          <PraxonLogo size={28} animated />
          <span className="font-mono font-semibold">PRAXON</span>
        </div>
        <h1 className="text-xl font-semibold mb-1 flex items-center gap-2 font-mono">
          <Lock className="w-4 h-4 text-accent" /> {supaMode ? "Sign in" : "Auth required"}
        </h1>
        <p className="text-sm text-muted-foreground mb-5 font-mono">
          {supaMode ? "Magic link login via Supabase Auth." : "Enter the access token. (PRAXON_AUTH_TOKEN env)"}
        </p>

        {supaMode ? (
          <form onSubmit={magicLink}>
            <label className="text-[10px] font-mono text-accent/80 uppercase tracking-wider">Email</label>
            <div className="mt-1 mb-3 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm font-mono"
                autoFocus
              />
            </div>
            {err && <div className="text-xs text-destructive mb-3 font-mono">{err}</div>}
            <button type="submit" disabled={busy} className="w-full px-3 py-2 rounded-lg praxon-gradient text-black text-sm font-mono font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              SEND MAGIC LINK
            </button>
            <div className="mt-4 text-[10px] text-muted-foreground font-mono text-center">
              No account? Click the link to auto-create one.
            </div>
          </form>
        ) : (
          <form onSubmit={tokenSubmit}>
            <input
              type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="Token"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono mb-3"
              autoFocus
            />
            {err && <div className="text-xs text-destructive mb-3">{err}</div>}
            <button type="submit" className="w-full px-3 py-2 rounded-lg praxon-gradient text-black text-sm font-mono font-bold">UNLOCK</button>
          </form>
        )}
      </div>
    </main>
  );
}
