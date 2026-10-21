// Digital Sparks Hours – geteilter Stundenzähler
// GET  /api/hours                         -> { "<id>": Stunden, ... }
// POST /api/hours  { changes: { "<id>": +1 | -1 | ... } } -> neuer Stand
//
// Speicher: Supabase (Vercel Marketplace → Storage → Supabase, mit dem Projekt
// verbinden; Tabelle einmal mit supabase/schema.sql anlegen). Nutzt die
// REST-API, keine npm-Abhängigkeiten. Nur mit Login (siehe api/login.js), sonst 401.

const auth = require("./_auth");

// Erlaubte Arbeitspakete (ids aus plan.js)
const IDS = [
  "r_leitung-okr-1", "r_meetings", "r_support-marketing",
  "r_brandbook-v1", "r_landing-page-v3", "r_influencer-kampagne", "r_pitch-v1",
  "r_greenjobs-interactive", "r_greenjobs-marketing",
  "r_einsamkeit-interactive", "r_einsamkeit-game", "r_einsamkeit-kampagne",
  "r_mythos-support", "r_mythos-kampagne",
  "r_klassenrat-support", "r_klassenrat-marketing"
];

const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path, init = {}) {
  const headers = { apikey: KEY, "Content-Type": "application/json" };
  // Alte Service-Role-Keys sind JWTs und gehören zusätzlich in Authorization,
  // neue Secret-Keys (sb_secret_…) nur in apikey.
  if (KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${KEY}`;
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

function toObject(rows) {
  const out = {};
  for (const id of IDS) out[id] = 0;
  for (const row of rows || []) {
    if (IDS.includes(row.id)) out[row.id] = Math.max(0, Number(row.hours) || 0);
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!auth.readSession(req)) {
    res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }
  if (!URL_ || !KEY) {
    res.status(503).json({ error: "Speicher nicht eingerichtet (Supabase fehlt)" });
    return;
  }
  try {
    if (req.method === "GET") {
      res.status(200).json(toObject(await supabase("ds_hours?select=id,hours")));
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const changes = {};
      for (const [id, d] of Object.entries(body.changes || {})) {
        const n = Math.trunc(Number(d));
        if (IDS.includes(id) && n && Math.abs(n) <= 40) changes[id] = n;
      }
      const rows = Object.keys(changes).length
        ? await supabase("rpc/ds_add_hours", { method: "POST", body: JSON.stringify({ changes }) })
        : await supabase("ds_hours?select=id,hours");
      res.status(200).json(toObject(rows));
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Nur GET und POST" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Speicherfehler" });
  }
};
