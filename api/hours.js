// Digital Sparks Hours – geteilter Stundenzähler
// GET  /api/hours                         -> { "<id>": Stunden, ... }
// POST /api/hours  { changes: { "<id>": +0.5 | -0.5 | ... } } -> neuer Stand (halbe Stunden)
// POST /api/hours  { set: { "<id>": Stunden, ... } }      -> Import, setzt absolute Werte
//
// Speicher: Supabase (Vercel Marketplace → Storage → Supabase, mit dem Projekt
// verbinden; Tabelle einmal mit supabase/schema.sql anlegen). Nutzt die
// REST-API, keine npm-Abhängigkeiten. Nur mit Login (siehe api/login.js), sonst 401.
// Jedes Konto sieht und ändert nur die Pakete seiner eigenen Dashboards.

const auth = require("./_auth");
const { configured, supabase } = require("./_supabase");

// Erlaubte Arbeitspakete kommen aus plan.js, je Konto nur die seiner Dashboards
const { idsForUser } = require("./_plan");

// Auf halbe Stunden runden (0.5er-Schritte)
const half = (v) => Math.round(Number(v) * 2) / 2;

function toObject(rows, IDS) {
  const out = {};
  for (const id of IDS) out[id] = 0;
  for (const row of rows || []) {
    if (IDS.includes(row.id)) out[row.id] = Math.max(0, Number(row.hours) || 0);
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const user = auth.readSession(req);
  if (!user) {
    res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }
  const IDS = idsForUser(user);
  if (!configured()) {
    res.status(503).json({ error: "Speicher nicht eingerichtet (Supabase fehlt)" });
    return;
  }
  try {
    if (req.method === "GET") {
      res.status(200).json(toObject(await supabase("ds_hours?select=id,hours"), IDS));
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

      if (body.set) {
        const now = new Date().toISOString();
        const rows = [];
        for (const [id, v] of Object.entries(body.set)) {
          const n = half(v);
          if (IDS.includes(id) && Number.isFinite(n) && n >= 0 && n <= 10000) rows.push({ id, hours: n, updated_at: now });
        }
        if (rows.length) {
          await supabase("ds_hours?on_conflict=id", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=representation" },
            body: JSON.stringify(rows)
          });
        }
        res.status(200).json(toObject(await supabase("ds_hours?select=id,hours"), IDS));
        return;
      }

      const changes = {};
      for (const [id, d] of Object.entries(body.changes || {})) {
        const n = half(d);
        if (IDS.includes(id) && n && Math.abs(n) <= 40) changes[id] = n;
      }
      const rows = Object.keys(changes).length
        ? await supabase("rpc/ds_add_hours", { method: "POST", body: JSON.stringify({ changes }) })
        : await supabase("ds_hours?select=id,hours");
      res.status(200).json(toObject(rows, IDS));
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Nur GET und POST" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Speicherfehler" });
  }
};
