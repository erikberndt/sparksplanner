# sparksplanner

Monatsplanung und geteiltes Stunden-Tracking für ein Teammitglied im Projekt Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

## Stack
- Statische Seite ohne Build: `index.html`, `styles.css`, `plan.js` (Daten), `app.js` (Darstellung + Tracking)
- `api/hours.js`: Vercel Serverless Function, speichert Ist-Stunden in Supabase (REST, Tabelle `ds_hours`, RPC `ds_add_hours`; Schema in `supabase/schema.sql`, RLS an ohne Policies → nur Server-Key)
- `api/login.js` + `api/_auth.js`: Login-Modal, signiertes HttpOnly-Cookie (30 Tage); `api/hours.js` antwortet ohne Login mit 401
- Env-Variablen: `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (oder `SUPABASE_SERVICE_ROLE_KEY`), `PLANNER_USERS` (`gina:passwort,…`), optional `PLANNER_SECRET`

## Regeln
- Planänderungen nur in `plan.js` (`rows`: `p` Person, `fl` Freelance, `ag` Agentur, `blocker`/`prio`).
- Paket-`id`s nie ändern (sonst Zähler bei 0). Neue Pakete auch in `api/hours.js` unter `IDS` eintragen.
- Passwörter nie ins Repo (öffentlich!), nur in `PLANNER_USERS` auf Vercel. Namen fürs Dropdown in `plan.js` unter `users`.
- Datenschutz: `plan.js` ist trotz Login öffentlich lesbar (statisch + öffentliches Repo); geschützt sind nur die Ist-Stunden.

## Status
- 2026-10-21: Aus `~/Downloads/planner` übernommen, Git-Repo (`main`) angelegt.
- GitHub: https://github.com/erikberndt/sparksplanner (öffentlich). Vercel: https://sparksplanner.vercel.app (persönlicher Account).
- Login-Modal eingebaut. Speicher von Upstash auf Supabase umgestellt (Wunsch: Open Source). Auf Vercel noch nötig: Supabase verbinden, `supabase/schema.sql` ausführen, `PLANNER_USERS` setzen, redeployen.
