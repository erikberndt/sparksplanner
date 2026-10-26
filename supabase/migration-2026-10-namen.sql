-- sparksplanner – anpassbare Anzeigenamen (Oktober 2026)
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Legt nur eine neue Tabelle an, die Stunden (ds_hours) werden nicht angefasst.
-- Darf mehrfach ausgeführt werden.

create table if not exists public.ds_names (
  id         text primary key,
  name       text not null check (char_length(name) between 1 and 40),
  updated_at timestamptz not null default now()
);

-- Wie bei ds_hours: Zugriff nur über den Server (Secret/Service-Role-Key)
alter table public.ds_names enable row level security;
revoke all on public.ds_names from anon, authenticated;
grant select, insert, update on public.ds_names to service_role;

-- Kontrolle
select id, name from public.ds_names order by id;
