import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return NextResponse.json(data, init);
}

export function err(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function safeRoute<T>(
  fn: () => Promise<T>,
): Promise<Response> {
  try {
    const result = await fn();
    if (result instanceof Response) return result;
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV !== "production") {
      console.error("[praxon api]", e);
    }
    return err(msg, 500);
  }
}
