/* =====================================================================
   Digital Sparks Hours – Darstellung und Stunden-Tracking
   Liest window.PLAN aus plan.js. Die Ist-Stunden liegen geteilt in
   Upstash Redis und werden über /api/hours gelesen und geschrieben.
   ===================================================================== */
(function () {
  "use strict";

  const P = window.PLAN;
  const M = P.months, ROWS = P.rows, HPD = P.hoursPerDay;
  const $ = (id) => document.getElementById(id);
  const nf = (v) => (Math.round(v * 10) / 10).toLocaleString("de-DE");
  const css = (v) => `var(${v})`;
  const sumBy = (f, k) => ROWS.reduce((a, r) => a + ((r[f] || {})[k] || 0), 0);
  const total = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const planH = (r) => total(r.p) * HPD;

  /* ---------- Kopf und Legende ---------- */
  $("title").textContent = P.title;
  $("legend").innerHTML =
    Object.values(P.streams).map((s) => `<span><i class="sw" style="background:${css(s.c)}"></i>${s.n}</span>`).join("") +
    `<span><i class="sw ext"></i>Freelance</span>` +
    `<span><i class="sw ext ag"></i>Agentur</span>` +
    (P.showPrio ? `<span><span class="badge prio">PRIO</span> muss passieren</span>` : "");

  /* ---------- Tabelle ---------- */
  const cols = M.length + 2;
  let h = `<thead><tr><th>Arbeitspaket</th>` +
    M.map((m) => `<th class="m mc m-${m.k}"><span class="mn">${m.n}</span><span class="md">${m.d} · ${m.cap} AT</span></th>`).join("") +
    `<th class="ist"><span class="mn">Ist</span><span class="md" id="trk-state">Stunden · lädt …</span></th></tr></thead><tbody>`;

  let last = "";
  for (const r of ROWS) {
    if (r.s !== last) {
      last = r.s;
      h += `<tr class="grp"><td colspan="${cols}"><i style="background:${css(P.streams[r.s].c)}"></i>${P.streams[r.s].n}</td></tr>`;
    }
    h += `<tr><td class="lab"><span class="t">${r.n}</span>` +
      (P.showPrio && (r.prio || r.blocker) ? `<span class="badge prio">PRIO</span>` : "") +
      (r.sub ? `<span class="s">${r.sub}</span>` : "") + `</td>`;
    for (const m of M) {
      const p = (r.p || {})[m.k], f = (r.fl || {})[m.k], a = (r.ag || {})[m.k];
      h += `<td class="mc m-${m.k}"><div class="cell">` +
        (p ? `<span class="chip" style="background:${css(P.streams[r.s].c)}">${nf(p)} T</span>` : "") +
        (f ? `<span class="chip ext">FL ${nf(f)} T</span>` : "") +
        (a ? `<span class="chip ext ag">Agentur ${nf(a)} T</span>` : "") +
        `</div></td>`;
    }
    h += `<td class="ist"><div class="ctr">` +
      `<button type="button" data-r="${r.id}" data-d="-1" aria-label="${r.n}: eine Stunde weniger" disabled>−</button>` +
      `<output id="val-${r.id}">0 h</output>` +
      `<button type="button" data-r="${r.id}" data-d="1" aria-label="${r.n}: eine Stunde mehr" disabled>+</button>` +
      `</div><div class="cmp" id="cmp-${r.id}"></div></td></tr>`;
  }

  h += `</tbody><tfoot><tr class="sum"><td>Summe Person</td>` +
    M.map((m) => {
      const s = sumBy("p", m.k), q = s / m.cap, c = q > 1 ? "--over" : q > 0.9 ? "--warn" : "--ok";
      return `<td class="mc m-${m.k}">${nf(s)} / ${m.cap} T<div class="meter"><i style="width:${Math.min(q, 1) * 100}%;background:${css(c)}"></i></div></td>`;
    }).join("") +
    `<td class="ist" id="ist-sum"></td></tr>` +
    `<tr><td style="font-family:var(--f-body)">Frei</td>` +
    M.map((m) => {
      const f = m.cap - sumBy("p", m.k);
      return `<td class="free mc m-${m.k}" style="color:${css(f < 0 ? "--over" : f < 1.5 ? "--warn" : "--ok")}">${f >= 0 ? "+" : "−"}${nf(Math.abs(f))} T</td>`;
    }).join("") +
    `<td class="ist"></td></tr></tfoot>`;
  $("tbl").innerHTML = h;

  /* ---------- Monatsauswahl (nur schmale Bildschirme) ----------
     Auf dem Handy ist immer nur ein Monat sichtbar, oben umschaltbar. */
  const now = new Date();
  const curKey = ["jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"][now.getMonth()];
  let curMonth = M.some((m) => m.k === curKey) ? curKey : M[0].k;
  try { const s = localStorage.getItem("sp-month"); if (M.some((m) => m.k === s)) curMonth = s; } catch (e) {}
  $("mtabs").innerHTML = M.map((m) =>
    `<button type="button" data-m="${m.k}" role="tab"><span>${m.n.slice(0, 3)}</span><small>${m.cap} AT</small></button>`).join("");
  function showMonth(k) {
    curMonth = k;
    document.querySelectorAll("#mtabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.m === k));
    document.querySelectorAll("#tbl .mc").forEach((c) => c.classList.toggle("on", c.classList.contains("m-" + k)));
    try { localStorage.setItem("sp-month", k); } catch (e) {}
  }
  $("mtabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showMonth(b.dataset.m); });
  showMonth(curMonth);

  /* ---------- Outsourcing und Hinweise ---------- */
  const li = (x) => `<li><span>${x.t}${x.s ? `<small>${x.s}</small>` : ""}</span><em>${x.v}</em></li>`;
  const flUsed = ROWS.reduce((a, r) => a + total(r.fl), 0);
  const O = P.outsourcing;
  $("out").innerHTML =
    `<section class="panel pad"><h3><span>Freelance</span><span>${nf(flUsed)} / ${P.freelanceBudget} T</span></h3><ul class="l">` +
      O.freelance.map(li).join("") + li({ t: "Noch frei", v: nf(P.freelanceBudget - flUsed) + " T", s: "Reserve" }) + `</ul></section>` +
    `<section class="panel pad"><h3><span>Agentur</span></h3><ul class="l">${O.agentur.map(li).join("")}</ul></section>` +
    `<section class="panel pad"><h3><span>Andere Teammitglieder</span></h3><ul class="l">${O.team.map(li).join("")}</ul></section>`;
  $("notes").innerHTML = P.notes.map((n) => `<li>${n}</li>`).join("");

  /* ---------- Stunden-Tracking ---------- */
  const hours = Object.fromEntries(ROWS.map((r) => [r.id, 0]));

  function paintHours() {
    let tv = 0, tp = 0;
    for (const r of ROWS) {
      const v = hours[r.id], plan = planH(r), d = v - plan;
      tv += v; tp += plan;
      $("val-" + r.id).textContent = nf(v) + " h";
      $("cmp-" + r.id).innerHTML = `von ${nf(plan)} h` + (d > 0 ? ` · <b style="color:var(--over)">+${nf(d)} h</b>` : "");
    }
    $("ist-sum").innerHTML = `${nf(tv)} / ${nf(tp)} h<div class="meter"><i style="width:${tp ? Math.min(tv / tp, 1) * 100 : 0}%;background:${css(tv > tp ? "--over" : "--strat")}"></i></div>`;
  }
  paintHours();

  /* Speicher: Vercel-Funktion /api/hours (Upstash Redis).
     Klicks werden als Differenz gesendet (+1 / −1), damit gleichzeitige
     Klicks verschiedener Personen sich nicht überschreiben. */
  const state = $("trk-state");
  const API = "/api/hours";
  const queued = {};          // noch nicht gesendete Differenzen je Paket
  let timer = null, sending = false;

  async function load() {
    if (sending || timer || document.body.classList.contains("locked")) return;
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (r.status === 401) { lock(); return false; }
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      for (const k in hours) hours[k] = Number(d[k]) || 0;
      paintHours();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function flush() {
    timer = null;
    const batch = Object.entries(queued).filter(([, v]) => v !== 0);
    for (const k in queued) delete queued[k];
    if (!batch.length) return;
    sending = true;
    state.textContent = "Stunden · speichert …";
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: Object.fromEntries(batch) })
      });
      if (r.status === 401) { sending = false; lock(); return; }
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      for (const k in hours) hours[k] = Number(d[k]) || 0;
      paintHours();
      state.textContent = "Stunden · gespeichert";
    } catch (e) {
      state.textContent = "Speichern fehlgeschlagen";
    }
    sending = false;
  }

  /* ---------- Login ---------- */
  const LOGIN = "/api/login";
  const USERS = P.users || [];
  const gate = $("gate"), form = $("gate-form"), sel = $("gate-user"), pw = $("gate-pw"), err = $("gate-err"), btn = $("gate-btn");
  let started = false;
  sel.innerHTML = USERS.map((u) => `<option value="${u.id}">${u.n}</option>`).join("");

  function lock(msg) {
    document.body.classList.add("locked");
    $("who").textContent = "";
    err.textContent = msg || "";
    pw.value = "";
    (USERS.length > 1 ? sel : pw).focus();
  }

  function unlock(user) {
    const u = USERS.find((x) => x.id === user);
    document.body.classList.remove("locked");
    $("who").innerHTML = `Angemeldet als ${u ? u.n : user} · ` +
      `<button type="button" id="export">Export</button> · ` +
      `<button type="button" id="import">Import</button> · ` +
      `<button type="button" id="logout">Abmelden</button>`;
    $("export").addEventListener("click", exportHours);
    $("import").addEventListener("click", () => $("import-file").click());
    $("logout").addEventListener("click", async () => {
      try { await fetch(LOGIN, { method: "DELETE" }); } catch (e) {}
      lock();
    });
    if (!started) { started = true; startTracking(); } else load();
  }

  /* ---------- Export / Import ---------- */
  // Datei-Format: { app, exported, hours: { "<id>": Stunden }, rows: [lesbare Liste] }.
  // Import setzt die Stunden auf die Werte aus der Datei (überschreibt).
  async function exportHours() {
    if ((await load()) === false) { alert("Export nicht möglich: Stunden konnten nicht geladen werden."); return; }
    const data = {
      app: "sparksplanner",
      exported: new Date().toISOString(),
      hours: { ...hours },
      rows: ROWS.map((r) => ({ id: r.id, name: r.n, ist: hours[r.id], plan: planH(r) }))
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `sparksplanner-stunden-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    let set;
    try {
      const d = JSON.parse(await file.text());
      const src = d.hours || d;
      set = {};
      for (const r of ROWS) {
        const v = Number(src[r.id]);
        if (r.id in src && Number.isFinite(v) && v >= 0) set[r.id] = Math.round(v);
      }
    } catch (err) {
      alert("Die Datei ist kein gültiger Stunden-Export (JSON).");
      return;
    }
    const n = Object.keys(set).length;
    if (!n) { alert("In der Datei wurden keine passenden Arbeitspakete gefunden."); return; }
    const sum = Object.values(set).reduce((a, b) => a + b, 0);
    if (!confirm(`${n} Arbeitspakete mit zusammen ${nf(sum)} h importieren?\n\nDie aktuellen Stunden dieser Pakete werden überschrieben.`)) return;
    state.textContent = "Stunden · importiert …";
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set })
      });
      if (r.status === 401) { lock(); return; }
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      for (const k in hours) hours[k] = Number(d[k]) || 0;
      paintHours();
      state.textContent = "Stunden · importiert";
    } catch (err) {
      state.textContent = "Import fehlgeschlagen";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pw.value) { err.textContent = "Bitte Passwort eingeben"; pw.focus(); return; }
    btn.disabled = true;
    err.textContent = "";
    try {
      const r = await fetch(LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: sel.value, password: pw.value })
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) unlock(d.user);
      else lock(r.status === 401 ? "Name oder Passwort falsch" : d.error || "Anmeldung fehlgeschlagen");
    } catch (e) {
      lock("Server nicht erreichbar");
    }
    btn.disabled = false;
  });

  (async () => {
    try {
      const r = await fetch(LOGIN, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (r.ok) unlock(d.user);
      else lock(r.status === 401 ? "" : d.error || "Login nicht erreichbar");
    } catch (e) {
      lock("Server nicht erreichbar");
    }
  })();

  async function startTracking() {
    const ok = await load();
    if (!ok) {
      if (!document.body.classList.contains("locked")) state.textContent = "Stunden · Speicher nicht erreichbar";
      started = false;
      return;
    }
    state.textContent = "Stunden · 1 Klick = 1 h";
    document.querySelectorAll(".ctr button").forEach((b) => {
      b.disabled = false;
      b.addEventListener("click", () => {
        const k = b.dataset.r, d = Number(b.dataset.d);
        if (d < 0 && hours[k] <= 0) return;
        hours[k] += d;
        queued[k] = (queued[k] || 0) + d;
        paintHours();
        state.textContent = "Stunden · speichert …";
        clearTimeout(timer);
        timer = setTimeout(flush, 700);
      });
    });
    // Stand anderer Personen regelmäßig nachladen
    setInterval(() => { if (!document.hidden) load(); }, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  }
})();
