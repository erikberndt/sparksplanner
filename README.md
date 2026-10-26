# sparksplanner

Planungs-Dashboards und geteiltes Stunden-Tracking für Digital Sparks (Education Innovation Lab), Okt 2026 – Jan 2027.

Jedes Konto sieht nach dem Login genau die Dashboards, die es braucht: mal eine Person (Monatsplanung), mal Kurse (Sparks untereinander), später z. B. Teams.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `plan.js` | **Planungsdaten**: Konten, Dashboards, Pakete, Tage. Für Planänderungen nur diese Datei anpassen. |
| `app.js` | Darstellung je Dashboard-Typ (`renderPerson`, `renderKurse`), Stunden-Tracking, Login, Export/Import |
| `styles.css` | Gestaltung inkl. Dark Mode und Handy-Ansicht |
| `api/hours.js` | Vercel-Funktion: Ist-Stunden in Supabase, je Konto nur die Pakete seiner Dashboards |
| `api/login.js` | Anmelden/Abmelden, setzt ein signiertes Sitzungs-Cookie |
| `api/_auth.js` | Login-Hilfen (Passwortprüfung, Cookie) |
| `api/_plan.js` | liest `plan.js` auf dem Server (welches Konto welche Pakete darf) |
| `api/_supabase.js` | gemeinsamer Supabase-Zugriff |
| `og.png` | Vorschaubild für geteilte Links (1200 × 630), Quelle `og/og.html` |
| `supabase/schema.sql` | Tabelle `ds_hours` + Funktion `ds_add_hours`, einmal im Supabase SQL Editor ausführen |
| `supabase/migration-2026-10-halbe-stunden.sql` | Umstellung bestehender Datenbanken auf halbe Stunden (Daten bleiben erhalten) |

## Dashboards

In `plan.js` unter `dashboards`, jedes mit einem `type`:

- **`person`**: Monatsplanung einer Person. `rows`: `p` = Tage je Monat, `fl` = Freelance, `ag` = Agentur, `prio: true` = PRIO-Label (Anzeige per `showPrio`).
- **`kurse`**: mehrere Kurse untereinander, je Kurs die `packages` mit Tagen (ohne Tage ausgeblendet). Je Kurs `t` = Tage gesamt je Paket, `fl`/`ag` = davon extern. `who` am Paket = wer es macht, `who` am Kurs überschreibt das; ohne Person „offen“. Spalte **Zeitraum**: aus `from` (Zeilen-ids im Personen-Dashboard, z. B. Ginas Plan) oder als Text in `when`. Kein Stunden-Tracking.

Welche Dashboards ein Konto sieht, steht unter `users[].dashboards`. Bei mehreren erscheinen oben Tabs zum Umschalten. Ein neuer Dashboard-Typ braucht eine Render-Funktion in `app.js` und einen Eintrag in `PLAN.trackIds` (plan.js).

Zeilen-`id`s im Personen-Dashboard nie ändern, sonst beginnt ihr Stundenzähler bei 0 (und Zeiträume im Kurs-Dashboard verlieren ihre Verknüpfung). Der Server liest die erlaubten Pakete direkt aus `plan.js`, eine zweite Liste gibt es nicht.

## Hosting (Vercel)

1. Repo in Vercel als neues Projekt importieren (kein Build nötig).
2. Storage → Supabase anlegen (Region Frankfurt) und mit dem Projekt verbinden. Im Supabase-Dashboard unter SQL Editor einmal `supabase/schema.sql` ausführen.
3. Unter Settings → Environment Variables `PLANNER_USERS` anlegen, Format `member1:passwort,member2:passwort`. Optional `PLANNER_SECRET` (beliebiger langer Zufallswert) zum Signieren der Sitzungen.
4. Neu deployen. Die Funktion liest `SUPABASE_URL` und `SUPABASE_SECRET_KEY` (oder `SUPABASE_SERVICE_ROLE_KEY`), die Vercel beim Verbinden automatisch setzt.

## Login

Vor der Seite liegt ein Anmelde-Modal (Name aus Dropdown + Passwort). Die Konten stehen in `plan.js` unter `users`, die Passwörter nur in `PLANNER_USERS` auf Vercel, nie im Repo. Neues Konto: in `plan.js` unter `users` eintragen (mit `dashboards`) und in `PLANNER_USERS` ergänzen, dann neu deployen.

**Achtung Datenschutz:** Die Ist-Stunden gibt es nur nach Login. Der Plan selbst (`plan.js`, inkl. Namen bei „Wer“) ist eine statische Datei und steht im öffentlichen Repo, ist also trotz Login öffentlich lesbar.

## Export / Import

Nach dem Login oben rechts: **Export** lädt die Ist-Stunden des aktuellen Dashboards als JSON (`sparksplanner-stunden-<dashboard>-JJJJ-MM-TT.json`). **Import** liest so eine Datei und **überschreibt** die Stunden der enthaltenen Pakete (mit Rückfrage). Pakete anderer Dashboards werden ignoriert.
