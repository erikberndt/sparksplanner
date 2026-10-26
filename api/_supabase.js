// Digital Sparks Hours – Supabase-REST-Zugriff (kein eigener Endpunkt, "_" am Anfang)
// URL und Secret-/Service-Role-Key setzt Vercel beim Verbinden mit Supabase.

const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const configured = () => Boolean(URL_ && KEY);

async function supabase(path, init = {}) {
  const headers = { apikey: KEY, "Content-Type": "application/json", ...init.headers };
  // Alte Service-Role-Keys sind JWTs und gehören zusätzlich in Authorization,
  // neue Secret-Keys (sb_secret_…) nur in apikey.
  if (KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${KEY}`;
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
}

module.exports = { configured, supabase };
