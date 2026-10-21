// Digital Sparks Hours – geteilter Stundenzähler
// GET  /api/hours                         -> { "<id>": Stunden, ... }
// POST /api/hours  { changes: { "<id>": +1 | -1 | ... } } -> neuer Stand
//
// Speicher: Upstash Redis (Vercel Marketplace → Storage → Upstash for Redis,
// mit dem Projekt verbinden). Nutzt die REST-API, keine npm-Abhängigkeiten.

const KEY = "ds-hours:rows";

// Erlaubte Arbeitspakete (ids aus hours/plan.js)
const IDS = [
  "r_leitung-okr-1", "r_meetings", "r_support-marketing",
  "r_brandbook-v1", "r_landing-page-v3", "r_influencer-kampagne", "r_pitch-v1",
  "r_greenjobs-interactive", "r_greenjobs-marketing",
  "r_einsamkeit-interactive", "r_einsamkeit-game", "r_einsamkeit-kampagne",
  "r_mythos-support", "r_mythos-kampagne",
  "r_klassenrat-support", "r_klassenrat-marketing"
];

// Startwerte, übernommen aus dem bisherigen Tracking (Stand 16.10.2026)
const SEED = { "r_leitung-okr-1": 16, "r_meetings": 23, "r_support-marketing": 14 };

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(commands) {
  const r = await fetch(`${URL_}/multi-exec`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  return (await r.json()).map((x) => {
    if (x.error) throw new Error(x.error);
    return x.result;
  });
}

function toObject(flat) {
  const out = {};
  for (const id of IDS) out[id] = 0;
  for (let i = 0; i < (flat || []).length; i += 2) {
    if (IDS.includes(flat[i])) out[flat[i]] = Math.max(0, Number(flat[i + 1]) || 0);
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) {
    res.status(503).json({ error: "Speicher nicht eingerichtet (Upstash Redis fehlt)" });
    return;
  }
  try {
    // Beim allerersten Aufruf Startwerte setzen (nur wenn noch nichts gespeichert ist)
    const seedCmds = Object.entries(SEED).map(([k, v]) => ["HSETNX", KEY, k, String(v)]);

    if (req.method === "GET") {
      const results = await redis([...seedCmds, ["HGETALL", KEY]]);
      res.status(200).json(toObject(results[results.length - 1]));
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const changes = body.changes || {};
      const cmds = [];
      for (const [id, d] of Object.entries(changes)) {
        const n = Math.trunc(Number(d));
        if (!IDS.includes(id) || !n || Math.abs(n) > 40) continue;
        cmds.push(["HINCRBY", KEY, id, String(n)]);
      }
      const results = await redis([...seedCmds, ...cmds, ["HGETALL", KEY]]);
      const all = toObject(results[results.length - 1]);
      // Negative Werte (z. B. durch gleichzeitiges Minus) auf 0 korrigieren
      const flat = results[results.length - 1] || [];
      const fix = [];
      for (let i = 0; i < flat.length; i += 2) if (Number(flat[i + 1]) < 0) fix.push(["HSET", KEY, flat[i], "0"]);
      if (fix.length) await redis(fix);
      res.status(200).json(all);
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Nur GET und POST" });
  } catch (e) {
    res.status(500).json({ error: "Speicherfehler" });
  }
};
