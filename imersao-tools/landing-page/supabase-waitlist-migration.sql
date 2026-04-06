-- ============================================
-- TABELA: waitlist
-- ============================================
create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text unique not null,
  source     text default 'lista-espera', -- 'lista-espera' | 'guia-gratis'
  created_at timestamptz default now()
);

-- RLS: insert público (sem autenticação), leitura apenas admin
alter table public.waitlist enable row level security;

create policy "waitlist_insert_public"
  on public.waitlist for insert
  to anon
  with check (true);

create policy "waitlist_read_authenticated"
  on public.waitlist for select
  to authenticated
  using (true);
