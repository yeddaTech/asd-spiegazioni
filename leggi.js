// Lettura ad alta voce: selezioni un pezzo di testo, compare «Leggi», una voce lo legge.
// Usa le voci del sistema (speechSynthesis) e sceglie da sola la più naturale in italiano.
// Mentre legge, la frase corrente è evidenziata e in basso c'è una barra con Ferma, velocità e voce.
(function () {
  "use strict";
  var sint = window.speechSynthesis;
  if (!sint || typeof SpeechSynthesisUtterance === "undefined") return;

  var CHIAVE = "asd-leggi";
  var VELOCITA = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
  var TOCCO = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  var pref = carica();
  var voci = [];
  var scelta = null;      // la selezione per cui è comparso il pulsante
  var stato = null;       // lettura in corso: { pezzi, segs, i, gen, u }
  var generazione = 0;
  var premuto = false;
  var ultimoScrollUtente = 0;
  var attesa = 0;
  var sentita = false;    // almeno una frase è partita davvero: il browser parla
  var controlloVoce = 0;

  function carica() {
    var p = { voce: "", vel: 1 };
    try {
      var s = JSON.parse(localStorage.getItem(CHIAVE) || "{}");
      if (typeof s.voce === "string") p.voce = s.voce;
      if (VELOCITA.indexOf(s.vel) >= 0) p.vel = s.vel;
    } catch (e) { /* senza memoria va bene lo stesso */ }
    return p;
  }
  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(pref)); } catch (e) { /* idem */ }
  }

  // ---- voci: prima quelle «neurali» (Edge, Google, Apple migliorate, Piper), in fondo eSpeak
  function punteggio(v) {
    var n = v.name.toLowerCase();
    if (/espeak|mbrola/.test(n)) return 1;
    var p = 10;
    if (/natural|neural|online/.test(n)) p = 100;
    else if (/google/.test(n)) p = 90;
    else if (/premium|enhanced|migliorat|siri|network/.test(n)) p = 85;
    else if (/piper|paola|riccardo/.test(n)) p = 70;
    else if (/alice|federica|luca|emma|elsa|isabella|diego|cosimo|giuseppe/.test(n)) p = 60;
    return p + (/^it[-_]it/i.test(v.lang) ? 1 : 0);
  }
  function aggiornaVoci() {
    var tutte = sint.getVoices() || [];
    voci = tutte.filter(function (v) { return /^it([-_]|$)/i.test(v.lang); });
    voci.sort(function (a, b) { return punteggio(b) - punteggio(a); });
    riempiSceltaVoce();
  }
  function voceAttuale() {
    if (!voci.length) aggiornaVoci();
    for (var i = 0; i < voci.length; i++) if (voci[i].name === pref.voce) return voci[i];
    return voci[0] || null;
  }
  function nomeBreve(v) {
    return v.name.replace(/^Microsoft\s+/i, "").replace(/\s*\((Natural|Neural)\)/i, "")
      .replace(/\s*[-–]\s*(Italian|Italiano).*$/i, "").replace(/\s+Online\b/i, "");
  }

  // ---- interfaccia
  var stile = document.createElement("style");
  stile.textContent = [
    ".leggi-btn { position: absolute; z-index: 1000; display: inline-flex; align-items: center; gap: 6px;",
    "  margin: 0; padding: 7px 14px; border: none; border-radius: 999px; background: var(--accent, #2f52c4); color: #fff;",
    "  font: 600 15px system-ui, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,.2); cursor: pointer; }",
    ".leggi-btn:hover { color: #fff; border: none; filter: brightness(1.1); }",
    ".leggi-btn.fisso { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }",
    ".leggi-btn svg, .leggi-barra svg { flex: none; }",
    ":root[data-theme=\"dark\"] .leggi-btn, :root[data-theme=\"dark\"] .leggi-btn:hover { color: #111; }",
    "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) .leggi-btn,",
    "  :root:not([data-theme=\"light\"]) .leggi-btn:hover { color: #111; } }",
    ".leggi-barra { position: fixed; z-index: 1001; left: 50%; transform: translateX(-50%);",
    "  bottom: calc(12px + env(safe-area-inset-bottom, 0px)); width: max-content; max-width: calc(100vw - 24px);",
    "  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 12px; padding: 8px 12px;",
    "  background: var(--card, #fff); color: var(--fg, #1f2328); border: 1px solid var(--border, #e4ddcf); border-radius: 14px;",
    "  box-shadow: 0 4px 18px rgba(0,0,0,.2); font: 14px system-ui, sans-serif; }",
    ".leggi-barra button { display: inline-flex; align-items: center; gap: 6px; margin: 0; padding: 5px 12px; }",
    ".leggi-barra label { display: inline-flex; align-items: center; gap: 6px; color: var(--muted, #5b6270); min-width: 0; }",
    ".leggi-barra select { font: 14px system-ui, sans-serif; width: auto; max-width: 42vw; padding: 4px 6px; border-radius: 8px;",
    "  border: 1px solid var(--border, #e4ddcf); background: var(--bg, #fbf8f1); color: var(--fg, #1f2328); }",
    ".leggi-avviso { flex-basis: 100%; max-width: 34em; text-align: center; color: var(--red, #b42318); }",
    ".leggi-btn[hidden], .leggi-barra[hidden], .leggi-barra [hidden] { display: none; }"
  ].join("\n");
  document.head.appendChild(stile);
  // Regola a parte: dove ::highlight non esiste viene scartata solo lei.
  var stileEv = document.createElement("style");
  stileEv.textContent = "::highlight(leggi) { background-color: var(--hl, #fff1a8); color: inherit; }";
  document.head.appendChild(stileEv);

  var ICONA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/>' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var QUADRATO = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" rx="1.5" fill="currentColor"/></svg>';

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "leggi-ui leggi-btn" + (TOCCO ? " fisso" : "");
  btn.innerHTML = ICONA + (TOCCO ? "Leggi la selezione" : "Leggi");
  btn.hidden = true;

  var barra = document.createElement("div");
  barra.className = "leggi-ui leggi-barra";
  barra.setAttribute("role", "region");
  barra.setAttribute("aria-label", "Lettura ad alta voce");
  barra.hidden = true;
  var ferma = document.createElement("button");
  ferma.type = "button";
  ferma.innerHTML = QUADRATO + "Ferma";
  var selVel = document.createElement("select");
  VELOCITA.forEach(function (v) {
    var o = document.createElement("option");
    o.value = String(v);
    o.textContent = String(v).replace(".", ",") + "×";
    if (v === pref.vel) o.selected = true;
    selVel.appendChild(o);
  });
  var selVoce = document.createElement("select");
  var etVel = document.createElement("label");
  etVel.append("Velocità", selVel);
  var etVoce = document.createElement("label");
  etVoce.append("Voce", selVoce);
  var avviso = document.createElement("span");
  avviso.className = "leggi-avviso";
  avviso.textContent = "La voce non parte. Chiudi del tutto il browser e riaprilo (su Linux succede se il servizio delle voci è stato riavviato).";
  avviso.hidden = true;
  barra.append(ferma, etVel, etVoce, avviso);

  function monta() { document.body.append(btn, barra); }
  if (document.body) monta(); else document.addEventListener("DOMContentLoaded", monta);

  function riempiSceltaVoce() {
    var attuale = voceAttuale();
    selVoce.textContent = "";
    voci.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v.name;
      o.textContent = nomeBreve(v);
      if (v === attuale) o.selected = true;
      selVoce.appendChild(o);
    });
    etVoce.hidden = voci.length < 2;
  }
  aggiornaVoci();
  if (sint.addEventListener) sint.addEventListener("voiceschanged", aggiornaVoci);

  // ---- quando compare il pulsante
  function nascondiBtn() { btn.hidden = true; scelta = null; }

  function controlla() {
    if (premuto && !TOCCO) return; // si sta ancora trascinando
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return nascondiBtn();
    var r = sel.getRangeAt(0);
    if (!/[\p{L}\p{N}]/u.test(sel.toString())) return nascondiBtn();
    var c = r.commonAncestorContainer;
    var el = c.nodeType === 1 ? c : c.parentElement;
    if (!el || el.closest(".leggi-ui, input, textarea, select, [contenteditable]")) return nascondiBtn();
    scelta = r.cloneRange();
    btn.hidden = false;
    if (!TOCCO) posiziona(r);
  }

  function posiziona(r) {
    var rs = Array.prototype.filter.call(r.getClientRects(), function (q) { return q.width > 0 && q.height > 0; });
    var ult = rs.length ? rs[rs.length - 1] : r.getBoundingClientRect();
    var w = btn.offsetWidth || 90, h = btn.offsetHeight || 34;
    var largh = document.documentElement.clientWidth;
    var x = Math.min(Math.max(8, ult.right - w / 2), largh - w - 8);
    var y = ult.bottom + 8;
    if (y + h > window.innerHeight - 8) y = (rs.length ? rs[0].top : ult.top) - h - 8;
    btn.style.left = (x + window.scrollX) + "px";
    btn.style.top = (y + window.scrollY) + "px";
  }

  document.addEventListener("pointerdown", function (e) {
    if (!e.target.closest || !e.target.closest(".leggi-ui")) premuto = true;
  }, true);
  function rilascio() { premuto = false; clearTimeout(attesa); attesa = setTimeout(controlla, 10); }
  document.addEventListener("pointerup", rilascio, true);
  document.addEventListener("pointercancel", function () { premuto = false; }, true);
  document.addEventListener("selectionchange", function () {
    clearTimeout(attesa);
    attesa = setTimeout(controlla, TOCCO ? 400 : 200);
  });
  document.addEventListener("keyup", function (e) { if (e.shiftKey || e.key === "Shift") rilascio(); });

  // Premere il pulsante non deve cancellare la selezione prima del click.
  btn.addEventListener("pointerdown", function (e) { e.preventDefault(); });
  btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
  btn.addEventListener("click", function () {
    if (!scelta) return;
    var r = scelta;
    nascondiBtn();
    var sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    leggi(r);
  });

  // ---- dal pezzo di pagina al testo, ricordando da quale nodo viene ogni carattere
  var BLOCCHI = "p, li, h1, h2, h3, h4, h5, h6, td, th, pre, dt, dd, figcaption, summary, blockquote, caption, div";
  var SALTA = "svg, script, style, button, select, option, textarea, input, .leggi-ui, [aria-hidden=\"true\"]";
  var A_CAPO = "\u2029";                       // fine di un blocco o di una riga di codice
  var SUP = ["\uE000", "\uE001"], SUB = ["\uE002", "\uE003"];

  function estrai(range) {
    var segs = [], testo = "";
    function metti(s, nodo, off) { segs.push({ nodo: nodo, da: testo.length, lun: s.length, off: off }); testo += s; }
    var radice = range.commonAncestorContainer;
    if (radice.nodeType !== 1) radice = radice.parentNode;
    var nascosto = new Map();
    function salta(el) {
      if (!nascosto.has(el)) nascosto.set(el, !!el.closest(SALTA) || el.getClientRects().length === 0);
      return nascosto.get(el);
    }
    var w = document.createTreeWalker(radice, NodeFilter.SHOW_TEXT);
    var n, blocco = null, sup = null, sub = null;
    while ((n = w.nextNode())) {
      if (!range.intersectsNode(n)) continue;
      var da = n === range.startContainer ? range.startOffset : 0;
      var a = n === range.endContainer ? range.endOffset : n.length;
      if (a <= da) continue;
      var el = n.parentElement;
      if (!el || salta(el)) continue;
      var b = el.closest(BLOCCHI);
      var su = el.closest("sup"), so = el.closest("sub");
      if (su !== sup && sup) metti(SUP[1], null, 0);
      if (so !== sub && sub) metti(SUB[1], null, 0);
      if (b !== blocco && testo) metti(A_CAPO, null, 0);
      if (su !== sup && su) metti(SUP[0], null, 0);
      if (so !== sub && so) metti(SUB[0], null, 0);
      blocco = b; sup = su; sub = so;
      var s = n.data.slice(da, a);
      if (el.closest("pre")) s = s.replace(/\n/g, A_CAPO); // stessa lunghezza: la mappa resta giusta
      metti(s, n, da);
    }
    if (sup) metti(SUP[1], null, 0);
    if (sub) metti(SUB[1], null, 0);
    return { testo: testo, segs: segs };
  }

  // Divide in frasi corte: si sente meglio e si evita il taglio dopo 15 secondi di Chrome.
  function pezzi(testo) {
    var out = [], inizio = 0;
    for (var i = 0; i < testo.length; i++) {
      var ch = testo[i], dopo = testo[i + 1];
      var fine = ch === A_CAPO || (".!?;:".indexOf(ch) >= 0 && (dopo === undefined || /\s/.test(dopo) || dopo === A_CAPO));
      if (fine || i === testo.length - 1) { aggiungiPezzo(out, testo, inizio, i + 1); inizio = i + 1; }
    }
    return out;
  }
  function aggiungiPezzo(out, testo, a, b) {
    while (b - a > 220) { // troppo lungo: taglia a una virgola (o a uno spazio) prima di 200 caratteri
      var t = testo.slice(a, a + 200);
      var k = Math.max(t.lastIndexOf(", "), t.lastIndexOf("; "));
      if (k < 60) k = t.lastIndexOf(" ");
      if (k < 60) k = 200; else k += 1;
      metti(a, a + k);
      a += k;
    }
    metti(a, b);
    function metti(x, y) {
      var p = parlato(testo.slice(x, y));
      if (/[\p{L}\p{N}]/u.test(p)) out.push({ a: x, b: y, parlato: p });
    }
  }

  // ---- dal testo scritto al testo da pronunciare
  var APICE = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "⁺": "+", "⁻": "−", "ⁿ": "n", "ⁱ": "i", "ʰ": "h", "ᵏ": "k", "ᵐ": "m", "ˣ": "x", "⁽": "(", "⁾": ")" };
  var PEDICE = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    "₊": "+", "₋": "−", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₘ": "m", "ₙ": "n" };
  var LETTERE = { b: "bi", c: "ci", d: "di", f: "effe", g: "gi", h: "acca", j: "i lunga", k: "cappa", l: "elle",
    m: "emme", n: "enne", p: "pi", q: "cu", r: "erre", s: "esse", t: "ti", v: "vu", w: "doppia vu", x: "ics",
    y: "ipsilon", z: "zeta" };
  var OPERANDO = "(?:[\\p{N})\\]′]|\\b[A-Za-z]\\b)"; // cifra, parentesi chiusa o lettera isolata
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre",
    "ottobre", "novembre", "dicembre"];
  var SIMBOLI = [
    [/[✓✗∎─⋮▲♠□❚↑⟨⟩«»“”"]/g, " "],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, function (m, g, n, a) { return MESI[n - 1] ? g + " " + MESI[n - 1] + " " + a : m; }],
    [/[ℐ]/g, "I"], [/[𝒫]/g, "P"], [/[𝒜]/g, "A"], [/ℕ/g, "N"], [/ℝ/g, "R"],
    [/<=|≤/g, " minore o uguale a "], [/>=|≥/g, " maggiore o uguale a "],
    [/!=|≠/g, " diverso da "], [/==/g, " uguale a "], [/</g, " minore di "], [/>/g, " maggiore di "],
    [/≈|∼/g, " circa "], [/=/g, " uguale a "],
    [/⌊/g, " parte intera inferiore di "], [/⌈/g, " parte intera superiore di "], [/[⌋⌉]/g, ", "],
    [/⟺|⇔/g, ", se e solo se, "], [/⇒/g, ", quindi, "], [/↔/g, " scambiato con "],
    [/←/g, " prende "], [/\s*→\s*/g, ", poi, "],
    [/∈/g, " appartiene a "], [/∉/g, " non appartiene a "], [/⊆/g, " contenuto in "], [/∪/g, " unione "], [/∩/g, " intersezione "],
    [/∀/g, " per ogni "], [/∃/g, " esiste "], [/∅/g, " insieme vuoto "], [/∞/g, " infinito "],
    [/√/g, " radice di "], [/∫/g, " integrale di "], [/½/g, " un mezzo "], [/±/g, " più o meno "],
    [/Θ|θ/g, "theta"], [/Ω|ω/g, "omega"], [/[Σ∑]/g, " sommatoria "], [/π/g, " pi greco "],
    [/α/g, " alfa "], [/β/g, " beta "], [/γ/g, " gamma "], [/[δΔ]/g, " delta "], [/ε/g, " epsilon "],
    [/λ/g, " lambda "], [/[µμ]/g, " mu "], [/[φϕ]/g, " fi "], [/ℓ/g, " elle "],
    [/″/g, " secondo "], [/′/g, " primo "],
    [/\bO\(/g, "o grande("],
    [/&&/g, " e "], [/\|\|/g, " o "], [/&/g, " e "],
    [/(\d)\s*%(?!\w)/g, "$1 per cento"], [/%/g, " modulo "], [/\bmod\b/g, " modulo "],
    [/(\d)\s*–\s*(?=\d)/g, "$1 fino a "], [/\s*[—–]\s*/g, ", "],
    [/,\s*…\s*,/g, ", fino a "], [/([\w\]])…(?=[\w(])/g, "$1 fino a "], [/…/g, ", "],
    [/\bvs\.?(?=\s)/g, "contro"], [/\bes\.(?=\s)/g, "per esempio"], [/\becc\./g, "eccetera"]
  ];
  var DOPO = [
    [new RegExp("(" + OPERANDO + ")\\s*[−-]\\s*(?=" + OPERANDO + "|\\(|theta|log)", "gu"), "$1 meno "],
    [/\s[−-]\s/g, " meno "], [/−/g, " meno "],
    [/\+/g, " più "], [/[×*]/g, " per "],
    [new RegExp("(" + OPERANDO + ")\\s*·\\s*(?=" + OPERANDO + "|\\(|theta|log)", "gu"), "$1 per "], [/·/g, ", "],
    [new RegExp("(" + OPERANDO + ")\\s*/\\s*(?=" + OPERANDO + "|\\()", "gu"), "$1 fratto "],
    [/\^/g, " alla "],
    [/(^|[^\p{L}\p{N}])(\p{L}|\d+)!/gu, "$1$2 fattoriale"], [/\)!/g, ") fattoriale"],
    [/\bln\b\s*/g, "logaritmo naturale di "], [/\blog\b\s*(?!in base)/g, "logaritmo di "],
    [/(\p{L})\[/gu, "$1 di "], [/[[\]]/g, " "],
    [/(\p{L})\(/gu, "$1 di ("],
    [/\bsx\b/g, "sinistra"], [/\bdx\b/g, "destra"],
    [/(\d)(\p{L})/gu, "$1 $2"]
  ];
  // Parole chiave dello pseudocodice, dette come le direbbe una persona
  var CHIAVI = { IF: "se", THEN: "allora", ELSE: "altrimenti", WHILE: "finché", DO: ",", FOR: "per", TO: "fino a",
    DOWNTO: "scendendo fino a", RETURN: "restituisci", AND: "e", OR: "o", NOT: "non", MOD: "modulo", NULL: "nul",
    MAKESET: "make set" };
  var LETTERA_SOLA = /(^|[^\p{L}\p{N}'’_])([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z])(?=$|[^\p{L}\p{N}'’_])/gu;

  function parlato(s) {
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿⁱʰᵏᵐˣ⁽⁾]+/g, function (m) {
      return SUP[0] + m.replace(/./g, function (c) { return APICE[c]; }) + SUP[1];
    });
    s = s.replace(/[₀-₉₊₋ᵢⱼₖₘₙ]+/g, function (m) {
      return SUB[0] + m.replace(/./g, function (c) { return PEDICE[c]; }) + SUB[1];
    });
    s = s.replace(/\uE000([^\uE000-\uE003]*)\uE001/g, function (m, x) {
      x = x.trim();
      if (x === "2") return " al quadrato ";
      if (x === "3") return " al cubo ";
      return " alla " + x + (x.length > 1 ? ", " : " "); // 2^(h+1) − 1: la virgola chiude l'esponente
    });
    s = s.replace(/\blog\s*\uE002([^\uE000-\uE003]*)\uE003\s*/g, "logaritmo in base $1 di ");
    s = s.replace(/\uE002([^\uE000-\uE003]*)\uE003/g, " $1 ");
    s = s.replace(/[\uE000-\uE003]/g, " ").replace(/\u2029/g, " ");
    s = s.replace(/\b[A-Z]{2,}\b/g, function (w) { return CHIAVI[w] ? " " + CHIAVI[w] + " " : w.length > 3 ? w.toLowerCase() : w; });
    SIMBOLI.forEach(function (r) { s = s.replace(r[0], r[1]); });
    DOPO.forEach(function (r) { s = s.replace(r[0], r[1]); });
    s = s.replace(/\b(logaritmo di|logaritmo in base \S+ di) ([.,;:]|$)/g, "logaritmo$2");
    s = s.replace(LETTERA_SOLA, function (m, prima, l) { return prima + LETTERE[l.toLowerCase()]; });
    return s.replace(/\s+([,.;:!?])/g, "$1").replace(/^[\s,.;:]+/, "").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/([,;:])(?:\s*[,;:])+/g, "$1").replace(/\s+/g, " ").trim();
  }

  // ---- la lettura
  function leggi(range) {
    fermaTutto();
    var e = estrai(range);
    var ps = pezzi(e.testo);
    if (!ps.length) return;
    stato = { pezzi: ps, segs: e.segs, i: 0, gen: ++generazione, u: null };
    aggiornaVoci();
    barra.hidden = false;
    if (sint.paused) sint.resume();
    prossimo();
  }

  function prossimo() {
    if (!stato) return;
    if (stato.i >= stato.pezzi.length) return fermaTutto();
    var p = stato.pezzi[stato.i], gen = stato.gen;
    var u = new SpeechSynthesisUtterance(p.parlato);
    var v = voceAttuale();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "it-IT";
    u.rate = pref.vel;
    u.onstart = function () { sentita = true; avviso.hidden = true; };
    u.onend = function () { sentita = true; if (stato && stato.gen === gen) { stato.i++; prossimo(); } };
    u.onerror = function (ev) {
      if (!stato || stato.gen !== gen || ev.error === "interrupted" || ev.error === "canceled") return;
      stato.i++; prossimo();
    };
    stato.u = u; // senza un riferimento Chrome a volte butta via la frase e onend non arriva
    evidenzia(p);
    sint.speak(u);
    // Se dopo qualche secondo non è partito niente, il browser non sta parlando: lo diciamo.
    clearTimeout(controlloVoce);
    if (!sentita) controlloVoce = setTimeout(function () { if (stato && !sentita) avviso.hidden = false; }, 6000);
  }

  // Cambiare voce o velocità riparte dalla frase corrente.
  function riparti() {
    if (!stato) return;
    stato.gen = ++generazione;
    sint.cancel();
    prossimo();
  }

  function fermaTutto() {
    generazione++;
    stato = null;
    sint.cancel();
    barra.hidden = true;
    avviso.hidden = true;
    clearTimeout(controlloVoce);
    if (window.CSS && CSS.highlights) CSS.highlights.delete("leggi");
  }

  function intervallo(segs, a, b) {
    var r = document.createRange(), ok = 0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (s.nodo && s.da + s.lun > a) { r.setStart(s.nodo, s.off + Math.max(0, a - s.da)); ok++; break; }
    }
    for (var j = segs.length - 1; j >= 0; j--) {
      var t = segs[j];
      if (t.nodo && t.da < b) { r.setEnd(t.nodo, t.off + Math.min(t.lun, b - t.da)); ok++; break; }
    }
    return ok === 2 ? r : null;
  }

  function evidenzia(p) {
    var r = intervallo(stato.segs, p.a, p.b);
    if (!r) return;
    if (window.CSS && CSS.highlights && typeof Highlight === "function") CSS.highlights.set("leggi", new Highlight(r));
    // Segue la lettura, ma solo se non hai appena fatto scorrere la pagina tu.
    if (Date.now() - ultimoScrollUtente < 4000) return;
    var q = r.getBoundingClientRect();
    if (q.height && (q.top < 40 || q.bottom > window.innerHeight - 110)) {
      window.scrollBy({ top: q.top - window.innerHeight / 3, behavior: "smooth" });
    }
  }
  ["wheel", "touchmove"].forEach(function (t) {
    window.addEventListener(t, function () { ultimoScrollUtente = Date.now(); }, { passive: true });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && stato) fermaTutto();
    else if (/^(Arrow|Page|Home|End| )/.test(e.key)) ultimoScrollUtente = Date.now();
  });

  ferma.addEventListener("click", fermaTutto);
  selVel.addEventListener("change", function () { pref.vel = Number(selVel.value); salva(); riparti(); });
  selVoce.addEventListener("change", function () { pref.voce = selVoce.value; salva(); riparti(); });
  window.addEventListener("pagehide", function () { sint.cancel(); });
})();
