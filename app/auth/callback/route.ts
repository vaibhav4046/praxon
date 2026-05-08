import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/login", req.url));
  const supa = await getSupabaseServer();
  if (!supa) return NextResponse.redirect(new URL("/login?err=no-supabase", req.url));
  const { error } = await supa.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(error.message)}`, req.url));
  return NextResponse.redirect(new URL(next, req.url));
}
