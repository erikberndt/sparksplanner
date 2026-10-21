# sparksplanner

Monatsplanung und geteiltes Stunden-Tracking für ein Teammitglied im Projekt Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `plan.js` | **Planungsdaten**: Monate, Kapazität, Arbeitspakete, Outsourcing, Hinweise. Für Planänderungen nur diese Datei anpassen. |
| `app.js` | Darstellung der Tabelle und Stunden-Tracking |
| `styles.css` | Gestaltung inkl. Dark Mode |
| `api/hours.js` | Vercel-Funktion: speichert die Ist-Stunden in Upstash Redis |

## Plan ändern

In `plan.js` unter `rows`: `p` = Tage der Person je Monat, `fl` = Freelance, `ag` = Agentur, `blocker`/`prio` = Badges.
Die `id` eines Pakets nicht ändern, sonst beginnt sein Zähler bei 0. Neue Pakete zusätzlich in `api/hours.js` unter `IDS` eintragen.

## Hosting (Vercel)

1. Repo in Vercel als neues Projekt importieren (kein Build nötig).
2. Storage → Upstash for Redis anlegen und mit dem Projekt verbinden (Region Frankfurt).
3. Neu deployen. Die Funktion liest `KV_REST_API_URL`/`KV_REST_API_TOKEN` (oder `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`).

**Achtung Datenschutz:** Die Seite enthält Beschäftigtendaten (Auslastung, Ist-Stunden). Ohne Login ist sie für alle mit Link sichtbar und änderbar.
