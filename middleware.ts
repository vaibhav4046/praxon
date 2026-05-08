import { NextResponse, type NextRequest } from "next/server";

const RL_WINDOW_MS = 60_000;
const RL_MAX = 120; // per-IP per minute
const buckets = new Map<string, { count: number; resetAt: number }>();

function ipFromReq(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimit(ip: string): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    const fresh = { count: 1, resetAt: now + RL_WINDOW_MS };
    buckets.set(ip, fresh);
    return { ok: true, remaining: RL_MAX - 1, resetAt: fresh.resetAt };
  }
  if (b.count >= RL_MAX) return { ok: false, remaining: 0, resetAt: b.resetAt };
  b.count++;
  return { ok: true, remaining: RL_MAX - b.count, resetAt: b.resetAt };
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isApi = url.pathname.startsWith("/api/");

  // Auth (only when PRAXON_AUTH_TOKEN env is set, opt-in)
  const required = process.env.PRAXON_AUTH_TOKEN;
  if (required && url.pathname !== "/api/health") {
    const cookieToken = req.cookies.get("praxon_auth")?.value;
    const headerToken = req.headers.get("x-praxon-auth") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const token = cookieToken || headerToken;
    if (token !== required) {
      if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (url.pathname !== "/login" && url.pathname !== "/") {
        return NextResponse.redirect(new URL("/login", url));
      }
    }
  }

  // Rate limit (API only)
  if (isApi && url.pathname !== "/api/health") {
    const ip = ipFromReq(req);
    const r = rateLimit(ip);
    const res = r.ok
      ? NextResponse.next()
      : NextResponse.json({ error: "rate_limited", retryAfterMs: r.resetAt - Date.now() }, { status: 429 });
    res.headers.set("X-RateLimit-Limit", String(RL_MAX));
    res.headers.set("X-RateLimit-Remaining", String(r.remaining));
    res.headers.set("X-RateLimit-Reset", String(r.resetAt));
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
