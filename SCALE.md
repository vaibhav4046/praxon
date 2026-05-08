# Praxon — Scale-up roadmap (toward 100k+ users)

Praxon ships as a single-user local-first MVP. Multi-tenant production at 100k users needs the items below. None are blockers for solo or small-team use today.

## Phase 1 — Multi-user (1k users)

**Auth**
- Replace `PRAXON_AUTH_TOKEN` env (single shared token) with Supabase Auth or Clerk.
- Per-user `userId` column on every store.
- Session cookies via `@supabase/ssr` or `iron-session`.

**Storage**
- Swap JSON file store → Supabase Postgres.
- Tables mirror current schemas: `projects`, `sessions`, `messages`, `skills`, `tasks`, `mcp_servers`, `backpack_items`.
- Add `user_id uuid not null` + RLS policies (`auth.uid() = user_id`).
- Workspaces dir per user: `/data/{userId}/{projectId}/`.

**Migration sketch**
```sql
-- supabase migration
create table projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text default '',
  system_prompt text default '', workspace_path text not null,
  memory jsonb default '[]', skills jsonb default '[]',
  mcp_servers jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table projects enable row level security;
create policy "own projects" on projects for all using (auth.uid() = user_id);
-- repeat for sessions, messages, skills, tasks, mcp_servers, backpack_items
```

## Phase 2 — Scale (10k users)

**Queue + workers**
- Long-running agent loops + scheduled routines must not block API workers.
- Add Redis (Upstash free tier) + BullMQ.
- Move `runAutonomous`, `runDeepResearch`, cron tasks → background workers.
- Streaming chat stays in API route (short-lived).

**Browser pool**
- Per-session Playwright is fine for solo. Multi-user needs context pool with hard concurrency cap (e.g. 20 max contexts) + LRU eviction.
- Or use Browserbase / Hyperbrowser (managed Chromium) — bills per session.

**Caching**
- LLM response caching via Anthropic prompt cache or upstream (works automatically once Anthropic provider is on).
- Repeated tool results (e.g. Tavily search for same query within 5 min) → Redis cache.

## Phase 3 — Production hardening (100k users)

**Horizontal scaling**
- Stateless Next.js app pods behind load balancer.
- Sticky sessions only for SSE streams (or move streaming to Cloudflare Workers).
- Scheduler runs in single leader node (use Postgres advisory lock).

**Rate limiting**
- Replace in-memory token bucket → Upstash Redis rate-limit (per-user + per-IP).
- LLM provider keys per-user (BYOK) to avoid shared quota collapse.

**Observability**
- Sentry for errors.
- Posthog for product analytics.
- Structured logs (pino) → Better Stack / Datadog.
- Health checks + uptime monitoring.

**Compliance**
- SOC2 prep — audit logs (`audit_logs` table), data retention policies, GDPR delete flow.
- Encryption at rest (Supabase default) + KMS for API keys (don't store plaintext in DB).

## Estimated effort

| Phase | Work | Time |
|---|---|---|
| 1 | Auth + Postgres swap + RLS | 5–7 days |
| 2 | Redis + workers + browser pool | 7–10 days |
| 3 | Hardening + observability + compliance | 10–14 days |
| **Total** | **3–4 weeks for 100k-ready** | |

This is what I'd ship next if the goal is paying customers + business adoption.
