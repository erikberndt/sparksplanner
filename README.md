# sparksplanner

Monatsplanung und geteiltes Stunden-Tracking für ein Teammitglied im Projekt Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `plan.js` | **Planungsdaten**: Monate, Kapazität, Arbeitspakete, Outsourcing, Hinweise. Für Planänderungen nur diese Datei anpassen. |
| `app.js` | Darstellung der Tabelle und Stunden-Tracking |
| `styles.css` | Gestaltung inkl. Dark Mode |
| `api/hours.js` | Vercel-Funktion: speichert die Ist-Stunden in Supabase (nur mit Login) |
| `api/login.js` | Anmelden/Abmelden, setzt ein signiertes Sitzungs-Cookie |
| `api/_auth.js` | Login-Hilfen (Passwortprüfung, Cookie) |
| `og.png` | Vorschaubild für geteilte Links (1200 × 630), Quelle `og/og.html` |
| `supabase/schema.sql` | Tabelle `ds_hours` + Funktion `ds_add_hours`, einmal im Supabase SQL Editor ausführen |
| `supabase/migration-2026-10-halbe-stunden.sql` | Umstellung bestehender Datenbanken auf halbe Stunden (Daten bleiben erhalten) |

## Plan ändern

In `plan.js` unter `rows`: `p` = Tage der Person je Monat, `fl` = Freelance, `ag` = Agentur, `prio: true` = rotes PRIO-Label.
Die `id` eines Pakets nicht ändern, sonst beginnt sein Zähler bei 0. Neue Pakete zusätzlich in `api/hours.js` unter `IDS` eintragen.

## Hosting (Vercel)

1. Repo in Vercel als neues Projekt importieren (kein Build nötig).
2. Storage → Supabase anlegen (Region Frankfurt) und mit dem Projekt verbinden. Im Supabase-Dashboard unter SQL Editor einmal `supabase/schema.sql` ausführen.
3. Unter Settings → Environment Variables `PLANNER_USERS` anlegen, Format `member1:passwort` (mehrere mit Komma: `member1:pw1,max:pw2`). Optional `PLANNER_SECRET` (beliebiger langer Zufallswert) zum Signieren der Sitzungen.
4. Neu deployen. Die Funktion liest `SUPABASE_URL` und `SUPABASE_SECRET_KEY` (oder `SUPABASE_SERVICE_ROLE_KEY`), die Vercel beim Verbinden automatisch setzt.

## Login

Vor der Seite liegt ein Anmelde-Modal (Name aus Dropdown + Passwort). Die Namen stehen in `plan.js` unter `users`, die Passwörter nur in `PLANNER_USERS` auf Vercel, nie im Repo. Neue Person: in `plan.js` unter `users` eintragen und in `PLANNER_USERS` ergänzen, dann neu deployen.

**Achtung Datenschutz:** Die Ist-Stunden gibt es nur nach Login. Der Plan selbst (`plan.js`) ist eine statische Datei und steht im öffentlichen Repo, ist also trotz Login öffentlich lesbar.

## Export / Import

Nach dem Login oben rechts: **Export** lädt die Ist-Stunden als JSON (`sparksplanner-stunden-JJJJ-MM-TT.json`). **Import** liest so eine Datei und **überschreibt** die Stunden der enthaltenen Pakete (mit Rückfrage). Unbekannte Paket-ids werden ignoriert.
