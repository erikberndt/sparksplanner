# sparksplanner

Monatsplanung und geteiltes Stunden-Tracking für ein Teammitglied im Projekt Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

## Stack
- Statische Seite ohne Build: `index.html`, `styles.css`, `plan.js` (Daten), `app.js` (Darstellung + Tracking)
- `api/hours.js`: Vercel Serverless Function, speichert Ist-Stunden in Upstash Redis
- Env-Variablen: `KV_REST_API_URL`/`KV_REST_API_TOKEN` (oder `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`)

## Regeln
- Planänderungen nur in `plan.js` (`rows`: `p` Person, `fl` Freelance, `ag` Agentur, `blocker`/`prio`).
- Paket-`id`s nie ändern (sonst Zähler bei 0). Neue Pakete auch in `api/hours.js` unter `IDS` eintragen.
- Datenschutz: enthält Beschäftigtendaten, ohne Login für alle mit Link sichtbar und änderbar.

## Status
- 2026-10-21: Aus `~/Downloads/planner` übernommen, Git-Repo (`main`) angelegt.
- GitHub: https://github.com/erikberndt/sparksplanner (öffentlich). Noch nicht auf Vercel.
