// Digital Sparks Hours – anpassbare Anzeigenamen
// GET  /api/names                  -> { "<id>": "Name", ... }  (ohne Login, fürs Login-Dropdown)
// POST /api/names { id, name }     -> neuer Stand              (nur mit Login)
//
// Die id (z. B. "member1") bleibt fest und ist das, womit man sich anmeldet
// (PLANNER_USERS). Geändert wird nur der angezeigte Name.
// Tabelle: ds_names (supabase/migration-2026-10-namen.sql).

const auth = require("./_auth");
const { configured, supabase } = require("./_supabase");

const MAX = 40;

// Steuerzeichen raus, Leerraum zusammenfassen
const clean = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();

async function all() {
  const allowed = auth.ids();
  const out = {};
  for (const row of await supabase("ds_names?select=id,name")) {
    if (allowed.includes(row.id)) out[row.id] = row.name;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    // Ohne Speicher oder Tabelle einfach keine eigenen Namen, die Seite nimmt dann plan.js
    if (!configured()) { res.status(200).json({}); return; }
    try { res.status(200).json(await all()); }
    catch (e) { console.error(e); res.status(200).json({}); }
    return;
  }

  if (req.method === "POST") {
    if (!auth.readSession(req)) { res.status(401).json({ error: "Nicht angemeldet" }); return; }
    if (!configured()) { res.status(503).json({ error: "Speicher nicht eingerichtet (Supabase fehlt)" }); return; }
    let body = {};
    try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) {}
    const id = String(body.id || "").toLowerCase();
    const name = clean(body.name);
    if (!auth.ids().includes(id)) { res.status(400).json({ error: "Unbekannte Person" }); return; }
    if (!name || name.length > MAX) { res.status(400).json({ error: `Name muss 1–${MAX} Zeichen lang sein` }); return; }
    try {
      await supabase("ds_names?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify([{ id, name, updated_at: new Date().toISOString() }])
      });
      res.status(200).json(await all());
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Speicherfehler" });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Nur GET und POST" });
};
