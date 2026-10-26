-- sparksplanner – Umstellung auf halbe Stunden (Oktober 2026)
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen, BEVOR der neue Code live geht.
-- Bestehende Stunden bleiben erhalten: Die Spalte wird nur von Ganzzahl auf
-- Dezimalzahl umgestellt (z. B. 23 → 23.0). Es wird nichts gelöscht.
-- Darf mehrfach ausgeführt werden.

begin;

-- 1. Spalte umstellen, Werte werden 1:1 übernommen
alter table public.ds_hours
  alter column hours type numeric(7,1) using hours::numeric(7,1);

-- 2. Addier-Funktion auf Dezimalzahlen umstellen
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

commit;

-- 3. Kontrolle: zeigt alle Stunden nach der Umstellung
select id, hours from public.ds_hours order by id;
