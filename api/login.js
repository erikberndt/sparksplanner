// Digital Sparks Hours – Anmeldung
// GET    /api/login                         -> { user } oder 401
// POST   /api/login { user, password }      -> { user } + Cookie, sonst 401
// DELETE /api/login                         -> abmelden

const auth = require("./_auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!auth.configured()) {
    res.status(503).json({ error: "Login nicht eingerichtet (PLANNER_USERS fehlt)" });
    return;
  }

  if (req.method === "GET") {
    const user = auth.readSession(req);
    if (user) res.status(200).json({ user });
    else res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }

  if (req.method === "POST") {
    let body = {};
    try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (e) {}
    const user = auth.checkPassword(body.user, body.password);
    if (!user) {
      await new Promise((r) => setTimeout(r, 600)); // bremst Durchprobieren
      res.status(401).json({ error: "Name oder Passwort falsch" });
      return;
    }
    auth.setSession(res, user);
    res.status(200).json({ user });
    return;
  }

  if (req.method === "DELETE") {
    auth.clearSession(res);
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ error: "Nur GET, POST und DELETE" });
};
