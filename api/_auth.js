// Digital Sparks Hours – Login-Hilfen (kein eigener Endpunkt, "_" am Anfang)
// Nutzer und Passwörter kommen aus der Umgebungsvariable PLANNER_USERS,
// Format: "member1:passwort,max:passwort2". Nie ins Repo schreiben.
// Sitzung: signiertes Cookie (HMAC), 30 Tage gültig.

const crypto = require("crypto");

const COOKIE = "sp_session";
const MAX_AGE = 60 * 60 * 24 * 30;
const RAW = process.env.PLANNER_USERS || "";
const SECRET = process.env.PLANNER_SECRET || RAW;

const USERS = Object.fromEntries(
  RAW.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const i = s.indexOf(":");
    return [s.slice(0, i).trim().toLowerCase(), s.slice(i + 1)];
  }).filter(([u, p]) => u && p)
);

const configured = () => Object.keys(USERS).length > 0;
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const sign = (s) => crypto.createHmac("sha256", SECRET).update(s).digest("base64url");

function checkPassword(user, password) {
  const u = String(user || "").toLowerCase();
  // Immer vergleichen, damit die Antwortzeit nicht verrät, ob es den Namen gibt
  const ok = crypto.timingSafeEqual(sha(Object.hasOwn(USERS, u) ? USERS[u] : "\0"), sha(password || ""));
  return ok && Object.hasOwn(USERS, u) ? u : null;
}

function readSession(req) {
  const m = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m || !configured()) return null;
  const [data, sig] = m[1].split(".");
  if (!data || !sig) return null;
  const a = Buffer.from(sign(data)), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [user, exp] = Buffer.from(data, "base64url").toString().split("|");
  if (!Object.hasOwn(USERS, user) || Number(exp) < Date.now() / 1000) return null;
  return user;
}

function setSession(res, user) {
  const data = Buffer.from(`${user}|${Math.floor(Date.now() / 1000) + MAX_AGE}`).toString("base64url");
  res.setHeader("Set-Cookie", `${COOKIE}=${data}.${sign(data)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

module.exports = { configured, checkPassword, readSession, setSession, clearSession };
