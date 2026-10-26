# sparksplanner

Planungs-Dashboards und geteiltes Stunden-Tracking für Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027. Leitidee: jedes Konto sieht genau das Dashboard, das es braucht (Personen, Kurse, später Teams).

## Stack
- Statische Seite ohne Build: `index.html`, `styles.css`, `plan.js` (Daten), `app.js` (Darstellung + Tracking)
- `plan.js`: `users[]` (id, n, dashboards[]) + `dashboards{}` mit `type`:
  - `person` → `renderPerson` (Monatsmatrix, Monats-Tabs mobil ≤720px, localStorage `sp-month`)
  - `kurse` → `renderKurse` (Kurse untereinander, je Kurs immer alle `packages`; `t` gesamt, `fl`/`ag` davon extern; „offen“ wenn Tage aber kein `who`)
  - `PLAN.trackIds(d)` / `PLAN.kurseId(c,p)` = Stunden-Schlüssel, von Seite UND Server genutzt
- Mehrere Dashboards je Konto → Tabs `#dtabs` (localStorage `sp-dash-<user>`)
- `api/hours.js`: Supabase REST, Tabelle `ds_hours`, RPC `ds_add_hours`; erlaubte ids je Konto via `api/_plan.js` (lädt plan.js mit Fake-`window`). Stunden in halben Schritten (`numeric(7,1)`, Klick = ±0,5 h)
- `api/_supabase.js`: gemeinsamer REST-Zugriff; RLS an ohne Policies → nur Server-Key
- `api/login.js` + `api/_auth.js`: Login-Modal, signiertes HttpOnly-Cookie (30 Tage); `api/hours.js` ohne Login → 401
- Export/Import je aktuellem Dashboard: JSON `{app, dashboard, exported, hours:{id:h}, rows}`; Import → `POST /api/hours {set}`
- `og.png`: Social Image (1200×630), Quelle `og/og.html` (liest `dashboards.person`), Render-Befehl im Kommentar
- `.vercelignore`: og/, supabase/, Doku werden nicht deployed
- Env-Variablen: `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (oder `SUPABASE_SERVICE_ROLE_KEY`), `PLANNER_USERS` (`member1:pw,member2:pw`), optional `PLANNER_SECRET`

## Regeln
- Planänderungen nur in `plan.js`. Paket-, Zeilen- und Kurs-`id`s nie ändern (sonst Zähler bei 0). Keine zweite id-Liste mehr in der API.
- Neuer Dashboard-Typ: Render-Funktion in `app.js` (gibt `{track, sums}` zurück) + Zweig in `PLAN.trackIds`.
- PRIO-Label: `prio: true` an Zeilen, Anzeige per `showPrio` (aktuell aus).
- Passwörter nie ins Repo (öffentlich!), nur in `PLANNER_USERS` auf Vercel.
- Datenschutz: `plan.js` ist trotz Login öffentlich lesbar (statisch + öffentliches Repo), inkl. Vornamen bei „Wer“; geschützt sind nur die Ist-Stunden.
- Nutzer-/Datei-Eingaben nie per innerHTML einsetzen.

## Status
- 2026-10-21: Aus `~/Downloads/planner` übernommen. GitHub https://github.com/erikberndt/sparksplanner (öffentlich), Vercel https://sparksplanner.vercel.app (persönlicher Account), Supabase verbunden.
- 2026-10-26: Halbe Stunden (Migration `supabase/migration-2026-10-halbe-stunden.sql` in Supabase gelaufen).
- 2026-10-26: Namensänderung per Klick wieder entfernt (Tabelle `ds_names` evtl. noch in Supabase, ungenutzt). Dashboards eingeführt: member1 → `person`, member2 → `sparks` (Einsamkeit/DKHW, Mythos Neutralität/Robert Bosch, Klassenrat/DeGeDe). Auf Vercel nötig: `PLANNER_USERS` um `member2:…` ergänzen + Redeploy.
