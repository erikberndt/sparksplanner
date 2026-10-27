/* =====================================================================
   Digital Sparks Hours – Darstellung und Stunden-Tracking
   Liest window.PLAN aus plan.js. Nach dem Login sieht jedes Konto seine
   Dashboards (plan.js → users[].dashboards). Je Dashboard-Typ gibt es eine
   eigene Darstellung (renderPerson, renderKurse). Die Ist-Stunden liegen
   geteilt in Supabase und werden über /api/hours gelesen und geschrieben.
   ===================================================================== */
(function () {
  "use strict";

  const P = window.PLAN, HPD = P.hoursPerDay;
  const $ = (id) => document.getElementById(id);
  const nf = (v) => (Math.round(v * 10) / 10).toLocaleString("de-DE");
  const css = (v) => `var(${v})`;
  const total = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const dash = $("dash"), title = $("title");

  // +/−-Zähler für ein Paket (Wert und Vergleich füllt paint())
  const counter = (id, n) =>
    `<div class="ctr">` +
      `<button type="button" data-r="${id}" data-d="-0.5" aria-label="${n}: eine halbe Stunde weniger" disabled>−</button>` +
      `<output id="val-${id}">0 h</output>` +
      `<button type="button" data-r="${id}" data-d="0.5" aria-label="${n}: eine halbe Stunde mehr" disabled>+</button>` +
    `</div><div class="cmp" id="cmp-${id}"></div>`;

  /* =================================================================
     Dashboard-Typ "person": Monatsplanung einer Person
     ================================================================= */
  function renderPerson(D) {
    const M = D.months, ROWS = D.rows;
    const sumBy = (f, k) => ROWS.reduce((a, r) => a + ((r[f] || {})[k] || 0), 0);

    const legend =
      Object.values(D.streams).map((s) => `<span><i class="sw" style="background:${css(s.c)}"></i>${s.n}</span>`).join("") +
      `<span><i class="sw ext"></i>Freelance</span>` +
      `<span><i class="sw ext ag"></i>Agentur</span>` +
      (P.showPrio ? `<span><span class="badge prio">PRIO</span> muss passieren</span>` : "") +
      (ROWS.some((r) => r.deprio) ? `<span><span class="badge deprio">DEPRIO</span> zurückgestellt</span>` : "");

    const cols = M.length + 2;
    let h = `<thead><tr><th>Arbeitspaket</th>` +
      M.map((m) => `<th class="m mc m-${m.k}"><span class="mn">${m.n}</span><span class="md">${m.d} · ${m.cap} AT</span></th>`).join("") +
      `<th class="ist"><span class="mn">Ist</span><span class="md" id="trk-state">Stunden · lädt …</span></th></tr></thead><tbody>`;

    let last = "";
    for (const r of ROWS) {
      if (r.s !== last) {
        last = r.s;
        h += `<tr class="grp"><td colspan="${cols}"><i style="background:${css(D.streams[r.s].c)}"></i>${D.streams[r.s].n}</td></tr>`;
      }
      h += `<tr><td class="lab"><span class="t">${r.n}</span>` +
        (P.showPrio && (r.prio || r.blocker) ? `<span class="badge prio">PRIO</span>` : "") +
        (r.deprio === true ? `<span class="badge deprio">DEPRIO</span>` : "") +
        (r.sub ? `<span class="s">${r.sub}</span>` : "") + `</td>`;
      for (const m of M) {
        const p = (r.p || {})[m.k], f = (r.fl || {})[m.k], a = (r.ag || {})[m.k];
        h += `<td class="mc m-${m.k}"><div class="cell">` +
          (p ? `<span class="chip" style="background:${css(D.streams[r.s].c)}">${nf(p)} T</span>` : "") +
          (f ? `<span class="chip ext">FL ${nf(f)} T</span>` : "") +
          (a ? `<span class="chip ext ag">Agentur ${nf(a)} T</span>` : "") +
          (r.deprio === m.k ? `<span class="badge deprio">DEPRIO</span>` : "") +
          `</div></td>`;
      }
      h += `<td class="ist">${counter(r.id, r.n)}</td></tr>`;
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

    const li = (x) => `<li><span>${x.t}${x.s ? `<small>${x.s}</small>` : ""}</span><em>${x.v}</em></li>`;
    const flUsed = ROWS.reduce((a, r) => a + total(r.fl), 0);
    const O = D.outsourcing;

    dash.innerHTML =
      `<div class="legend">${legend}</div>` +
      `<div class="mtabs" id="mtabs" role="tablist" aria-label="Monat wählen"></div>` +
      `<section class="panel scroll" aria-label="Monatsplanung"><table id="tbl">${h}</table></section>` +
      `<div class="grid2">` +
        `<section class="panel pad"><h3><span>Freelance</span><span>${nf(flUsed)} / ${D.freelanceBudget} T</span></h3><ul class="l">` +
          O.freelance.map(li).join("") + li({ t: "Noch frei", v: nf(D.freelanceBudget - flUsed) + " T", s: "Reserve" }) + `</ul></section>` +
        `<section class="panel pad"><h3><span>Agentur</span></h3><ul class="l">${O.agentur.map(li).join("")}</ul></section>` +
        `<section class="panel pad"><h3><span>Andere Teammitglieder</span></h3><ul class="l">${O.team.map(li).join("")}</ul></section>` +
      `</div>` +
      `<ul class="notes">${D.notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;

    /* Monatsauswahl (nur schmale Bildschirme): immer nur ein Monat sichtbar */
    const curKey = ["jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"][new Date().getMonth()];
    let curMonth = M.some((m) => m.k === curKey) ? curKey : M[0].k;
    try { const s = localStorage.getItem("sp-month"); if (M.some((m) => m.k === s)) curMonth = s; } catch (e) {}
    $("mtabs").innerHTML = M.map((m) =>
      `<button type="button" data-m="${m.k}" role="tab"><span>${m.n.slice(0, 3)}</span><small>${m.cap} AT</small></button>`).join("");
    function showMonth(k) {
      document.querySelectorAll("#mtabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.m === k));
      document.querySelectorAll("#tbl .mc").forEach((c) => c.classList.toggle("on", c.classList.contains("m-" + k)));
      try { localStorage.setItem("sp-month", k); } catch (e) {}
    }
    $("mtabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showMonth(b.dataset.m); });
    showMonth(curMonth);

    const track = ROWS.map((r) => ({ id: r.id, n: r.n, plan: total(r.p) * HPD }));
    return { track, sums: [{ el: "ist-sum", ids: track.map((t) => t.id) }] };
  }

  /* =================================================================
     Dashboard-Typ "kurse": mehrere Kurse untereinander, je Kurs die Pakete
     mit Tagen, wer sie macht und wann (Zeitraum). Kein Stunden-Tracking.
     ================================================================= */
  function renderKurse(D) {
    const PK = D.packages;
    const days = (c, p) => ({ t: (c.t || {})[p.id] || 0, fl: (c.fl || {})[p.id] || 0, ag: (c.ag || {})[p.id] || 0 });
    const date = (label, v) => `<span class="tag${v === "tbd" ? " tbd" : ""}">${label} <b>${v}</b></span>`;

    // Zeitraum aus dem Personen-Dashboard: Monate, in denen die verknüpften Zeilen Tage haben
    const src = P.dashboards[D.fromDash];
    function period(c, p) {
      if ((c.when || {})[p.id]) return c.when[p.id];
      const ids = (c.from || {})[p.id];
      if (!src || !ids) return "";
      const rows = src.rows.filter((r) => ids.includes(r.id));
      const idx = src.months
        .map((m, i) => (rows.some((r) => ["p", "fl", "ag"].some((f) => (r[f] || {})[m.k])) ? i : -1))
        .filter((i) => i >= 0);
      if (!idx.length) return "";
      const n = (i) => src.months[i].n.slice(0, 3);
      // zusammenhängende Monate als „Dez – Jan“, Lücken mit Komma
      const parts = [];
      for (let k = 0; k < idx.length; k++) {
        let e = k;
        while (e + 1 < idx.length && idx[e + 1] === idx[e] + 1) e++;
        parts.push(e > k ? `${n(idx[k])} – ${n(idx[e])}` : n(idx[k]));
        k = e;
      }
      return parts.join(", ");
    }

    const legend =
      `<span><i class="sw" style="background:var(--sparks)"></i>Team</span>` +
      `<span><i class="sw ext"></i>Freelance</span>` +
      `<span><i class="sw ext ag"></i>Agentur</span>` +
      `<span class="hint">Tage je Paket, extern gestrichelt</span>`;

    const courses = D.courses.map((c) => {
      let sumT = 0, sumFl = 0, sumAg = 0;
      const rows = PK.filter((p) => days(c, p).t > 0).map((p) => {
        const d = days(c, p), team = Math.max(0, d.t - d.fl - d.ag);
        sumT += d.t; sumFl += d.fl; sumAg += d.ag;
        // Wer: Kurs-Angabe vor Paket-Angabe, extern wird ergänzt; ohne Person "offen"
        const person = (c.who || {})[p.id] || p.who;
        const who = [person, d.fl ? "Freelance" : "", d.ag ? "Agentur" : ""].filter(Boolean).join(" + ");
        const whoHtml = who || `<span class="open">offen</span>`;
        const when = period(c, p);
        const note = [p.sub, (c.notes || {})[p.id]].filter(Boolean).join(" · ");
        const cell =
          (team ? `<span class="chip" style="background:var(--sparks)">${nf(team)} T</span>` : "") +
          (d.fl ? `<span class="chip ext">FL ${nf(d.fl)} T</span>` : "") +
          (d.ag ? `<span class="chip ext ag">Agentur ${nf(d.ag)} T</span>` : "");
        return `<tr>` +
          `<td class="lab"><span class="t">${p.n}</span>` +
            (note ? `<span class="s">${note}</span>` : "") +
            `<span class="s who-m">${whoHtml}</span></td>` +
          `<td class="days"><div class="cell">${cell}</div></td>` +
          `<td class="who-c">${whoHtml}</td>` +
          `<td class="when">${when || `<span class="zero">—</span>`}</td></tr>`;
      }).join("");
      const sumTeam = sumT - sumFl - sumAg;

      return `<section class="panel course" aria-labelledby="kh-${c.id}">` +
        `<header class="khead">` +
          `<h2 id="kh-${c.id}">${c.n}<small>${c.partner}</small></h2>` +
          `<div class="kmeta">` +
            `<span class="tag kind-${c.kind}">${c.kindLabel}</span>` +
            date("Testing", c.test) + date("Release", c.release) +
          `</div>` +
          (c.sub ? `<p class="ksub">${c.sub}</p>` : "") +
        `</header>` +
        `<div class="scroll"><table class="ktbl">` +
          `<thead><tr><th>Paket</th><th>Tage</th><th class="who-h">Wer</th><th class="when">Zeitraum</th></tr></thead>` +
          `<tbody>${rows}</tbody>` +
          `<tfoot><tr class="sum"><td>Summe</td>` +
            `<td>${nf(sumT)} T<small class="ksplit">Team ${nf(sumTeam)}${sumFl ? ` · FL ${nf(sumFl)}` : ""}${sumAg ? ` · Agentur ${nf(sumAg)}` : ""}</small></td>` +
            `<td class="who-c"></td><td class="when"></td></tr></tfoot>` +
        `</table></div>` +
      `</section>`;
    }).join("");

    dash.innerHTML =
      `<div class="legend">${legend}</div>` +
      `<div class="courses">${courses}</div>`;

    return { track: [], sums: [] };
  }

  const RENDER = { person: renderPerson, kurse: renderKurse };

  /* =================================================================
     Stunden-Tracking (für alle Dashboard-Typen gleich)
     ================================================================= */
  let cur = { key: null, track: [], sums: [] };
  let hours = {};

  function paint() {
    for (const t of cur.track) {
      const v = hours[t.id] || 0, d = v - t.plan;
      $("val-" + t.id).textContent = nf(v) + " h";
      $("cmp-" + t.id).innerHTML = (t.plan ? `von ${nf(t.plan)} h` : "nicht geplant") +
        (t.plan && d > 0 ? ` · <b style="color:var(--over)">+${nf(d)} h</b>` : "");
    }
    for (const s of cur.sums) {
      const tv = s.ids.reduce((a, id) => a + (hours[id] || 0), 0);
      const tp = cur.track.filter((t) => s.ids.includes(t.id)).reduce((a, t) => a + t.plan, 0);
      $(s.el).innerHTML = `${nf(tv)} / ${nf(tp)} h<div class="meter"><i style="width:${tp ? Math.min(tv / tp, 1) * 100 : 0}%;background:${css(tv > tp ? "--over" : "--strat")}"></i></div>`;
    }
  }

  /* Speicher: Vercel-Funktion /api/hours (Supabase).
     Klicks werden als Differenz gesendet (+0,5 / −0,5 h), damit gleichzeitige
     Klicks verschiedener Personen sich nicht überschreiben. */
  const API = "/api/hours";
  const queued = {};          // noch nicht gesendete Differenzen je Paket
  let timer = null, sending = false;
  const state = (t) => { const el = $("trk-state"); if (el) el.textContent = t; };
  const take = (d) => { for (const t of cur.track) hours[t.id] = Number(d[t.id]) || 0; paint(); };

  // Server hat die Sitzung abgelehnt: Grund fürs Login-Fenster
  const kicked = async (r) => {
    const d = await r.json().catch(() => ({}));
    return `Bitte neu anmelden (Sitzung ungültig: ${d.reason || "unbekannt"})`;
  };

  async function load() {
    if (sending || timer || !cur.track.length || document.body.classList.contains("locked")) return;
    try {
      const r = await fetch(API, { cache: "no-store" });
      if (r.status === 401) { lock(await kicked(r)); return false; }
      if (!r.ok) throw new Error(r.status);
      take(await r.json());
      return true;
    } catch (e) {
      return false;
    }
  }

  async function flush() {
    clearTimeout(timer);
    timer = null;
    const batch = Object.entries(queued).filter(([, v]) => v !== 0);
    for (const k in queued) delete queued[k];
    if (!batch.length) return;
    sending = true;
    state("Stunden · speichert …");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: Object.fromEntries(batch) })
      });
      if (r.status === 401) { sending = false; lock(await kicked(r)); return; }
      if (!r.ok) throw new Error(r.status);
      take(await r.json());
      state("Stunden · gespeichert");
    } catch (e) {
      state("Speichern fehlgeschlagen");
    }
    sending = false;
  }

  // Klicks auf +/− (ein Listener für alle Dashboards)
  dash.addEventListener("click", (e) => {
    const b = e.target.closest(".ctr button");
    if (!b || b.disabled) return;
    const k = b.dataset.r, d = Number(b.dataset.d);
    if (d < 0 && (hours[k] || 0) <= 0) return;
    hours[k] = (hours[k] || 0) + d;
    queued[k] = (queued[k] || 0) + d;
    paint();
    state("Stunden · speichert …");
    clearTimeout(timer);
    timer = setTimeout(flush, 700);
  });

  // Stand anderer Personen regelmäßig nachladen
  setInterval(() => { if (!document.hidden) load(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });

  /* =================================================================
     Dashboards anzeigen und umschalten
     ================================================================= */
  const dashKeysOf = (user) => (((P.users || []).find((u) => u.id === user) || {}).dashboards || []).filter((k) => P.dashboards[k]);

  async function show(key) {
    if (timer) await flush();
    const D = P.dashboards[key];
    cur = { key, ...RENDER[D.type](D) };
    hours = {};
    title.textContent = D.title;
    document.title = `${D.title} · sparksplanner`;
    document.querySelectorAll("#dtabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.k === key));
    try { localStorage.setItem("sp-dash-" + me, key); } catch (e) {}
    paint();
    $("io").hidden = !cur.track.length;     // Export/Import nur mit Stunden-Tracking
    if (!cur.track.length) return;
    const ok = await load();
    if (cur.key !== key) return;            // inzwischen umgeschaltet
    if (ok) {
      dash.querySelectorAll(".ctr button").forEach((b) => { b.disabled = false; });
      state("Stunden · 1 Klick = ½ h");
    } else if (!document.body.classList.contains("locked")) {
      state("Stunden · Speicher nicht erreichbar");
    }
  }

  /* =================================================================
     Login
     ================================================================= */
  const LOGIN = "/api/login";
  const USERS = P.users || [];
  const form = $("gate-form"), sel = $("gate-user"), pw = $("gate-pw"), err = $("gate-err"), btn = $("gate-btn");
  let me = null, logins = 0;   // logins: zählt Anmeldeversuche (gegen verspätete Start-Prüfung)
  sel.replaceChildren(...USERS.map((u) => new Option(u.n, u.id)));

  function lock(msg) {
    me = null;
    cur = { key: null, track: [], sums: [] };
    document.body.classList.add("locked");
    dash.innerHTML = "";
    $("dtabs").innerHTML = "";
    title.textContent = "";
    $("who").textContent = "";
    err.textContent = msg || "";
    pw.value = "";
    (USERS.length > 1 ? sel : pw).focus();
  }

  function unlock(user) {
    me = user;
    const u = USERS.find((x) => x.id === user);
    document.body.classList.remove("locked");
    $("who").innerHTML = `Angemeldet als <span id="who-name"></span> · ` +
      `<span id="io"><button type="button" id="export">Export</button> · ` +
      `<button type="button" id="import">Import</button> · </span>` +
      `<button type="button" id="logout">Abmelden</button>`;
    $("who-name").textContent = u ? u.n : user;
    $("export").addEventListener("click", exportHours);
    $("import").addEventListener("click", () => $("import-file").click());
    $("logout").addEventListener("click", async () => {
      if (timer) await flush();
      try { await fetch(LOGIN, { method: "DELETE" }); } catch (e) {}
      lock();
    });

    const keys = dashKeysOf(user);
    if (!keys.length) {
      title.textContent = u ? u.n : user;
      dash.innerHTML = `<p class="kstate">Für dieses Konto ist noch kein Dashboard eingerichtet (plan.js → users → dashboards).</p>`;
      return;
    }
    // Umschalter nur, wenn das Konto mehrere Dashboards hat
    $("dtabs").innerHTML = keys.length > 1
      ? keys.map((k) => `<button type="button" role="tab" data-k="${k}">${P.dashboards[k].tab || P.dashboards[k].title}</button>`).join("")
      : "";
    let key = keys[0];
    try { const s = localStorage.getItem("sp-dash-" + user); if (keys.includes(s)) key = s; } catch (e) {}
    show(key);
  }
  $("dtabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b && b.dataset.k !== cur.key) show(b.dataset.k); });

  /* ---------- Export / Import ----------
     Datei-Format: { app, dashboard, exported, hours: { "<id>": Stunden }, rows: [lesbare Liste] }.
     Import setzt die Stunden des aktuellen Dashboards auf die Werte aus der Datei (überschreibt). */
  async function exportHours() {
    if ((await load()) === false) { alert("Export nicht möglich: Stunden konnten nicht geladen werden."); return; }
    const data = {
      app: "sparksplanner",
      dashboard: cur.key,
      exported: new Date().toISOString(),
      hours: Object.fromEntries(cur.track.map((t) => [t.id, hours[t.id] || 0])),
      rows: cur.track.map((t) => ({ id: t.id, name: t.n, ist: hours[t.id] || 0, plan: t.plan }))
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `sparksplanner-stunden-${cur.key}-${new Date().toISOString().slice(0, 10)}.json`;
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
      for (const t of cur.track) {
        const v = Number(src[t.id]);
        if (t.id in src && Number.isFinite(v) && v >= 0) set[t.id] = Math.round(v * 2) / 2;
      }
    } catch (err) {
      alert("Die Datei ist kein gültiger Stunden-Export (JSON).");
      return;
    }
    const n = Object.keys(set).length;
    if (!n) { alert("In der Datei wurden keine Pakete dieses Dashboards gefunden."); return; }
    const sum = Object.values(set).reduce((a, b) => a + b, 0);
    if (!confirm(`${n} Arbeitspakete mit zusammen ${nf(sum)} h importieren?\n\nDie aktuellen Stunden dieser Pakete werden überschrieben.`)) return;
    state("Stunden · importiert …");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set })
      });
      if (r.status === 401) { lock(await kicked(r)); return; }
      if (!r.ok) throw new Error(r.status);
      take(await r.json());
      state("Stunden · importiert");
    } catch (err) {
      state("Import fehlgeschlagen");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!pw.value) { err.textContent = "Bitte Passwort eingeben"; pw.focus(); return; }
    btn.disabled = true;
    err.textContent = "";
    logins++;
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
    const seen = logins;
    try {
      const r = await fetch(LOGIN, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (logins !== seen) return;          // inzwischen selbst angemeldet: Ergebnis ignorieren
      if (r.ok) unlock(d.user);
      else lock(r.status === 401 ? "" : d.error || "Login nicht erreichbar");
    } catch (e) {
      if (logins === seen) lock("Server nicht erreichbar");
    }
  })();
})();
