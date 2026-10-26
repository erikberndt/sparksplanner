-- sparksplanner – Tabelle für die Ist-Stunden
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen.
-- Darf mehrfach ausgeführt werden, bestehende Stunden bleiben erhalten.

create table if not exists public.ds_hours (
  id         text primary key,
  hours      numeric(7,1) not null default 0 check (hours >= 0),
  updated_at timestamptz not null default now()
);

-- Row Level Security an, ohne Policies: Zugriff nur über den Server
-- (Secret/Service-Role-Key in Vercel), nicht über öffentliche Schlüssel.
alter table public.ds_hours enable row level security;
revoke all on public.ds_hours from anon, authenticated;

-- Startwerte aus dem bisherigen Tracking (Stand 16.10.2026)
insert into public.ds_hours (id, hours) values
  ('r_leitung-okr-1', 16),
  ('r_meetings', 23),
  ('r_support-marketing', 14)
on conflict (id) do nothing;

-- Stunden als Differenz addieren (+0.5 / −0.5), nie unter 0.
-- Atomar, damit gleichzeitige Klicks sich nicht überschreiben.
create or replace function public.ds_add_hours(changes jsonb)
returns setof public.ds_hours
language plpgsql
set search_path = ''
as $$
declare
  k text;
  d numeric;
begin
  for k, d in select key, value::numeric from jsonb_each_text(changes) loop
    insert into public.ds_hours as t (id, hours) values (k, greatest(0, d))
    on conflict (id) do update set hours = greatest(0, t.hours + d), updated_at = now();
  end loop;
  return query select * from public.ds_hours;
end;
$$;

revoke execute on function public.ds_add_hours(jsonb) from public, anon, authenticated;
grant execute on function public.ds_add_hours(jsonb) to service_role;

-- Anpassbare Anzeigenamen (id = Login-Kennung aus PLANNER_USERS, bleibt fest)
create table if not exists public.ds_names (
  id         text primary key,
  name       text not null check (char_length(name) between 1 and 40),
  updated_at timestamptz not null default now()
);
alter table public.ds_names enable row level security;
revoke all on public.ds_names from anon, authenticated;
grant select, insert, update on public.ds_names to service_role;
