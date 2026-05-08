-- Praxon — initial schema. Mirrors local JSON store + adds user_id + RLS.
-- Apply via: supabase db push  (or paste in SQL editor)

create extension if not exists "pgcrypto";

-- Projects
create table if not exists projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  system_prompt text not null default '',
  workspace_path text not null,
  memory jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  mcp_servers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_projects_user on projects(user_id);
alter table projects enable row level security;
create policy "own projects" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions (chat threads)
create table if not exists sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text references projects(id) on delete set null,
  title text not null default 'New chat',
  pinned_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sessions_user on sessions(user_id, updated_at desc);
create index if not exists idx_sessions_project on sessions(project_id);
alter table sessions enable row level security;
create policy "own sessions" on sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages
create table if not exists messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool','system')),
  content text not null,
  tool_calls jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_session on messages(session_id, created_at);
alter table messages enable row level security;
create policy "own messages" on messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skills
create table if not exists skills (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  trigger text not null default '',
  system_prompt text not null,
  tool_whitelist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);
alter table skills enable row level security;
create policy "own skills" on skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Scheduled tasks (Routines)
create table if not exists scheduled_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cron text not null,
  prompt text not null,
  project_id text references projects(id) on delete set null,
  enabled boolean not null default true,
  last_run timestamptz,
  next_run timestamptz,
  created_at timestamptz not null default now()
);
alter table scheduled_tasks enable row level security;
create policy "own tasks" on scheduled_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MCP servers
create table if not exists mcp_servers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  command text not null,
  args jsonb not null default '[]'::jsonb,
  env jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table mcp_servers enable row level security;
create policy "own mcp" on mcp_servers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Backpack items (project knowledge)
create table if not exists backpack_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('file','note')),
  path text not null,
  size bigint not null,
  mime text,
  preview text,
  pinned boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_backpack_project on backpack_items(project_id);
alter table backpack_items enable row level security;
create policy "own backpack" on backpack_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Encrypted user keys (BYOK provider keys, stored encrypted at rest by Supabase)
create table if not exists user_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  keys jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table user_keys enable row level security;
create policy "own keys" on user_keys for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit log
create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_user on audit_logs(user_id, created_at desc);
alter table audit_logs enable row level security;
create policy "own audit read" on audit_logs for select using (auth.uid() = user_id);
