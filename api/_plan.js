// Digital Sparks Hours – plan.js auf dem Server lesen (kein eigener Endpunkt, "_" am Anfang)
// plan.js ist für den Browser geschrieben (window.PLAN = …). Hier wird es mit einem
// leeren window geladen, damit Seite und Server dieselben Pakete und Konten kennen.

globalThis.window = globalThis.window || {};
require("../plan.js");
const P = globalThis.window.PLAN;

// Alle Stunden-Schlüssel, die ein Konto sehen und ändern darf
function idsForUser(user) {
  const u = (P.users || []).find((x) => x.id === user);
  if (!u) return [];
  const ids = (u.dashboards || []).flatMap((k) => (P.dashboards[k] ? P.trackIds(P.dashboards[k]) : []));
  return [...new Set(ids)];
}

module.exports = { idsForUser };
