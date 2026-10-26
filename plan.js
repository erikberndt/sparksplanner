/* =====================================================================
   Digital Sparks Hours – Planungsdaten
   Nur diese Datei muss geändert werden, wenn sich der Plan ändert.

   Aufbau:
     users       wer sich anmelden kann und welche Dashboards er sieht
     dashboards  die Planungs-Ansichten, je nach Zweck ein eigener Typ:
                   type "person"  Monatsplanung einer Person (Tage je Monat)
                   type "kurse"   mehrere Kurse (Sparks) untereinander, je
                                  Kurs immer alle Arbeitspakete
   ===================================================================== */

window.PLAN = {
  stand: "26.10.2026",
  hoursPerDay: 8,          // Planwert in Stunden = Tage × hoursPerDay
  showPrio: false,         // PRIO-Label anzeigen (true) oder ausblenden (false)

  // Konten im Login-Dropdown. id muss zu PLANNER_USERS in Vercel passen
  // (Passwörter stehen nur dort, nie hier). dashboards = welche Ansichten
  // das Konto sieht; bei mehreren erscheinen oben Tabs zum Umschalten.
  users: [
    { id: "member1", n: "member1", dashboards: ["person"] },
    { id: "member2", n: "member2", dashboards: ["sparks"] }
  ],

  dashboards: {

    /* ---------------------------------------------------------------
       Personen-Dashboard: Monatsplanung eines Teammitglieds
       --------------------------------------------------------------- */
    person: {
      type: "person",
      title: "member1",        // große Überschrift oben
      tab: "Monatsplanung",    // Name im Umschalter (nur bei mehreren Dashboards)
      freelanceBudget: 6,      // Freelancertage gesamt

      // cap = verfügbare Arbeitstage der Person im Monat (Urlaub schon abgezogen)
      months: [
        { k: "okt", n: "Oktober",  d: "16.–30.10.", cap: 11 },
        { k: "nov", n: "November", d: "2.–30.11.",  cap: 21 },
        { k: "dez", n: "Dezember", d: "1.–18.12.",  cap: 14 },
        { k: "jan", n: "Januar",   d: "11.–29.1.",  cap: 15 }
      ],

      streams: {
        base:   { n: "Laufend",     c: "--eil" },
        strat:  { n: "DS · Strat",  c: "--strat" },
        sparks: { n: "DS · Sparks", c: "--sparks" }
      },

      // Arbeitspakete
      //   p  = Tage der Person je Monat
      //   fl = Freelance-Tage je Monat (kostet die Person nichts)
      //   ag = Agentur-Tage je Monat (kostet die Person nichts)
      //   id = fester Schlüssel für das Stunden-Tracking. NICHT ändern, sonst
      //        startet der Zähler dieses Pakets wieder bei 0. Der Name (n) darf
      //        frei geändert werden.
      rows: [
        { id: "r_leitung-okr-1",       s: "base",   n: "Leitung OKR-1",       sub: "max. 2 T bis 5.11., strikt",         p: { okt: 1.5, nov: 0.5 } },
        { id: "r_meetings",            s: "base",   n: "Meetings",            sub: "0,5 T pro Woche",                    p: { okt: 1, nov: 2, dez: 1.5, jan: 1.5 } },
        { id: "r_support-marketing",   s: "base",   n: "Support-Marketing",   sub: "0,5 T pro Woche, getimeboxed",       p: { okt: 1, nov: 2, dez: 1.5, jan: 1.5 } },

        { id: "r_brandbook-v1",        s: "strat",  n: "Brandbook V1",        sub: "1 T MA, 2 T Freelance",              p: { okt: 1 }, fl: { okt: 2 } },
        { id: "r_landing-page-v3",     s: "strat",  n: "Landing Page V3",     sub: "",                                   p: { okt: 1 } },
        { id: "r_influencer-kampagne", s: "strat",  n: "Influencer Kampagne", sub: "Direction, 4 Wochen à 0,5 T · inhaltlich extern", p: { nov: 2 }, prio: true },
        { id: "r_pitch-v1",            s: "strat",  n: "Pitch V1",            sub: "eher Brandbook-Input",               p: { nov: 2 } },

        { id: "r_greenjobs-interactive",  s: "sparks", n: "Greenjobs · Interactive",  sub: "intern · Release Mitte Dez",             p: { okt: 1, nov: 1, dez: 1 } },
        { id: "r_greenjobs-marketing",    s: "sparks", n: "Greenjobs · Marketing",    sub: "",                                       p: { dez: 1 } },
        { id: "r_einsamkeit-interactive", s: "sparks", n: "Einsamkeit · Interactive", sub: "intern · Test 30.11. · Release 15.1.",   p: { nov: 5 }, prio: true },
        { id: "r_einsamkeit-game",        s: "sparks", n: "Einsamkeit · Game",        sub: "",                                       p: { nov: 2, dez: 2 }, fl: { nov: 2 }, prio: true },
        { id: "r_einsamkeit-kampagne",    s: "sparks", n: "Einsamkeit · Kampagne",    sub: "Steuerung, Umsetzung Agentur",           p: { dez: 1, jan: 1 }, ag: { dez: 2, jan: 2 }, prio: true },
        { id: "r_mythos-support",         s: "sparks", n: "Mythos · Support",         sub: "Marktplatz · Release 15.1.",             p: { dez: 2, jan: 1 }, prio: true },
        { id: "r_mythos-kampagne",        s: "sparks", n: "Mythos · Kampagne",        sub: "Steuerung, Umsetzung Agentur",           p: { dez: 1, jan: 1 }, ag: { dez: 2, jan: 2 }, prio: true },
        { id: "r_klassenrat-support",     s: "sparks", n: "Klassenrat · Support",     sub: "Marktplatz · Einarbeitung Dez · Release 5.2.", p: { dez: 1, jan: 2 } },
        { id: "r_klassenrat-marketing",   s: "sparks", n: "Klassenrat · Marketing",   sub: "",                                       p: { jan: 1 } }
      ],

      // Wer übernimmt was (Listen unter der Tabelle)
      outsourcing: {
        freelance: [
          { t: "Brandbook V1",      v: "2 T", s: "Okt · MA steuert mit 1 T" },
          { t: "Einsamkeit · Game", v: "2 T", s: "Nov" }
        ],
        agentur: [
          { t: "Einsamkeit · Kampagne", v: "4 T", s: "Dez/Jan · MA steuert mit 2 T" },
          { t: "Mythos · Kampagne",     v: "4 T", s: "Dez/Jan · MA steuert mit 2 T" }
        ],
        team: [
          { t: "Pitch V1",            v: "bis Feb",    s: "MA liefert 2 T im Nov" },
          { t: "Influencer Kampagne", v: "inhaltlich", s: "MA macht 2 T Direction im Nov" }
        ]
      },

      notes: [
        "<b>OKR-1</b> endet laut Plan am 5.11. Falls es danach weiterläuft, kommen etwa 0,5 T pro Woche dazu.",
        "<b>Urlaub:</b> 8.11. ist ein Sonntag und kostet keinen Arbeitstag. Weihnachten 21.12.–8.1. ist nicht als Arbeitszeit gezählt.",
        "<b>Ausgleichstage:</b> Dieses Jahr keine. Alle 5 T sind offen und müssen 2027 genommen werden.",
        "<b>Marktplatz-Sparks:</b> Mythos und Klassenrat je 3 T Support, ohne Aufteilung in Brief und Interactive."
      ]
    },

    /* ---------------------------------------------------------------
       Kurs-Dashboard: die drei Sparks untereinander, je Kurs alle Pakete
       --------------------------------------------------------------- */
    sparks: {
      type: "kurse",
      title: "Sparks",
      tab: "Sparks",

      // Arbeitspakete, die jeder Kurs hat (in dieser Reihenfolge, immer alle).
      //   id  = fester Schlüssel fürs Stunden-Tracking, NICHT ändern
      //   who = wer das Paket macht (Agentur/Freelance wird automatisch ergänzt)
      packages: [
        { id: "contenterarbeitung", n: "Content-Erarbeitung", who: "" },
        { id: "contentsupport",     n: "Content-Support",     who: "Jorina" },
        { id: "interactive",        n: "Interactive",         who: "Gina" },
        { id: "briefing",           n: "Briefing",            sub: "Video, Illu", who: "Gina" },
        { id: "marketing",          n: "Marketing",           who: "Gina / Stephan" },
        { id: "einpflegen",         n: "Einpflegen",          who: "Content-Team" },
        { id: "iteration",          n: "Iteration & Review",  who: "Content & Gina" },
        { id: "dev",                n: "Dev",                 who: "Paul" }
      ],

      // Kurse
      //   id      = fester Schlüssel fürs Stunden-Tracking, NICHT ändern
      //   t       = Tage je Paket gesamt (inkl. extern)
      //   fl / ag = davon Freelance / Agentur (kostet das Team nichts)
      //   test / release: Datum oder "tbd"
      courses: [
        {
          id: "einsamkeit", n: "Einsamkeit", partner: "DKHW",
          kind: "intern", kindLabel: "Interner Kurs · mehr Ressourcen",
          sub: "Eigener Spark mit neuen Interactive-Inhalten und eigener Kampagne.",
          test: "30.11.", release: "15.1.",
          t:  { contenterarbeitung: 15, interactive: 11, briefing: 1, marketing: 6, einpflegen: 2, iteration: 2 },
          fl: { interactive: 2 },
          ag: { marketing: 4 },
          notes: { marketing: "Kampagne" }
        },
        {
          id: "mythos", n: "Mythos Neutralität", partner: "Robert Bosch",
          kind: "markt", kindLabel: "Marktplatzkurs",
          sub: "Marktplatz-Spark: nur Support, aber eigene Kampagne.",
          test: "tbd", release: "15.1.",
          t:  { contentsupport: 3, interactive: 3, briefing: 1, marketing: 6, einpflegen: 1, iteration: 2, dev: 1 },
          ag: { marketing: 4 },
          notes: { marketing: "Kampagne" }
        },
        {
          id: "klassenrat", n: "Klassenrat", partner: "DeGeDe",
          kind: "markt", kindLabel: "Marktplatzkurs",
          sub: "Marktplatz-Spark mit klassischem Marketingpaket.",
          test: "tbd", release: "W1 Februar",
          t:  { contentsupport: 3, interactive: 3, briefing: 1, marketing: 3, einpflegen: 1, iteration: 2, dev: 1 }
        }
      ]
    }
  }
};

// Stunden-Schlüssel je Dashboard. Wird von der Seite UND vom Server benutzt
// (api/_plan.js), damit beide dieselben Pakete kennen. Nicht ändern.
window.PLAN.kurseId = (c, p) => `k_${c.id}_${p.id}`;
window.PLAN.trackIds = (d) =>
  d.type === "kurse"
    ? d.courses.flatMap((c) => d.packages.map((p) => window.PLAN.kurseId(c, p)))
    : d.rows.map((r) => r.id);
