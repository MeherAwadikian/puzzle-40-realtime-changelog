-- Puzzle #40 schema (applied to the live Supabase project via MCP apply_migration).

create table if not exists public.puzzle40_changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  body text not null,
  entry_type text not null default 'feature',  -- feature | fix | improvement
  created_at timestamptz not null default now()
);

alter table public.puzzle40_changelog enable row level security;

-- Public read only; writes are admin/service-role/dashboard, never anon.
create policy "puzzle40 public read"
  on public.puzzle40_changelog for select to anon using (true);

-- Broadcast INSERTs over Realtime.
alter publication supabase_realtime add table public.puzzle40_changelog;
