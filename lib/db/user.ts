import "server-only";
import { isSupabaseConfigured, isSupabaseAdminConfigured, getCurrentUser, getSupabaseServer, getSupabaseAdmin } from "../supabase/server";

export const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000000";

/** Returns the current user's id. Uses Supabase Auth when signed in, else a stable local sentinel. */
export async function getUserId(): Promise<string> {
  if (!isSupabaseConfigured()) return LOCAL_USER_ID;
  const u = await getCurrentUser();
  return u?.id ?? LOCAL_USER_ID;
}

/** Cheap synchronous check — true when Supabase env vars are set. Doesn't verify session. */
export function supabaseEnabled(): boolean {
  return isSupabaseConfigured();
}

/**
 * Returns the right Supabase client for backend ops:
 *  - If user is signed in → user-scoped client (RLS by auth.uid())
 *  - Else → admin client w/ service role (bypasses RLS, scopes manually via LOCAL_USER_ID)
 *  - If neither configured → null (callers fall back to JSON store)
 */
export async function getDbClient() {
  const userClient = await getSupabaseServer();
  if (userClient) {
    const { data } = await userClient.auth.getUser();
    if (data.user) return userClient;
  }
  if (isSupabaseAdminConfigured()) return getSupabaseAdmin();
  return userClient;
}

