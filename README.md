# sparksplanner

Monatsplanung und geteiltes Stunden-Tracking für ein Teammitglied im Projekt Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `plan.js` | **Planungsdaten**: Monate, Kapazität, Arbeitspakete, Outsourcing, Hinweise. Für Planänderungen nur diese Datei anpassen. |
| `app.js` | Darstellung der Tabelle und Stunden-Tracking |
| `styles.css` | Gestaltung inkl. Dark Mode |
| `api/hours.js` | Vercel-Funktion: speichert die Ist-Stunden in Upstash Redis (nur mit Login) |
| `api/login.js` | Anmelden/Abmelden, setzt ein signiertes Sitzungs-Cookie |
| `api/_auth.js` | Login-Hilfen (Passwortprüfung, Cookie) |

## Plan ändern

In `plan.js` unter `rows`: `p` = Tage der Person je Monat, `fl` = Freelance, `ag` = Agentur, `blocker`/`prio` = Badges.
Die `id` eines Pakets nicht ändern, sonst beginnt sein Zähler bei 0. Neue Pakete zusätzlich in `api/hours.js` unter `IDS` eintragen.

## Hosting (Vercel)

1. Repo in Vercel als neues Projekt importieren (kein Build nötig).
2. Storage → Upstash for Redis anlegen und mit dem Projekt verbinden (Region Frankfurt).
3. Unter Settings → Environment Variables `PLANNER_USERS` anlegen, Format `gina:passwort` (mehrere mit Komma: `gina:pw1,max:pw2`). Optional `PLANNER_SECRET` (beliebiger langer Zufallswert) zum Signieren der Sitzungen.
4. Neu deployen. Die Funktion liest `KV_REST_API_URL`/`KV_REST_API_TOKEN` (oder `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`).

## Login

Vor der Seite liegt ein Anmelde-Modal (Name aus Dropdown + Passwort). Die Namen stehen in `plan.js` unter `users`, die Passwörter nur in `PLANNER_USERS` auf Vercel, nie im Repo. Neue Person: in `plan.js` unter `users` eintragen und in `PLANNER_USERS` ergänzen, dann neu deployen.

**Achtung Datenschutz:** Die Ist-Stunden gibt es nur nach Login. Der Plan selbst (`plan.js`) ist eine statische Datei und steht im öffentlichen Repo, ist also trotz Login öffentlich lesbar.
