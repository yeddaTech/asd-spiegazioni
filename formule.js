(function () {
  "use strict";
// Visualizzatori delle formule. Ogni <div class="widget" data-vf="nome"></div> diventa un riquadro passo per passo:
// in alto la riga del conto con i pezzi colorati, sotto un disegno con gli stessi colori, poi la spiegazione.
// Sorgenti in ~/.cache/asd-build/formule/ (questo file è la loro unione: vedi LEGGIMI.txt).
var VF = {};

var stileVF = document.createElement("style");
stileVF.textContent = [
  ".vf-formula { margin: 8px 0; padding: 8px 12px; border: 1px solid var(--border); border-radius: 9px; background: var(--card);",
  "  font-size: 1.05em; line-height: 2; overflow-wrap: anywhere; }",
  ".vf-dove { display: block; font: 600 13px/1.5 system-ui, sans-serif; color: var(--muted); }",
  ".vf-c1, .vf-c2, .vf-c3, .vf-c4, .vf-c5, .vf-c6 { border-radius: 5px; padding: 1px 4px; font-weight: 600;",
  "  -webkit-box-decoration-break: clone; box-decoration-break: clone; }",
  ".vf-c1 { background: var(--accent-soft); color: var(--accent); box-shadow: inset 0 -2px 0 var(--accent); }",
  ".vf-c2 { background: var(--orange-soft); color: var(--orange); box-shadow: inset 0 -2px 0 var(--orange); }",
  ".vf-c3 { background: var(--green-soft); color: var(--green); box-shadow: inset 0 -2px 0 var(--green); }",
  ".vf-c4 { background: var(--violet-soft); color: var(--violet); box-shadow: inset 0 -2px 0 var(--violet); }",
  ".vf-c5 { background: var(--red-soft); color: var(--red); box-shadow: inset 0 -2px 0 var(--red); }",
  ".vf-c6 { background: var(--hl); color: var(--fg); box-shadow: inset 0 -2px 0 var(--orange); }",
  ".vf-fig svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }",
  ".vf-param button { min-width: 42px; }"
].join("\n");
document.head.appendChild(stileVF);

function c1(s) { return '<span class="vf-c1">' + s + '</span>'; }
function c2(s) { return '<span class="vf-c2">' + s + '</span>'; }
function c3(s) { return '<span class="vf-c3">' + s + '</span>'; }
function c4(s) { return '<span class="vf-c4">' + s + '</span>'; }
function c5(s) { return '<span class="vf-c5">' + s + '</span>'; }
function c6(s) { return '<span class="vf-c6">' + s + '</span>'; }
function vfNum(x) { return String(Math.round(x * 100) / 100).replace(".", ","); }
function vfLog2(x) { return Math.log(x) / Math.LN2; }

// ---- disegno SVG con le classi di stile.css (e i colori di ripiego, se il foglio di stile non c'è)
var VF_RETT = {
  blu: ["r-blu", "#e8edfc", "#2f52c4"], arancio: ["r-arancio", "#fdf0e3", "#b4500f"], verde: ["r-verde", "#e6f5ea", "#17803d"],
  viola: ["r-viola", "#f1eafc", "#6d3fc0"], rosso: ["r-rosso", "#fdecea", "#b42318"], giallo: ["r-giallo", "#fff1a8", "#b4500f"],
  box: ["r-box", "#ffffff", "#9aa3b2"]
};
var VF_TESTO = { testo: ["t-testo", "#1f2328"], muted: ["t-muted", "#5b6270"], blu: ["t-blu", "#2f52c4"], verde: ["t-verde", "#17803d"],
  arancio: ["t-arancio", "#b4500f"], rosso: ["t-rosso", "#b42318"], viola: ["t-viola", "#6d3fc0"] };
var VF_TRATTO = { muted: ["--muted", "#5b6270"], blu: ["--accent", "#2f52c4"], verde: ["--green", "#17803d"], arancio: ["--orange", "#b4500f"],
  rosso: ["--red", "#b42318"], viola: ["--violet", "#6d3fc0"], testo: ["--fg", "#1f2328"] };
function r1(v) { return Math.round(v * 10) / 10; }

function Disegno(w, h, aria) { this.w = w; this.h = h; this.aria = aria; this.p = []; }
Disegno.prototype.rett = function (x, y, w, h, col, o) {
  o = o || {};
  var st = "";
  if (col === "vuoto") {
    this.p.push('<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (o.rx || 2) + '" fill="none" stroke="#9aa3b2" stroke-width="1.5" stroke-dasharray="4 3" style="stroke:var(--muted)"/>');
    return this;
  }
  var c = VF_RETT[col] || VF_RETT.box;
  if (o.tratteggio) st += "stroke-dasharray:4 3;";
  if (o.opacita !== undefined) st += "opacity:" + o.opacita + ";";
  this.p.push('<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (o.rx === undefined ? 2 : o.rx) +
    '" class="' + c[0] + '" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="' + (o.spessore || 1.5) + '"' + (st ? ' style="' + st + '"' : "") + '/>');
  return this;
};
Disegno.prototype.cerchio = function (x, y, r, col, o) {
  o = o || {};
  var c = VF_RETT[col] || VF_RETT.box;
  this.p.push('<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r + '" class="' + c[0] + '" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="' + (o.spessore || 1.5) + '"' +
    (o.attr || "") + (o.opacita !== undefined ? ' style="opacity:' + o.opacita + '"' : "") + '/>');
  return this;
};
Disegno.prototype.testo = function (x, y, t, o) {
  o = o || {};
  var c = VF_TESTO[o.col || "testo"];
  this.p.push('<text x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (o.anc || "middle") + '" font-size="' + (o.size || 12) + '"' +
    (o.peso ? ' font-weight="' + o.peso + '"' : "") + ' class="' + c[0] + '" fill="' + c[1] + '"' + (o.attr || "") + '>' + t + '</text>');
  return this;
};
Disegno.prototype.linea = function (x1, y1, x2, y2, col, o) {
  o = o || {};
  var c = VF_TRATTO[col || "muted"];
  this.p.push('<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + c[1] + '" stroke-width="' + (o.w || 1.5) + '"' +
    (o.tratt ? ' stroke-dasharray="4 3"' : "") + ' style="stroke:var(' + c[0] + ')' + (o.opacita !== undefined ? ";opacity:" + o.opacita : "") + '"/>');
  return this;
};
Disegno.prototype.freccia = function (x1, y1, x2, y2, col, o) {
  o = o || {};
  var c = VF_TRATTO[col || "muted"], d = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / d, uy = (y2 - y1) / d, L = 7;
  this.linea(x1, y1, x2 - ux * 3, y2 - uy * 3, col, o);
  var p1 = [x2 - ux * L - uy * L * 0.55, y2 - uy * L + ux * L * 0.55], p2 = [x2 - ux * L + uy * L * 0.55, y2 - uy * L - ux * L * 0.55];
  this.p.push('<path d="M' + r1(x2) + ' ' + r1(y2) + 'L' + r1(p1[0]) + ' ' + r1(p1[1]) + 'L' + r1(p2[0]) + ' ' + r1(p2[1]) + 'Z" fill="' + c[1] + '" style="fill:var(' + c[0] + ')"/>');
  return this;
};
// Graffa orizzontale da x1 a x2 all'altezza y: verso il basso (scritta sotto) o, con o.sopra, verso l'alto.
Disegno.prototype.graffa = function (x1, x2, y, t, o) {
  o = o || {};
  var s = o.sopra ? -1 : 1, c = VF_TRATTO[o.col || "muted"], m = (x1 + x2) / 2;
  this.p.push('<path d="M' + r1(x1) + ' ' + r1(y) + 'v' + 5 * s + 'H' + r1(x2) + 'v' + (-5 * s) + 'M' + r1(m) + ' ' + r1(y + 5 * s) + 'v' + 4 * s + '" fill="none" stroke="' + c[1] + '" stroke-width="1.3" style="stroke:var(' + c[0] + ')"/>');
  var anc = "middle", tx = m;
  if (o.anc === "start") { anc = "start"; tx = x1; } else if (o.anc === "end") { anc = "end"; tx = x2; }
  if (t) this.testo(tx, y + (o.sopra ? -13 : 22), t, { size: o.size || 11.5, col: o.tcol || "testo", anc: anc, peso: o.peso });
  return this;
};
// Graffa verticale da y1 a y2 alla x data, verso destra (scritta a destra).
Disegno.prototype.graffaV = function (x, y1, y2, t, o) {
  o = o || {};
  var c = VF_TRATTO[o.col || "muted"], m = (y1 + y2) / 2;
  this.p.push('<path d="M' + r1(x) + ' ' + r1(y1) + 'h5V' + r1(y2) + 'h-5M' + r1(x + 5) + ' ' + r1(m) + 'h4" fill="none" stroke="' + c[1] + '" stroke-width="1.3" style="stroke:var(' + c[0] + ')"/>');
  if (t) this.testo(x + 12, m + 4, t, { size: o.size || 11.5, anc: "start", col: o.tcol || "testo", peso: o.peso });
  return this;
};
Disegno.prototype.grezzo = function (s) { this.p.push(s); return this; };
Disegno.prototype.svg = function (scala) {
  scala = scala || 1.3;
  return '<svg viewBox="0 0 ' + this.w + ' ' + this.h + '" width="' + Math.round(this.w * scala) + '" height="' + Math.round(this.h * scala) +
    '" role="img" aria-label="' + this.aria + '">' + this.p.join("") + '</svg>';
};
function ap(e) { return '<tspan baseline-shift="super" font-size="75%">' + e + '</tspan>'; }
function pd(e) { return '<tspan baseline-shift="sub" font-size="75%">' + e + '</tspan>'; }

// Scala di quadretti: colonne affiancate dal basso (fondo = y del bordo inferiore).
// colonne: [{ h, col, sopra: quadretti in più sopra (copia capovolta), colSopra }]
function vfScala(D, x0, fondo, colonne, q) {
  colonne.forEach(function (c, j) {
    for (var r = 0; r < c.h; r++) D.rett(x0 + j * q, fondo - (r + 1) * q, q - 2, q - 2, c.col, { rx: 3 });
    for (var s = 0; s < (c.sopra || 0); s++) D.rett(x0 + j * q, fondo - (c.h + s + 1) * q, q - 2, q - 2, c.colSopra || "viola", { rx: 3, tratteggio: true, opacita: 0.85 });
  });
}

// ---- il riquadro
function vfMonta(el) {
  var def = VF[el.getAttribute("data-vf")];
  if (!def) return;
  var V = { passo: 0, modo: def.modi ? def.modi[0][0] : null, par: {} };
  (def.parametri || []).forEach(function (p) { V.par[p.id] = p.val; });
  var h = "<h4>" + def.titolo + "</h4>";
  if (def.modi) h += '<div class="controlli"><label>Modo <select data-r="modo" style="width:auto;max-width:100%">' +
    def.modi.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + "</option>"; }).join("") + "</select></label></div>";
  (def.parametri || []).forEach(function (p) {
    h += '<div class="controlli vf-param"><span class="piccolo">' + p.nome + ":</span> " + p.valori.map(function (v, k) {
      return '<button data-p="' + p.id + '" data-k="' + k + '">' + (p.etichetta ? p.etichetta(v) : v) + "</button>";
    }).join("") + "</div>";
  });
  h += '<div class="vf-formula" data-r="formula"></div><div class="figura vf-fig" data-r="fig" style="margin:6px 0"></div>' +
    '<div class="controlli"><button data-r="ind">← Indietro</button><button class="primario" data-r="av">Avanti →</button><span class="piccolo" data-r="n"></span></div>' +
    '<div class="narrazione" data-r="txt" style="min-height:6em"></div>' + (def.legenda ? '<p class="piccolo" style="margin:8px 0 0">' + def.legenda + "</p>" : "");
  el.innerHTML = h;
  function r(x) { return el.querySelector('[data-r="' + x + '"]'); }
  function mostra() {
    var P = def.passi(V.par, V.modo);
    V.passo = Math.max(0, Math.min(V.passo, P.length - 1));
    var s = P[V.passo];
    r("formula").innerHTML = (s.dove ? '<span class="vf-dove">' + s.dove + "</span>" : "") + s.formula;
    r("fig").innerHTML = s.disegno;
    r("txt").innerHTML = "<b>" + (V.passo + 1) + ". " + s.tit + ".</b> " + s.testo;
    r("n").textContent = "passo " + (V.passo + 1) + " di " + P.length;
    r("ind").disabled = V.passo === 0;
    r("av").disabled = V.passo === P.length - 1;
    [].forEach.call(el.querySelectorAll("button[data-p]"), function (b) {
      var p = def.parametri.filter(function (q) { return q.id === b.getAttribute("data-p"); })[0];
      b.className = p.valori[Number(b.getAttribute("data-k"))] === V.par[p.id] ? "primario" : "";
    });
  }
  el.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button, [data-vfp]") : null;
    if (!b || !el.contains(b)) return;
    if (b.getAttribute("data-r") === "av") V.passo++;
    else if (b.getAttribute("data-r") === "ind") V.passo--;
    else if (b.hasAttribute("data-p")) {
      var p = def.parametri.filter(function (q) { return q.id === b.getAttribute("data-p"); })[0];
      V.par[p.id] = p.valori[Number(b.getAttribute("data-k"))];
      if (p.ricomincia) V.passo = 0;
    } else if (b.hasAttribute("data-vfp")) V.par[b.getAttribute("data-vfp")] = Number(b.getAttribute("data-vfv"));
    else return;
    mostra();
  });
  var sm = r("modo");
  if (sm) sm.addEventListener("change", function () { V.modo = sm.value; V.passo = 0; mostra(); });
  mostra();
}

// ================================================================ pacco 0
// ---- Gauss: 1 + 2 + … + n come una scala di quadretti
VF.gauss = {
  titolo: "La formula di Gauss, vista con i quadretti",
  parametri: [{ id: "n", nome: "n", valori: [2, 3, 4, 5, 6, 7, 8, 9], val: 5 }],
  legenda: "Ogni colonna è un addendo: la colonna j ha j quadretti. In viola tratteggiato la copia capovolta della scala.",
  passi: function (P) {
    var n = P.n, q = 24, x0 = 34, fondo = 20 + (n + 1) * q, W = x0 + (n + 2) * q + 70, H = fondo + 46;
    function nuovo() { return new Disegno(W, H, "scala di quadretti per n = " + n); }
    function etichette(D, k) { for (var j = 0; j < k; j++) D.testo(x0 + j * q + (q - 2) / 2, fondo + 14, j + 1, { size: 11, col: "muted" }); }
    var S = [], D, col, j;
    D = nuovo();
    col = []; for (j = 1; j <= n; j++) col.push({ h: j, col: "blu" });
    vfScala(D, x0, fondo, col, q); etichette(D, n);
    D.graffa(x0, x0 + n * q - 2, fondo + 22, "1 + 2 + … + " + n);
    S.push({ tit: "La somma come una scala", dove: "Tesi P(n), con n = " + n,
      formula: c1("1 + 2 + … + n") + " = n(n + 1)/2",
      testo: "Metto gli addendi uno accanto all'altro come colonne di quadretti: la colonna 1 ha un quadretto, la colonna 2 ne ha due, …, la colonna n ne ha n. La somma 1 + 2 + … + n è il numero di quadretti della scala blu. Il conto qui sopra dimostra che sono n(n + 1)/2.",
      disegno: D.svg() });
    D = nuovo();
    col = []; for (j = 1; j < n; j++) col.push({ h: j, col: "blu" }); col.push({ h: n, col: "arancio" });
    vfScala(D, x0, fondo, col, q); etichette(D, n);
    if (n > 1) D.graffa(x0, x0 + (n - 1) * q - 2, fondo + 22, "1 + … + (n − 1)", { tcol: "blu" });
    D.graffaV(x0 + n * q + 2, fondo - n * q, fondo - 2, "n = " + n, { tcol: "arancio" });
    S.push({ tit: "Separo l'ultimo addendo", dove: "Riga 1 del conto (nota 1)",
      formula: "1 + 2 + … + n = " + c1("[1 + 2 + … + (n − 1)]") + " + " + c2("n"),
      testo: "L'ultima colonna, quella alta n, la tengo da parte (arancione). Quello che resta, in blu, è la scala fino a n − 1: è la somma tra parentesi quadre.",
      disegno: D.svg() });
    D = nuovo();
    col = []; for (j = 1; j < n; j++) col.push({ h: j, col: "blu", sopra: n - j }); col.push({ h: n, col: "arancio" });
    vfScala(D, x0, fondo, col, q); etichette(D, n);
    if (n > 1) {
      D.graffa(x0, x0 + (n - 1) * q - 2, fondo + 22, "n − 1 = " + (n - 1) + " colonne", { tcol: "blu" });
      D.graffaV(x0 - 30, fondo - n * q, fondo - 2, "", {});
      D.testo(x0 - 14, fondo - n * q / 2 + 4, "n", { size: 12, peso: 600, anc: "end" });
    }
    S.push({ tit: "Uso l'ipotesi induttiva", dove: "Riga 2 del conto (nota 2)",
      formula: "= " + c1("(n − 1)n/2") + " + " + c2("n"),
      testo: "Per l'ipotesi induttiva la scala blu vale (n − 1)n/2. Si vede così: due copie della scala blu, una capovolta sopra l'altra (la viola tratteggiata), riempiono un rettangolo di n − 1 colonne e n righe, cioè (n − 1)n quadretti. Una scala sola è la metà: (n − 1)n/2. La colonna arancione resta n.",
      disegno: D.svg() });
    D = nuovo();
    col = []; for (j = 1; j < n; j++) col.push({ h: n, col: "blu" }); col.push({ h: n, col: "arancio" }, { h: n, col: "arancio" });
    vfScala(D, x0, fondo, col, q);
    for (j = 1; j < n; j++) for (var r = 0; r < n; r++) if (r >= j) D.rett(x0 + (j - 1) * q, fondo - (r + 1) * q, q - 2, q - 2, "viola", { rx: 3, tratteggio: true });
    D.rett(x0 + n * q, fondo - n * q, q - 2, n * q - 2, "arancio", { tratteggio: true, rx: 3, opacita: 0.6 });
    if (n > 1) D.graffa(x0, x0 + (n - 1) * q - 2, fondo + 22, c1t("n² − n"), {});
    D.graffa(x0 + (n - 1) * q, x0 + (n + 1) * q - 2, fondo + 22, c2t("2n"), {});
    D.graffaV(x0 + (n + 1) * q + 2, fondo - n * q, fondo - 2, "n = " + n);
    S.push({ tit: "Stesso denominatore", dove: "Riga 3 del conto (nota 3)",
      formula: "= (" + c1("n² − n") + " + " + c2("2n") + ")/2",
      testo: "Per sommare le due parti le scrivo tutte e due «in mezzi». Il rettangolo blu e viola ha (n − 1) · n = n² − n quadretti. La colonna arancione n diventa 2n/2: due colonne arancioni alte n. Messe accanto al rettangolo fanno un rettangolo più largo, di n + 1 colonne e n righe: n² − n + 2n = n² + n quadretti. La nostra somma è la metà.",
      disegno: D.svg() });
    D = nuovo();
    col = []; for (j = 1; j < n; j++) col.push({ h: j, col: "blu", sopra: n + 1 - j }); col.push({ h: n, col: "arancio", sopra: 1 });
    vfScala(D, x0, fondo, col, q); etichette(D, n);
    D.graffa(x0, x0 + n * q - 2, fondo + 22, "n = " + n + " colonne");
    D.graffaV(x0 + n * q + 2, fondo - (n + 1) * q, fondo - 2, "n + 1 = " + (n + 1) + " righe");
    S.push({ tit: "Il risultato", dove: "Riga 4 del conto",
      formula: "= " + c4("n(n + 1)") + "/2 ✓",
      testo: "n² + n = n(n + 1). Lo stesso si vede rimettendo insieme la scala intera 1 + … + n (blu più arancione): con la sua copia capovolta (viola) riempie un rettangolo di n colonne e n + 1 righe, cioè n(n + 1) quadretti. La scala è la metà: n(n + 1)/2 = " + n * (n + 1) / 2 + ". È la tesi.",
      disegno: D.svg() });
    return S;
  }
};
function c1t(s) { return '<tspan class="t-blu" fill="#2f52c4" font-weight="600">' + s + "</tspan>"; }
function c2t(s) { return '<tspan class="t-arancio" fill="#b4500f" font-weight="600">' + s + "</tspan>"; }
function c3t(s) { return '<tspan class="t-verde" fill="#17803d" font-weight="600">' + s + "</tspan>"; }
function c4t(s) { return '<tspan class="t-viola" fill="#6d3fc0" font-weight="600">' + s + "</tspan>"; }
function c5t(s) { return '<tspan class="t-rosso" fill="#b42318" font-weight="600">' + s + "</tspan>"; }

// ---- moltiplicazione alla russa e potenza alla russa: lo stesso disegno
// Un rettangolo di righe: ogni riga ha «larg» quadretti. Si dimezzano le righe e si raddoppia la larghezza; le righe staccate vanno a parte.
function vfGiriRussa(a, b) {
  var G = [{ a: a, b: b, prod: 0, strisce: [] }];
  while (G[G.length - 1].b > 0) {
    var p = G[G.length - 1], dispari = p.b % 2 === 1;
    G.push({ a: 2 * p.a, b: Math.floor(p.b / 2), prod: p.prod + (dispari ? p.a : 0), strisce: dispari ? p.strisce.concat([p.a]) : p.strisce.slice(), dispari: dispari });
  }
  return G;
}
// st: { larg, righe, strisce }, o: { rigaVia, taglio, affianca: larghezza della metà, nuovaStriscia, cella: testo nei quadretti, etichette }
function vfDisegnaRussa(st, o, L) {
  var q = L.q, x0 = 66, y0 = 52, maxR = L.maxRighe, yP = y0 + maxR * q + 34, W = L.W, H = yP + Math.max(1, L.maxStrisce) * (q + 6) + 26;
  var D = new Disegno(W, H, L.aria), i, r, k;
  function cella(x, y, col, op) { D.rett(x, y, q - 2, q - 2, col, { rx: 2, tratteggio: op && op.tratt }); if (o.cella && q >= 13) D.testo(x + (q - 2) / 2, y + q / 2 + 2, o.cella, { size: Math.min(11, q - 4), col: "muted" }); }
  D.testo(6, 14, L.titoloRett, { anc: "start", size: 11.5, col: "muted" });
  if (o.affianca) {
    var w = o.affianca;
    for (r = 0; r < st.righe; r++) for (k = 0; k < 2 * w; k++) cella(x0 + k * q, y0 + r * q, k < w ? "blu" : "viola");
    if (st.righe) { D.linea(x0 + w * q - 1, y0 - 4, x0 + w * q - 1, y0 + st.righe * q + 2, "muted", { tratt: true }); }
  } else {
    var via = o.rigaVia ? 1 : 0;
    for (r = 0; r < st.righe; r++) for (k = 0; k < st.larg; k++) {
      var col = r < via ? "arancio" : (o.taglio && r - via >= (st.righe - via) / 2 ? "viola" : "blu");
      cella(x0 + k * q, y0 + r * q, col);
    }
    if (o.taglio && st.righe - via > 0) {
      var yt = y0 + (via + (st.righe - via) / 2) * q - 1;
      D.linea(x0 - 6, yt, x0 + st.larg * q + 4, yt, "rosso", { w: 2, tratt: true });
      D.testo(x0 + st.larg * q + 8, yt + 4, "taglio", { anc: "start", size: 11, col: "rosso" });
    }
  }
  var righe = st.righe, larg = o.affianca ? 2 * o.affianca : st.larg;
  if (righe) {
    D.graffaV(x0 + larg * q + 2, y0, y0 + righe * q - 2, L.etRighe(righe), { tcol: "testo" });
    D.graffa(x0, x0 + larg * q - 2, y0 - 6, L.etLarg(larg), { sopra: true });
  } else D.testo(x0, y0 + 14, L.vuoto, { anc: "start", size: 12, col: "muted" });
  D.testo(6, yP - 10, L.titoloProd + (st.strisce.length || o.nuovaStriscia ? "" : L.prodVuoto), { anc: "start", size: 11.5, col: "muted" });
  var tutte = st.strisce.concat(o.nuovaStriscia ? [o.nuovaStriscia] : []);
  tutte.forEach(function (w, j) {
    var nuova = o.nuovaStriscia && j === tutte.length - 1;
    for (k = 0; k < w; k++) cella(x0 + k * q, yP + j * (q + 6), nuova ? "arancio" : "verde");
    D.testo(x0 + w * q + 6, yP + j * (q + 6) + q / 2 + 3, L.etStriscia(w), { anc: "start", size: 11, col: nuova ? "arancio" : "verde" });
  });
  return D.svg(1.25);
}
function vfMisureRussa(G, W) {
  var maxL = 1, maxR = 1;
  G.forEach(function (s) { if (s.b > 0) maxL = Math.max(maxL, s.a); maxR = Math.max(maxR, s.b); s.strisce.forEach(function (w) { maxL = Math.max(maxL, w); }); });
  return { q: Math.max(9, Math.min(20, Math.floor((W - 150) / maxL))), maxRighe: maxR, maxStrisce: G[G.length - 1].strisce.length, W: W };
}
function sub(s) { return "<sub>" + s + "</sub>"; }

VF.russa = {
  titolo: "L'invariante alla russa, con un rettangolo di quadretti",
  parametri: [{ id: "ab", nome: "a × b", valori: ["3 × 5", "13 × 11", "4 × 6", "2 × 7", "5 × 2"], val: "3 × 5", ricomincia: true }],
  legenda: "Il rettangolo ha a colonne e b righe: a · b quadretti. In verde prod, cioè le righe già messe da parte. Blu + verde fa sempre a · b: è l'invariante.",
  passi: function (P) {
    var ab = P.ab.split(" × ").map(Number), a = ab[0], b = ab[1], G = vfGiriRussa(a, b);
    var M = vfMisureRussa(G, 380);
    var L = { q: M.q, maxRighe: M.maxRighe, maxStrisce: M.maxStrisce, W: M.W, aria: "moltiplicazione alla russa di " + a + " per " + b,
      titoloRett: "da moltiplicare: a · b", titoloProd: "prod (messo da parte)", prodVuoto: " = 0", vuoto: "vuoto: b = 0",
      etRighe: function (r) { return "b = " + r; }, etLarg: function (w) { return "a = " + w; }, etStriscia: function (w) { return "+ " + w; } };
    var S = [];
    S.push({ tit: "All'inizio", dove: "Base (i = 0): a = " + a + ", b = " + b,
      formula: "a" + sub(0) + " · b" + sub(0) + " + prod" + sub(0) + " = " + c1("a · b") + " + " + c3("0") + " = a · b ✓",
      testo: "Il rettangolo blu ha a = " + a + " colonne e b = " + b + " righe: a · b = " + a * b + " quadretti, proprio il prodotto da calcolare. prod (in verde) è ancora vuoto. L'invariante dice che i quadretti blu più quelli verdi fanno sempre a · b: a ogni giro i quadretti si spostano, ma non se ne perde e non se ne aggiunge nessuno.",
      disegno: vfDisegnaRussa({ larg: a, righe: b, strisce: [] }, {}, L) });
    for (var i = 1; i < G.length; i++) {
      var p = G[i - 1], g = G[i], im = "i−1", dove = "Giro " + i + ": a" + sub(im) + " = " + p.a + ", b" + sub(im) + " = " + p.b + ", prod" + sub(im) + " = " + p.prod;
      if (!g.dispari) {
        S.push({ tit: "Giro " + i + ": b = " + p.b + " è pari, taglio a metà", dove: dove + " (caso b pari, riga 1)",
          formula: "a" + sub("i") + " · b" + sub("i") + " + prod" + sub("i") + " = " + c1("2a" + sub(im) + " · b" + sub(im) + "/2") + " + " + c3("prod" + sub(im)),
          testo: "b è pari: taglio il rettangolo a metà, in orizzontale. Ogni metà ha a" + sub(im) + " = " + p.a + " colonne e b" + sub(im) + "/2 = " + p.b / 2 + " righe.",
          disegno: vfDisegnaRussa({ larg: p.a, righe: p.b, strisce: p.strisce }, { taglio: true }, L) });
        S.push({ tit: "Giro " + i + ": affianco le due metà", dove: dove + " (caso b pari, righe 2 e 3)",
          formula: "= " + c1("a" + sub(im) + " · b" + sub(im)) + " + " + c3("prod" + sub(im)) + " = a · b ✓ (HI)",
          testo: "Metto la metà viola accanto a quella blu. Ora il rettangolo ha il doppio delle colonne, a" + sub("i") + " = 2a" + sub(im) + " = " + g.a + " (riga 6), e metà delle righe, b" + sub("i") + " = " + g.b + " (riga 5). I quadretti sono gli stessi, solo spostati: 2a · b/2 = a · b. prod non cambia. Quindi il totale è quello di prima, che per l'ipotesi induttiva è a · b.",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: g.strisce }, { affianca: p.a }, L) });
      } else {
        S.push({ tit: "Giro " + i + ": b = " + p.b + " è dispari, stacco una riga", dove: dove + " (caso b dispari, riga 1)",
          formula: "a" + sub("i") + " · b" + sub("i") + " + prod" + sub("i") + " = 2a" + sub(im) + " · (b" + sub(im) + " − 1)/2 + " + c3("prod" + sub(im)) + " + " + c2("a" + sub(im)),
          testo: "b è dispari, quindi non si taglia a metà. Prima stacco una riga, cioè a" + sub(im) + " = " + p.a + " quadretti (arancioni), e la metto in prod: è la riga 4, prod ← prod + a. Restano b − 1 = " + (p.b - 1) + " righe: un numero pari.",
          disegno: vfDisegnaRussa({ larg: p.a, righe: p.b, strisce: p.strisce }, { rigaVia: true, nuovaStriscia: p.a }, L) });
        S.push({ tit: "Giro " + i + ": il resto si taglia e si affianca", dove: dove + " (caso b dispari, nota 3)",
          formula: "= " + c1("a" + sub(im) + "b" + sub(im) + " − a" + sub(im)) + " + " + c3("prod" + sub(im)) + " + " + c2("a" + sub(im)),
          testo: (p.b - 1 > 0 ? "Le " + (p.b - 1) + " righe rimaste si tagliano a metà e si affiancano, come nel caso pari: il rettangolo ha ora " + g.a + " colonne e " + g.b + (g.b === 1 ? " riga" : " righe") + ". " : "Non resta nessuna riga: il rettangolo sparisce (b" + sub("i") + " = 0). ") +
            "Quanti quadretti blu? 2a · (b − 1)/2 = a(b − 1) = ab − a: quelli di prima meno la riga staccata.",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: p.strisce }, { affianca: g.b ? p.a : 0, nuovaStriscia: p.a }, L) });
        S.push({ tit: "Giro " + i + ": il totale non cambia", dove: dove + " (caso b dispari, righe 3 e 4)",
          formula: "= " + c1("a" + sub(im) + " · b" + sub(im)) + " + " + c3("prod" + sub(im)) + " = a · b ✓ (HI)",
          testo: "La riga arancione è uscita dal rettangolo (− a) ed è entrata in prod (+ a): i due pezzi si cancellano. Il totale è quello di prima, che per l'ipotesi induttiva è a · b. Ora prod = " + g.prod + ".",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: p.strisce }, { affianca: g.b ? p.a : 0, nuovaStriscia: p.a }, L) });
      }
    }
    var f = G[G.length - 1];
    S.push({ tit: "Uscita: b = 0", dove: "Uscita, dopo " + (G.length - 1) + " giri",
      formula: "a" + sub("i") + " · 0 + " + c3("prod" + sub("i")) + " = a · b, quindi prod" + sub("i") + " = a · b ✓",
      testo: "Il rettangolo blu è vuoto: tutti i quadretti sono finiti in prod. Le strisce verdi sono " + f.strisce.join(" + ") + " = " + f.prod + " = " + a + " · " + b + ".",
      disegno: vfDisegnaRussa({ larg: f.a, righe: 0, strisce: f.strisce }, {}, L) });
    return S;
  }
};

VF.potrussa = {
  titolo: "L'invariante della potenza alla russa, con le x",
  parametri: [{ id: "y", nome: "y", valori: [5, 6, 7, 11, 13], val: 13, ricomincia: true }],
  legenda: "Ogni riga è un fattore: una riga di 2ⁱ quadretti x vale x<sub>i</sub> = x elevato a 2ⁱ. Le x in tutto sono sempre y: è l'invariante x<sub>i</sub><sup>y<sub>i</sub></sup> · power<sub>i</sub> = x<sup>y</sup>.",
  passi: function (P) {
    var y = P.y, G = vfGiriRussa(1, y), M = vfMisureRussa(G, 380);
    var L = { q: Math.min(M.q, 18), maxRighe: M.maxRighe, maxStrisce: M.maxStrisce, W: M.W, aria: "potenza alla russa con y = " + y,
      titoloRett: "da moltiplicare: x" + pd("i") + ap("y" + pd("i")), titoloProd: "power (messo da parte)", prodVuoto: " = 1", vuoto: "vuoto: y = 0",
      etRighe: function (r) { return "y" + pd("i") + " = " + r + (r === 1 ? " fattore" : " fattori"); }, etLarg: function (w) { return "x" + pd("i") + " = x" + ap(w); },
      etStriscia: function (w) { return "· x" + ap(w); } };
    var S = [], o = { cella: "x" };
    function con(extra) { var r = { cella: "x" }; for (var k in extra) r[k] = extra[k]; return r; }
    S.push({ tit: "All'inizio", dove: "Base (i = 0): y = " + y,
      formula: "x" + sub(0) + "<sup>y" + sub(0) + "</sup> · power" + sub(0) + " = " + c1("x<sup>y</sup>") + " · " + c3("1") + " = x<sup>y</sup> ✓",
      testo: "x<sup>y</sup> è x moltiplicato y volte: " + y + " righe, ognuna con una x (in blu). power (in verde) è ancora 1, cioè vuoto. L'invariante dice che le x blu più quelle verdi sono sempre y: a ogni giro si spostano, ma il loro numero non cambia.",
      disegno: vfDisegnaRussa({ larg: 1, righe: y, strisce: [] }, o, L) });
    for (var i = 1; i < G.length; i++) {
      var p = G[i - 1], g = G[i], im = "i−1", dove = "Giro " + i + ": x" + sub(im) + " = x<sup>" + p.a + "</sup>, y" + sub(im) + " = " + p.b + ", power" + sub(im) + " = x<sup>" + p.prod + "</sup>";
      if (!g.dispari) {
        S.push({ tit: "Giro " + i + ": y = " + p.b + " è pari, accoppio i fattori", dove: dove + " (caso y pari, nota 1)",
          formula: "x" + sub("i") + "<sup>y" + sub("i") + "</sup> · power" + sub("i") + " = " + c1("(x" + sub(im) + "²)<sup>y" + sub(im) + "/2</sup>") + " · " + c3("power" + sub(im)),
          testo: "y è pari: divido i fattori in due metà uguali, ognuna di y/2 = " + p.b / 2 + " righe.",
          disegno: vfDisegnaRussa({ larg: p.a, righe: p.b, strisce: p.strisce }, con({ taglio: true }), L) });
        S.push({ tit: "Giro " + i + ": ogni coppia diventa un quadrato", dove: dove + " (caso y pari, note 3 e 2)",
          formula: "= " + c1("x" + sub(im) + "<sup>y" + sub(im) + "</sup>") + " · " + c3("power" + sub(im)) + " = x<sup>y</sup> ✓ (HI)",
          testo: "Ogni riga blu si unisce alla riga viola accanto: due fattori x" + sub(im) + " fanno x" + sub(im) + "² = x" + sub("i") + " (riga 6), una riga lunga il doppio. I fattori diventano la metà, y" + sub("i") + " = " + g.b + " (riga 5), ma le x sono le stesse: (x²)<sup>y/2</sup> = x<sup>y</sup>. power non cambia. Per l'ipotesi induttiva il totale è x<sup>y</sup>.",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: g.strisce }, con({ affianca: p.a }), L) });
      } else {
        S.push({ tit: "Giro " + i + ": y = " + p.b + " è dispari, metto da parte un fattore", dove: dove + " (caso y dispari, nota 1)",
          formula: "x" + sub("i") + "<sup>y" + sub("i") + "</sup> · power" + sub("i") + " = (x" + sub(im) + "²)<sup>(y" + sub(im) + "−1)/2</sup> · " + c3("power" + sub(im)) + " · " + c2("x" + sub(im)),
          testo: "y è dispari: prima stacco un fattore x" + sub(im) + " (la riga arancione, " + p.a + (p.a === 1 ? " x" : " x") + ") e lo metto in power: è la riga 4, power ← power · x. Restano y − 1 = " + (p.b - 1) + " fattori: un numero pari.",
          disegno: vfDisegnaRussa({ larg: p.a, righe: p.b, strisce: p.strisce }, con({ rigaVia: true, nuovaStriscia: p.a }), L) });
        S.push({ tit: "Giro " + i + ": gli altri si accoppiano", dove: dove + " (caso y dispari, nota 3)",
          formula: "= " + c1("x" + sub(im) + "<sup>y" + sub(im) + "−1</sup>") + " · " + c2("x" + sub(im)) + " · " + c3("power" + sub(im)),
          testo: (p.b - 1 > 0 ? "Gli " + (p.b - 1) + " fattori rimasti si accoppiano come nel caso pari: " + g.b + (g.b === 1 ? " fattore" : " fattori") + " x" + sub("i") + " = x" + sub(im) + "². " : "Non resta nessun fattore blu: y" + sub("i") + " = 0. ") +
            "Le x blu sono y − 1: quelle di prima meno il fattore messo da parte.",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: p.strisce }, con({ affianca: g.b ? p.a : 0, nuovaStriscia: p.a }), L) });
        S.push({ tit: "Giro " + i + ": il totale non cambia", dove: dove + " (caso y dispari, note 4 e 2)",
          formula: "= " + c1("x" + sub(im) + "<sup>y" + sub(im) + "</sup>") + " · " + c3("power" + sub(im)) + " = x<sup>y</sup> ✓ (HI)",
          testo: "x<sup>y−1</sup> · x = x<sup>y</sup>: il fattore arancione restituisce proprio la x tolta. Le x in tutto sono ancora y. Ora power = x<sup>" + g.prod + "</sup>.",
          disegno: vfDisegnaRussa({ larg: g.a, righe: g.b, strisce: p.strisce }, con({ affianca: g.b ? p.a : 0, nuovaStriscia: p.a }), L) });
      }
    }
    var f = G[G.length - 1];
    S.push({ tit: "Uscita: y = 0", dove: "Uscita, dopo " + (G.length - 1) + " giri",
      formula: "x" + sub("i") + "<sup>0</sup> · " + c3("power" + sub("i")) + " = x<sup>y</sup>, quindi power" + sub("i") + " = x<sup>y</sup> ✓",
      testo: "Non restano fattori blu: tutte le x sono in power. Gli esponenti delle righe verdi sono " + f.strisce.join(" + ") + " = " + f.prod + " = y: power = x<sup>" + f.prod + "</sup>.",
      disegno: vfDisegnaRussa({ larg: f.a, righe: 0, strisce: f.strisce }, o, L) });
    return S;
  }
};

// ---- potenza ricorsiva: perché è corretta, e quanto costa
function vfFattori(y, gruppi, o) {
  o = o || {};
  var q = 26, x0 = 20, W = Math.max(300, x0 * 2 + y * q + 10), y0 = 40, H = 110, D = new Disegno(W, H, "i " + y + " fattori x di x alla " + y);
  for (var j = 0; j < y; j++) {
    var col = "box";
    gruppi.forEach(function (g) { if (j >= g[0] && j < g[1]) col = g[2]; });
    D.rett(x0 + j * q, y0, q - 3, q - 3, col, { rx: 4 });
    D.testo(x0 + j * q + (q - 3) / 2, y0 + q / 2 + 2, "x", { size: 13, col: col === "box" ? "muted" : "testo" });
  }
  (o.graffe || []).forEach(function (g) { D.graffa(x0 + g[0] * q, x0 + g[1] * q - 3, g[3] ? y0 - 8 : y0 + q + 2, g[2], { sopra: g[3] }); });
  return D.svg(1.25);
}
VF.potenza = {
  titolo: "Perché potenza(x, y) dà x<sup>y</sup>, con i fattori",
  parametri: [{ id: "y", nome: "y", valori: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], val: 7 }],
  legenda: "x<sup>y</sup> è x moltiplicato y volte: un quadretto per ogni fattore x.",
  passi: function (P) {
    var y = P.y, h = Math.floor(y / 2), pari = y % 2 === 0, S = [];
    S.push({ tit: "Cosa deve uscire", dove: "Tesi, con y = " + y,
      formula: "potenza(x, y) = " + c6("x<sup>y</sup>"),
      testo: "x<sup>" + y + "</sup> è il prodotto di " + y + " fattori x. Vediamo come la funzione li mette insieme.",
      disegno: vfFattori(y, [], { graffe: [[0, y, "y = " + y + " fattori"]] }) });
    S.push({ tit: "La chiamata ricorsiva fa metà del lavoro", dove: "Riga 3 dell'algoritmo (nota 1)",
      formula: "power = potenza(x, ⌊y/2⌋) = " + c1("x<sup>⌊y/2⌋</sup>"),
      testo: "La riga 3 chiama potenza(x, ⌊y/2⌋) = potenza(x, " + h + "). " + (h ? "⌊y/2⌋ = " + h + " è minore di y, quindi per l'ipotesi induttiva (induzione completa) quella chiamata restituisce davvero x<sup>" + h + "</sup>: i primi " + h + " fattori, in blu." : "⌊1/2⌋ = 0: la chiamata è il caso base e restituisce 1, cioè nessun fattore."),
      disegno: vfFattori(y, [[0, h, "blu"]], { graffe: h ? [[0, h, "⌊y/2⌋ = " + h]] : [] }) });
    S.push({ tit: "Il quadrato raddoppia i fattori", dove: "Riga 4 dell'algoritmo (nota 2)",
      formula: "power = (" + c1("x<sup>⌊y/2⌋</sup>") + ")² = " + c1("x<sup>⌊y/2⌋</sup>") + " · " + c4("x<sup>⌊y/2⌋</sup>") + " = x<sup>2⌊y/2⌋</sup>",
      testo: "La riga 4 fa power · power: due volte lo stesso gruppo di " + h + " fattori, il blu e il viola. In tutto 2⌊y/2⌋ = " + 2 * h + " fattori.",
      disegno: vfFattori(y, [[0, h, "blu"], [h, 2 * h, "viola"]], { graffe: [[0, 2 * h, "2⌊y/2⌋ = " + 2 * h]] }) });
    if (pari) S.push({ tit: "y pari: sono tutti", dove: "y pari (nota 3)",
      formula: "power = x<sup>2⌊y/2⌋</sup> = " + c6("x<sup>y</sup>") + " ✓",
      testo: "y = " + y + " è pari: 2⌊y/2⌋ = y. I due gruppi coprono tutti i fattori, e la riga 7 restituisce x<sup>y</sup>.",
      disegno: vfFattori(y, [[0, h, "blu"], [h, 2 * h, "viola"]], { graffe: [[0, y, "y = " + y + " fattori ✓"]] }) });
    else S.push({ tit: "y dispari: ne manca uno", dove: "y dispari (nota 3), riga 6",
      formula: "power = x<sup>2⌊y/2⌋</sup> = x<sup>y−1</sup>,  power · " + c2("x") + " = x<sup>y−1</sup> · x = " + c6("x<sup>y</sup>") + " ✓",
      testo: "y = " + y + " è dispari: 2⌊y/2⌋ = y − 1 = " + (y - 1) + ". Manca un fattore, quello arancione: lo aggiunge la riga 6, power ← power · x. Poi la riga 7 restituisce x<sup>y</sup>.",
      disegno: vfFattori(y, [[0, h, "blu"], [h, 2 * h, "viola"], [2 * h, y, "arancio"]], { graffe: [[0, y, "y = " + y + " fattori ✓"]] }) });
    return S;
  }
};
VF.potenzacosto = {
  titolo: "Quanto costa la potenza ricorsiva, chiamata per chiamata",
  parametri: [{ id: "k", nome: "y", valori: [1, 2, 3, 4, 5], etichetta: function (k) { return Math.pow(2, k); }, val: 3 }],
  legenda: "Ogni riga è una chiamata: la barra è lunga y. In arancione quello che costa la chiamata senza la ricorsiva (al più 6), in grigio le chiamate non ancora srotolate.",
  passi: function (P) {
    var k = P.k, y = Math.pow(2, k), u = Math.max(7, Math.floor(200 / y)), x0 = 104, dy = 30, righe = k + 2, W = x0 + y * u + 120, H = 22 + righe * dy + 10, S = [];
    function disegno(fatte, base) {
      var D = new Disegno(W, H, "chiamate della potenza ricorsiva con y = " + y), tot = 0;
      for (var j = 0; j < righe; j++) {
        var yy = Math.floor(y / Math.pow(2, j)), top = 18 + j * dy;
        D.testo(x0 - 8, top + 13, "potenza(x, " + yy + ")", { anc: "end", size: 11.5, col: j <= fatte ? "testo" : "muted" });
        if (yy) D.rett(x0, top + 2, yy * u, 14, j < fatte ? "arancio" : (j === fatte ? "blu" : "box"), { rx: 3 });
        else D.rett(x0, top + 2, 6, 14, base ? "verde" : (j === fatte ? "blu" : "box"), { rx: 3 });
        var costo = yy ? 6 : 2;
        if (j < fatte || (yy === 0 && base)) { tot += costo; D.testo(x0 + Math.max(yy * u, 6) + 8, top + 14, (yy ? "6" : "2 (caso base)") + "   totale " + tot, { anc: "start", size: 11.5, col: yy ? "arancio" : "verde" }); }
        else if (j === fatte) D.testo(x0 + Math.max(yy * u, 6) + 8, top + 14, "T(x, " + yy + ")", { anc: "start", size: 11.5, col: "blu", peso: 600 });
      }
      return D.svg(1.2);
    }
    var sei = "";
    for (var j = 1; j <= k; j++) {
      sei = j === 1 ? c2("6") : sei + " + " + c2("6");
      var resto = y / Math.pow(2, j);
      S.push({ tit: j === 1 ? "La prima chiamata" : "Srotolo ancora", dove: "Riga " + Math.min(j, 3) + " dello srotolamento" + (j === 1 ? " (nota 1)" : j === k ? " (nota 2)" : ""),
        formula: "T(x, " + y + ") ≤ " + sei + " + " + c1("T(x, " + resto + ")"),
        testo: j === 1 ? "La chiamata con y = " + y + " costa al più 6, più la chiamata ricorsiva con y/2 = " + resto + ", che non sappiamo ancora quanto costa (in blu)."
          : "Applico di nuovo l'equazione alla chiamata blu: costa al più 6, più una chiamata con la metà. Dopo " + j + " passi ho sommato " + j + " volte 6, e y è stato diviso " + j + " volte per 2.",
        disegno: disegno(j, false) });
    }
    S.push({ tit: "Arrivo a y = 1", dove: "Righe 4 e 5 dello srotolamento (nota 3)",
      formula: "= " + c2("6k") + " + " + c1("T(x, 1)") + " = " + c2("6k") + " + " + c2("6") + " + " + c1("T(x, 0)"),
      testo: "Mi fermo quando y/2<sup>k</sup> = 1, cioè dopo k = log<sub>2</sub> y = " + k + " passi. Anche potenza(x, 1) costa al più 6, e chiama potenza(x, 0).",
      disegno: disegno(k + 1, false) });
    S.push({ tit: "Il caso base", dove: "Ultima riga",
      formula: "= " + c2("6k + 6") + " + " + c3("2") + " = 6k + 8",
      testo: "potenza(x, 0) è il caso base: righe 1 e 2, tempo 2. In tutto 6k + 8 = " + (6 * k + 8) + ", con k = log<sub>2</sub> y: una riga in più ogni volta che y raddoppia.",
      disegno: disegno(k + 2, true) });
    return S;
  }
};

// ---- quante cifre ha n in binario
VF.cifre = {
  titolo: "Quante cifre: n tra due potenze di 2",
  parametri: [{ id: "n", nome: "n", valori: [1, 5, 8, 13, 21, 31, 32, 100], val: 21 }],
  legenda: "Sopra le cifre binarie, sotto il righello delle potenze di 2: ogni tacca è il doppio della precedente, e sotto c'è il suo logaritmo in base 2.",
  passi: function (P) {
    var n = P.n, b = n.toString(2), k = b.length, L = vfLog2(n), S = [];
    var x0 = 30, passo = 44, W = x0 * 2 + 8 * passo, H = 196;
    function disegno(fase) {
      var D = new Disegno(W, H, "le cifre binarie di " + n + " e il righello delle potenze di 2"), q = 22, j;
      var righe = [[Math.pow(2, k - 1), "blu", "2" + ap(k - 1)], [n, "giallo", "n"], [Math.pow(2, k), "arancio", "2" + ap(k)]];
      righe.forEach(function (r, i) {
        var s = r[0].toString(2), yy = 8 + i * 26;
        if (fase === 0 && i !== 1) return;
        D.testo(x0 + 36, yy + 15, r[2] + " = " + r[0], { anc: "end", size: 12, peso: i === 1 ? 700 : 400 });
        for (j = 0; j < s.length; j++) {
          D.rett(x0 + 46 + j * q, yy, q - 3, q - 3, j < k ? r[1] : "rosso", { rx: 3 });
          D.testo(x0 + 46 + j * q + (q - 3) / 2, yy + 15, s[j], { size: 12 });
        }
        D.testo(x0 + 46 + s.length * q + 6, yy + 15, s.length + " cifre", { anc: "start", size: 11, col: "muted" });
      });
      var yr = 120;
      D.linea(x0, yr, x0 + 7.6 * passo, yr, "muted");
      if (fase >= 1) {
        D.rett(x0 + (k - 1) * passo, yr - 9, passo, 18, "arancio", { rx: 2, opacita: 0.7 });
      }
      for (j = 0; j <= 7; j++) {
        var xx = x0 + j * passo;
        D.linea(xx, yr - 6, xx, yr + 6, "muted");
        D.testo(xx, yr - 12, String(Math.pow(2, j)), { size: 11, col: "muted" });
        if (fase >= 2) D.testo(xx, yr + 22, String(j), { size: 11.5, col: j === k - 1 ? "blu" : "muted", peso: j === k - 1 ? 700 : 400 });
      }
      var xn = x0 + L * passo;
      D.grezzo('<path d="M' + r1(xn) + ' ' + (yr + 2) + 'l-6 -12h12z" class="t-blu" fill="#2f52c4"/>');
      D.testo(xn, yr + (fase >= 2 ? 40 : 24), fase >= 2 ? "log" + pd(2) + " n ≈ " + vfNum(Math.round(L * 100) / 100) : "n = " + n, { size: 11.5, col: "blu", peso: 600 });
      if (fase >= 2) D.testo(x0, yr + 62, "sotto le tacche: il logaritmo in base 2 (2" + ap("j") + " → j)", { anc: "start", size: 11, col: "muted" });
      return D.svg(1.25);
    }
    S.push({ tit: "n in binario", dove: "n = " + n + " = " + b + " in base 2",
      formula: "n ha " + c2("k = " + k) + " cifre in base 2",
      testo: n + " in binario è " + b + ": ha k = " + k + " cifre, e la prima è sempre 1.",
      disegno: disegno(0) });
    S.push({ tit: "Tra due potenze di 2", dove: "Prima riga del conto",
      formula: c1("2<sup>k−1</sup>") + " ≤ n < " + c2("2<sup>k</sup>"),
      testo: "Il numero più piccolo con k cifre è 1 seguito da k − 1 zeri: 2<sup>k−1</sup> = " + Math.pow(2, k - 1) + " (blu). Il primo che di cifre ne ha k + 1 è 1 seguito da k zeri: 2<sup>k</sup> = " + Math.pow(2, k) + " (arancione, la cifra rossa è quella in più). n sta in mezzo: sul righello cade nel tratto arancione, tra la tacca 2<sup>k−1</sup> (compresa) e la tacca 2<sup>k</sup> (esclusa).",
      disegno: disegno(1) });
    S.push({ tit: "Prendo il logaritmo", dove: "Seconda riga (nota 1)",
      formula: c1("k − 1") + " ≤ log<sub>2</sub> n < " + c2("k"),
      testo: "Sotto ogni tacca 2<sup>j</sup> c'è il suo logaritmo, j. log<sub>2</sub> è crescente, quindi l'ordine non cambia: log<sub>2</sub> n sta tra k − 1 = " + (k - 1) + " e k = " + k + ".",
      disegno: disegno(2) });
    S.push({ tit: "La parte intera", dove: "Righe 3 e 4 (nota 2)",
      formula: c1("k − 1") + " = ⌊log<sub>2</sub> n⌋,  quindi  " + c2("k") + " = ⌊log<sub>2</sub> n⌋ + 1",
      testo: "log<sub>2</sub> n ≈ " + vfNum(L) + " sta tra due interi consecutivi, " + (k - 1) + " compreso e " + k + " escluso: la sua parte intera è " + (k - 1) + " = k − 1. Quindi le cifre sono k = ⌊log<sub>2</sub> n⌋ + 1 = " + k + ".",
      disegno: disegno(2) });
    return S;
  }
};

// ---- 1 + 2 + … + 2^(n−1) = 2^n − 1
VF.potenze2 = {
  titolo: "1 + 2 + 4 + … : manca sempre 1 per arrivare alla potenza dopo",
  parametri: [{ id: "n", nome: "n", valori: [2, 3, 4, 5, 6], val: 4 }],
  legenda: "Ogni barra è lunga quanto il suo addendo; il quadretto tratteggiato è l'1 che manca.",
  passi: function (P) {
    var n = P.n, tot = Math.pow(2, n), u = Math.min(20, Math.floor(300 / tot * 2) / 2), x0 = 20, W = x0 * 2 + tot * u + 80, H = 96, S = [];
    function barre(D, y, fino, colUlt, tutto) {
      var x = x0;
      for (var i = 0; i < fino; i++) {
        var w = Math.pow(2, i) * u, col = i === fino - 1 && colUlt ? colUlt : "blu";
        D.rett(x, y, w - 2, 20, col, { rx: 3 });
        if (w >= 14) D.testo(x + w / 2 - 1, y + 14, String(Math.pow(2, i)), { size: 11 });
        x += w;
      }
      return x;
    }
    var D, xe;
    D = new Disegno(W, H, "le potenze di 2 una dopo l'altra");
    xe = barre(D, 30, n, "arancio");
    D.graffa(x0, x0 + (Math.pow(2, n - 1) - 1) * u - 2, 56, n > 1 ? "1 + … + 2" + ap(n - 2) : "", { tcol: "blu" });
    D.graffa(x0 + (Math.pow(2, n - 1) - 1) * u, xe - 2, 56, "2" + ap(n - 1) + " = " + Math.pow(2, n - 1), { tcol: "arancio" });
    S.push({ tit: "Separo l'ultimo addendo", dove: "Riga 1 (nota 1), con n = " + n,
      formula: "1 + 2 + … + 2<sup>n−1</sup> = " + c1("[1 + 2 + … + 2<sup>n−2</sup>]") + " + " + c2("2<sup>n−1</sup>"),
      testo: "Le barre sono gli addendi 1, 2, 4, …, ognuna lunga il doppio della precedente. Tengo da parte l'ultima, 2<sup>n−1</sup> (arancione); le altre, in blu, sono la somma tra parentesi quadre.",
      disegno: D.svg() });
    D = new Disegno(W, H, "le barre blu sotto la barra arancione");
    var half = Math.pow(2, n - 1);
    barre(D, 20, n - 1, null);
    D.rett(x0 + (half - 1) * u, 20, u - 2, 20, "vuoto");
    D.testo(x0 + half * u + 6, 34, "manca 1", { anc: "start", size: 11, col: "muted" });
    D.rett(x0, 50, half * u - 2, 20, "arancio", { rx: 3 });
    D.testo(x0 + half * u / 2, 64, "2" + ap(n - 1), { size: 11 });
    S.push({ tit: "Ipotesi induttiva: alle blu manca 1", dove: "Riga 2 (HI)",
      formula: "= " + c1("2<sup>n−1</sup> − 1") + " + " + c2("2<sup>n−1</sup>"),
      testo: "Metto le barre blu sopra quella arancione: sono lunghe 2<sup>n−1</sup> − 1 = " + (half - 1) + ", cioè manca un quadretto per arrivare a 2<sup>n−1</sup>. È l'ipotesi induttiva, la formula per n − 1.",
      disegno: D.svg() });
    D = new Disegno(W, H, "due barre lunghe 2 alla n meno 1, meno un quadretto");
    D.rett(x0, 30, half * u - 2, 20, "arancio", { rx: 3, tratteggio: false });
    D.rett(x0 + (half - 1) * u, 30, u - 2, 20, "vuoto");
    D.rett(x0 + half * u, 30, half * u - 2, 20, "arancio", { rx: 3 });
    D.graffa(x0, x0 + tot * u - 2, 56, "2 · 2" + ap(n - 1) + " − 1");
    S.push({ tit: "Due volte 2ⁿ⁻¹, meno 1", dove: "Riga 3",
      formula: "= " + c2("2 · 2<sup>n−1</sup>") + " − 1",
      testo: "Le blu valgono una barra arancione meno un quadretto: in tutto due barre arancioni meno 1.",
      disegno: D.svg() });
    D = new Disegno(W, H, "la somma è 2 alla n meno 1");
    barre(D, 30, n, null);
    D.rett(x0 + (tot - 1) * u, 30, u - 2, 20, "vuoto");
    D.graffa(x0, x0 + tot * u - 2, 56, "2" + ap(n) + " = " + tot);
    S.push({ tit: "Il risultato", dove: "Riga 4",
      formula: "= " + c4("2<sup>n</sup>") + " − 1 ✓",
      testo: "Due volte 2<sup>n−1</sup> è 2<sup>n</sup>. Quindi 1 + 2 + … + 2<sup>n−1</sup> = " + (tot - 1) + " = 2<sup>" + n + "</sup> − 1: aggiungendo il quadretto tratteggiato si arriva esattamente alla potenza dopo. In binario: " + n + " cifre 1 più 1 fa 1 seguito da " + n + " zeri.",
      disegno: D.svg() });
    return S;
  }
};

// ================================================================ pacchi 1, 3, 4, 7, 8
// Copia capovolta di una scala: le colonne alte h_j, completate fino ad altezza H.
function vfScalaCopia(D, x0, fondo, alt, H, q, colori) {
  alt.forEach(function (h, j) {
    for (var r = 0; r < H; r++) {
      if (r < h) D.rett(x0 + j * q, fondo - (r + 1) * q, q - 2, q - 2, colori ? colori(j, r) : "blu", { rx: 3 });
      else D.rett(x0 + j * q, fondo - (r + 1) * q, q - 2, q - 2, "viola", { rx: 3, tratteggio: true, opacita: 0.85 });
    }
  });
}

// ---- pacco 1: Σ Θ(i log x) = Θ(x² log x)
VF.sommalog = {
  titolo: "La somma dei giri, con i quadretti",
  parametri: [{ id: "x", nome: "x", valori: [2, 3, 4, 5, 6, 7, 8], val: 5 }],
  legenda: "Ogni quadretto vale log x (il costo di un pezzo lungo log x bit). La colonna i è il giro i: i quadretti.",
  passi: function (P) {
    var x = P.x, q = 24, x0 = 30, fondo = 14 + (x + 1) * q, W = x0 + (x + 1) * q + 110, H = fondo + 46, S = [];
    function nuovo() { return new Disegno(W, H, "i giri come colonne di quadretti, x = " + x); }
    function sotto(D) { for (var j = 0; j < x; j++) D.testo(x0 + j * q + (q - 2) / 2, fondo + 14, j + 1, { size: 11, col: "muted" }); D.testo(x0 - 6, fondo + 14, "giro", { size: 10.5, col: "muted", anc: "end" }); }
    var alt = []; for (var i = 1; i <= x; i++) alt.push(i);
    var D = nuovo();
    alt.forEach(function (h, j) { for (var r = 0; r < h; r++) D.rett(x0 + j * q, fondo - (r + 1) * q, q - 2, q - 2, "blu", { rx: 3 }); });
    sotto(D); D.graffaV(x0 + x * q + 2, fondo - x * q, fondo - 2, "giro x: x · log x");
    S.push({ tit: "Ogni giro è una colonna", dove: "Riga 1: il giro i costa Θ(i log x)",
      formula: "T(x) = " + c1("Σ<sub>i=1..x</sub> Θ(i log x)"),
      testo: "Il giro i costa circa i volte log x: una colonna di i quadretti, ognuno da log x. Il primo giro è una colonna bassa, l'ultimo è alta x. T(x) è il totale dei quadretti, ognuno contato log x.",
      disegno: D.svg() });
    D = nuovo();
    alt.forEach(function (h, j) { for (var r = 0; r < h; r++) { D.rett(x0 + j * q, fondo - (r + 1) * q, q - 2, q - 2, "arancio", { rx: 3 }); } });
    sotto(D);
    D.testo(x0 + x * q + 10, fondo - x * q / 2, "ogni quadretto", { anc: "start", size: 11.5, col: "arancio" });
    D.testo(x0 + x * q + 10, fondo - x * q / 2 + 15, "= log x", { anc: "start", size: 11.5, col: "arancio", peso: 700 });
    S.push({ tit: "log x esce dalla somma", dove: "Riga 2 (log x non dipende da i)",
      formula: "= Θ(" + c2("log x") + " · " + c1("Σ<sub>i=1..x</sub> i") + ")",
      testo: "Tutti i quadretti valgono lo stesso, log x: non dipende dal giro. Quindi basta contare i quadretti, Σ i = 1 + 2 + … + x, e moltiplicare per log x.",
      disegno: D.svg() });
    D = nuovo();
    vfScalaCopia(D, x0, fondo, alt, x + 1, q);
    sotto(D);
    D.graffaV(x0 + x * q + 2, fondo - (x + 1) * q, fondo - 2, "x + 1 = " + (x + 1) + " righe");
    D.graffa(x0, x0 + x * q - 2, fondo + 22, "x = " + x + " colonne");
    S.push({ tit: "Gauss", dove: "Riga 3 (Gauss)",
      formula: "= Θ(log x · " + c1("x(x + 1)/2") + ")",
      testo: "La scala blu con la sua copia capovolta (viola) fa un rettangolo di x colonne e x + 1 righe. La scala è la metà: x(x + 1)/2 = " + x * (x + 1) / 2 + " quadretti.",
      disegno: D.svg() });
    D = nuovo();
    vfScalaCopia(D, x0, fondo, alt, x + 1, q);
    for (var j = 0; j < x; j++) D.rett(x0 + j * q - 1, fondo - (x + 1) * q - 1, q, q, "vuoto");
    sotto(D);
    D.graffaV(x0 + x * q + 2, fondo - x * q, fondo - 2, "quasi un quadrato x × x");
    S.push({ tit: "L'ordine di grandezza", dove: "Il risultato",
      formula: "T(x) = Θ(" + c1("x²") + " log x)",
      testo: "x(x + 1)/2 = (x² + x)/2: il termine che conta è x², diviso 2, e le costanti in Θ non contano. Il rettangolo è quasi un quadrato x × x: la scala ne è circa metà. Quindi T(x) = Θ(x² log x).",
      disegno: D.svg() });
    return S;
  }
};

// ---- pacco 3: quante chiamate fa la ricerca binaria
VF.dimezza = {
  titolo: "Chiamata dopo chiamata, la porzione si dimezza",
  parametri: [{ id: "n", nome: "n", valori: [2, 4, 8, 16, 32, 64], val: 16 }],
  legenda: "Ogni riga è una chiamata: la barra sono gli elementi della sua porzione, nel caso peggiore.",
  passi: function (P) {
    var n = P.n, k = Math.round(vfLog2(n)), u = Math.max(4, Math.floor(256 / n)), x0 = 92, dy = 26, W = x0 + n * u + 250, H = 16 + (k + 2) * dy + 8, S = [];
    function disegno(fase) {
      var D = new Disegno(W, H, "le porzioni della ricerca binaria, n = " + n);
      for (var i = 1; i <= k + 2; i++) {
        var m = i <= k + 1 ? n / Math.pow(2, i - 1) : 0, y = 12 + (i - 1) * dy;
        if (i === k + 2 && fase < 4) break;
        D.testo(x0 - 8, y + 13, "chiamata " + i, { anc: "end", size: 11.5, col: i === k + 1 && fase >= 1 ? "testo" : "muted", peso: i === k + 1 && fase >= 1 ? 700 : 400 });
        if (m) {
          for (var c = 0; c < m; c++) D.rett(x0 + c * u, y + 2, u - (u > 5 ? 1.5 : 0.6), 16, i === k + 1 && fase >= 1 ? "arancio" : "blu", { rx: u > 5 ? 2 : 0, spessore: u > 5 ? 1.2 : 0.6 });
          var lab = i === 1 ? "n = " + n : "n/2" + ap(i - 1) + " = " + m;
          if (fase >= 2 && i <= k + 1) lab = m + " = 2" + ap(k + 1 - i);
          D.testo(x0 + m * u + 8, y + 14, i === 1 && fase < 2 ? lab : lab, { anc: "start", size: 11.5, col: i === k + 1 && fase >= 1 ? "arancio" : "testo" });
        } else { D.rett(x0, y + 2, 6, 16, "vuoto"); D.testo(x0 + 14, y + 14, "0 elementi: caso base", { anc: "start", size: 11.5, col: "verde" }); }
      }
      if (fase === 2 || fase === 3) {
        D.graffaV(x0 + n * u + 76, 12 + 2, 12 + k * dy + 18, fase === 2 ? "i − 1 = " + k + " dimezzamenti" : "i − 1 = log" + pd(2) + " n = " + k, {});
      }
      return D.svg(1.2);
    }
    S.push({ tit: "Quando resta un solo elemento?", dove: "Prima riga del conto, n = " + n,
      formula: c1("n / 2<sup>i−1</sup>") + " = " + c2("1"),
      testo: "La chiamata 1 ha n elementi, ogni chiamata dopo ne ha la metà: la chiamata i ne ha n/2<sup>i−1</sup>. Cerco la chiamata con un solo elemento (arancione).",
      disegno: disegno(1) });
    S.push({ tit: "Letto al contrario: raddoppiare", dove: "Seconda riga (moltiplico per 2ⁱ⁻¹)",
      formula: "⟺ " + c1("n") + " = " + c2("2<sup>i−1</sup>"),
      testo: "Risalendo dall'ultima riga ogni barra è il doppio di quella sotto: 1, 2, 4, …, fino a n. Partendo da 1 e raddoppiando i − 1 volte si arriva a n: n = 2<sup>i−1</sup>. Accanto alle barre ora c'è la potenza di 2.",
      disegno: disegno(2) });
    S.push({ tit: "Quanti raddoppi?", dove: "Terza riga (applico log₂)",
      formula: "⟺ " + c2("i − 1") + " = log<sub>2</sub> n",
      testo: "Il numero di raddoppi che porta da 1 a n è proprio il logaritmo in base 2 di n: log<sub>2</sub> " + n + " = " + k + ". Sono i − 1, cioè il numero di righe sopra quella arancione.",
      disegno: disegno(3) });
    S.push({ tit: "Contando anche la prima", dove: "Quarta riga, poi il caso base",
      formula: "⟺ " + c2("i") + " = 1 + log<sub>2</sub> n,   e in tutto 2 + log<sub>2</sub> n chiamate",
      testo: "La chiamata con un elemento è la numero 1 + log<sub>2</sub> n = " + (k + 1) + ". Dopo c'è ancora una chiamata con la porzione vuota, il caso base (in verde): in tutto 2 + log<sub>2</sub> n = " + (k + 2) + " chiamate.",
      disegno: disegno(4) });
    return S;
  }
};

// ---- pacco 4: i confronti di selectionSort
VF.selection = {
  titolo: "I confronti di selectionSort, giro per giro",
  parametri: [{ id: "n", nome: "n", valori: [3, 4, 5, 6, 7, 8, 9], val: 6 }],
  legenda: "Ogni riga è un giro del ciclo esterno; ogni quadretto è un confronto A[j] < A[m].",
  passi: function (P) {
    var n = P.n, q = 24, x0 = 64, y0 = 14, W = x0 + n * q + 120, H = y0 + n * q + 34, S = [], k;
    function nuovo() { return new Disegno(W, H, "i confronti di selectionSort per n = " + n); }
    function righe(D, o) {
      for (k = 0; k <= n - 2; k++) {
        var c = n - k - 1, y = y0 + k * q;
        D.testo(x0 - 8, y + q / 2 + 3, "giro k = " + k, { anc: "end", size: 11, col: "muted" });
        for (var j = 0; j < (o.pieno ? n : c); j++) D.rett(x0 + j * q, y, q - 2, q - 2, j < c ? (o.col ? o.col(k) : "blu") : "viola", { rx: 3, tratteggio: j >= c });
        if (o.lab) D.testo(x0 + (o.pieno ? n : c) * q + 6, y + q / 2 + 3, o.lab(k, c), { anc: "start", size: 11.5, col: o.labCol || "testo" });
      }
    }
    var D = nuovo();
    righe(D, { lab: function (k, c) { return "n − " + k + " − 1 = " + c; } });
    S.push({ tit: "Un giro, una riga", dove: "Riga 1 (nota 1)",
      formula: "C(n) = " + c1("Σ<sub>k=0</sub><sup>n−2</sup> (n − k − 1)"),
      testo: "Al giro k il ciclo interno fa scorrere j da k + 1 a n − 1: sono n − k − 1 confronti, una riga di quadretti. Il primo giro (k = 0) ne fa n − 1, ogni giro dopo uno in meno, l'ultimo (k = n − 2) uno solo.",
      disegno: D.svg() });
    D = nuovo();
    righe(D, { lab: function (k, c) { return String(c); } });
    S.push({ tit: "Le righe scritte una per una", dove: "Riga 2 (nota 2)",
      formula: "= " + c1("(n−1) + (n−2) + … + 2 + 1"),
      testo: "Leggendo le righe dall'alto: n − 1 = " + (n - 1) + ", poi " + (n - 2) + ", …, fino a 1. È una scala che scende.",
      disegno: D.svg() });
    D = nuovo();
    righe(D, { lab: function (k, c) { return "i = " + c; }, labCol: "arancio" });
    S.push({ tit: "Letta dal basso", dove: "Riga 3",
      formula: "= " + c2("Σ<sub>i=1</sub><sup>n−1</sup> i"),
      testo: "Gli stessi numeri letti dal basso sono 1, 2, …, n − 1: la somma non cambia cambiando l'ordine. È la somma dei primi n − 1 numeri.",
      disegno: D.svg() });
    D = nuovo();
    righe(D, { pieno: true, lab: function () { return ""; } });
    D.graffa(x0, x0 + n * q - 2, y0 + (n - 1) * q + 2, "n = " + n + " colonne");
    D.graffaV(x0 + n * q + 2, y0, y0 + (n - 1) * q - 2, "n − 1 = " + (n - 1) + " righe");
    S.push({ tit: "Il trucco di Gauss", dove: "Riga 4 (nota 3)",
      formula: "= " + c1("n(n−1)/2"),
      testo: "La scala blu con la sua copia capovolta (viola) riempie un rettangolo di n − 1 righe e n colonne: (n − 1)n quadretti. La scala è la metà: n(n − 1)/2 = " + n * (n - 1) / 2 + " confronti.",
      disegno: D.svg() });
    D = nuovo();
    righe(D, { pieno: true, lab: function () { return ""; } });
    for (var j = 0; j < n; j++) D.rett(x0 + j * q, y0 + (n - 1) * q, q - 2, q - 2, "vuoto");
    D.graffaV(x0 + n * q + 2, y0, y0 + n * q - 2, "quadrato n × n");
    S.push({ tit: "L'ordine di grandezza", dove: "Riga 5",
      formula: "= Θ(" + c1("n²") + ")",
      testo: "Aggiungendo una riga tratteggiata il rettangolo diventa il quadrato n × n: i confronti sono circa la metà di n², cioè n²/2 − n/2. In Θ contano solo n² e non la costante 1/2: Θ(n²).",
      disegno: D.svg() });
    return S;
  }
};

// ---- pacco 7: m^(log_a n) = n^(log_a m), contando le foglie dell'albero delle chiamate
VF.foglie = {
  titolo: "Scambiare base ed esponente, contando le foglie",
  parametri: [{ id: "caso", nome: "caso", valori: ["2,2,8", "4,2,8", "8,2,4", "3,2,4", "3,3,9"], val: "4,2,8",
    etichetta: function (v) { var t = v.split(","); return "m = " + t[0] + ", a = " + t[1] + ", n = " + t[2]; }, ricomincia: true }],
  legenda: "Ogni chiamata su un problema di dimensione s fa m chiamate su problemi di dimensione s/a. Le foglie sono i casi base, di dimensione 1.",
  passi: function (P) {
    var t = P.caso.split(",").map(Number), m = t[0], a = t[1], n = t[2], d = Math.round(Math.log(n) / Math.log(a)), F = Math.pow(m, d);
    var lm = Math.log(m) / Math.log(a), intero = Math.abs(lm - Math.round(lm)) < 1e-9, lmTxt = intero ? String(Math.round(lm)) : vfNum(Math.round(lm * 100) / 100);
    var W = 420, x0 = 86, x1 = W - 16, dy = 56, H = 30 + d * dy + 52, S = [];
    function disegno(evid) {
      var D = new Disegno(W, H, "albero delle chiamate con " + F + " foglie"), pos = [], L, j;
      for (L = 0; L <= d; L++) {
        var c = Math.pow(m, L), w = (x1 - x0) / c, row = [];
        for (j = 0; j < c; j++) row.push(x0 + (j + 0.5) * w);
        pos.push(row);
      }
      for (L = 1; L <= d; L++) pos[L].forEach(function (x, j) { D.linea(pos[L - 1][Math.floor(j / m)], 24 + (L - 1) * dy + 6, x, 24 + L * dy - 6, "muted", { opacita: 0.5, w: 1 }); });
      for (L = 0; L <= d; L++) {
        var y = 24 + L * dy, r = Math.max(2.5, Math.min(10, (x1 - x0) / pos[L].length / 2.6));
        D.testo(6, y + 4, "dim. " + n / Math.pow(a, L) + (L === d ? " (foglie)" : ""), { anc: "start", size: 11, col: "muted" });
        pos[L].forEach(function (x) { D.cerchio(x, y, r, L === d ? (evid === "foglie" ? "arancio" : "verde") : "blu", { spessore: r < 4 ? 0.8 : 1.5 }); });
        if (L > 0 && evid === "livelli") D.testo(W - 4, y - dy / 2 + 4, "× " + m, { anc: "end", size: 11.5, col: "arancio", peso: 700 });
      }
      var yb = 24 + d * dy + 30;
      if (evid === "foglie") D.testo(W / 2, yb, F + " foglie = " + m + ap(d) + " = " + n + ap(lmTxt), { size: 13, peso: 700, col: "arancio" });
      else D.testo(W / 2, yb, "livelli sotto la radice: log" + pd(a) + " " + n + " = " + d, { size: 12, col: "testo" });
      return D.svg(1.2);
    }
    S.push({ tit: "Le foglie sono m^(log_a n)", dove: "Il lato sinistro: m = " + m + ", a = " + a + ", n = " + n,
      formula: c2("m") + "<sup>" + c1("log<sub>a</sub> n") + "</sup>",
      testo: "Scendendo di un livello ogni chiamata ne fa m: le chiamate si moltiplicano per m = " + m + " a ogni livello. E a ogni livello la dimensione si divide per a, quindi da n si arriva a 1 dopo log<sub>a</sub> n = " + d + " livelli. Le foglie sono m moltiplicato per sé stesso log<sub>a</sub> n volte: m<sup>log<sub>a</sub> n</sup> = " + m + "<sup>" + d + "</sup> = " + F + ".",
      disegno: disegno("livelli") });
    S.push({ tit: "Scrivo m come potenza di a", dove: "Riga 1: al posto di m scrivo a^(log_a m)",
      formula: "= (" + c2("a<sup>log<sub>a</sub> m</sup>") + ")<sup>log<sub>a</sub> n</sup>",
      testo: "log<sub>a</sub> m è l'esponente da dare ad a per ottenere m: qui " + a + "<sup>" + lmTxt + "</sup> = " + m + (intero ? "." : " (non è intero, ma va bene lo stesso).") + " Quindi m = a<sup>log<sub>a</sub> m</sup>: è solo un altro modo di scrivere m.",
      disegno: disegno("livelli") });
    S.push({ tit: "Potenza di una potenza", dove: "Riga 2: (x^p)^q = x^(p·q)",
      formula: "= a<sup>" + c2("log<sub>a</sub> m") + " · " + c1("log<sub>a</sub> n") + "</sup>",
      testo: "Elevare a una potenza e poi a un'altra moltiplica gli esponenti: " + a + "<sup>" + lmTxt + " · " + d + "</sup>. In una moltiplicazione l'ordine dei fattori non conta: qui sta tutto il trucco.",
      disegno: disegno("livelli") });
    S.push({ tit: "Raggruppo al contrario", dove: "Riga 3: la stessa regola, con gli esponenti scambiati",
      formula: "= (" + c1("a<sup>log<sub>a</sub> n</sup>") + ")<sup>" + c2("log<sub>a</sub> m") + "</sup>",
      testo: "Rileggo la regola da destra a sinistra, ma raggruppando prima log<sub>a</sub> n: (" + a + "<sup>" + d + "</sup>)<sup>" + lmTxt + "</sup>.",
      disegno: disegno("livelli") });
    S.push({ tit: "a^(log_a n) è n", dove: "Riga 4: a^(log_a n) = n",
      formula: "= " + c1("n") + "<sup>" + c2("log<sub>a</sub> m") + "</sup>",
      testo: "a<sup>log<sub>a</sub> n</sup> = n per definizione di logaritmo: " + a + "<sup>" + d + "</sup> = " + n + ". Quindi le stesse " + F + " foglie si scrivono anche " + n + "<sup>" + lmTxt + "</sup>: una potenza di n, che è la forma che serve nel teorema principale.",
      disegno: disegno("foglie") });
    return S;
  }
};

// ---- pacco 8: caso peggiore, caso migliore, caso medio
VF.peggiore = {
  titolo: "Il caso peggiore di quickSort, colonna per colonna",
  parametri: [{ id: "n", nome: "n", valori: [2, 3, 4, 5, 6, 7, 8, 9], val: 5 }],
  legenda: "Ogni colonna è una chiamata di partiziona: su m elementi fa m confronti, cioè m quadretti.",
  passi: function (P) {
    var n = P.n, q = 22, x0 = 30, fondo = 18 + (n + 1) * q, W = x0 + (n + 1) * q + 200, H = fondo + 50, S = [];
    function disegno(fino, o) {
      o = o || {};
      var D = new Disegno(W, H, "i confronti del caso peggiore, n = " + n);
      for (var j = 0; j < n - 1; j++) {
        var m = n - j, x = x0 + j * q;
        for (var r = 0; r < m; r++) D.rett(x, fondo - (r + 1) * q, q - 2, q - 2, j < fino ? (j === 0 && o.prima ? "arancio" : "arancio") : "box", { rx: 3, opacita: j < fino ? 1 : 0.5 });
        D.testo(x + (q - 2) / 2, fondo + 14, m, { size: 11, col: j < fino ? "arancio" : "muted" });
      }
      var xr = x0 + (n - 1) * q;
      if (fino <= n - 2) {
        D.rett(xr + 4, fondo - 2 * q, q * 2.4, 2 * q - 2, "blu", { rx: 4 });
        D.testo(xr + 4 + q * 1.2, fondo - q + 4, "C" + pd("w") + "(" + (n - fino) + ")", { size: 11.5, col: "blu", peso: 600 });
      } else {
        D.testo(xr + (q - 2) / 2, fondo + 14, "1", { size: 11, col: "muted" });
        D.testo(xr + 4, fondo - 6, o.gauss ? "" : "C" + pd("w") + "(1) = 0", { anc: "start", size: 11.5, col: "verde" });
      }
      if (o.gauss) {
        D.rett(xr, fondo - q, q - 2, q - 2, "vuoto");
        D.testo(xr + q + 4, fondo - 6, "← il quadretto che manca (1)", { anc: "start", size: 11, col: "muted" });
        D.graffa(x0, xr + q - 2, fondo + 24, "con il tratteggiato: 1 + 2 + … + n = n(n + 1)/2", { anc: "start" });
      }
      return D.svg(1.2);
    }
    S.push({ tit: "La prima chiamata", dove: "Riga 1 (nota 1), n = " + n,
      formula: "C<sub>w</sub>(n) = " + c2("n") + " + " + c1("C<sub>w</sub>(n − 1)"),
      testo: "Nel caso peggiore il perno finisce in fondo: partiziona fa n confronti (la colonna arancione, alta n) e resta una sola chiamata, su n − 1 elementi (in blu: non sappiamo ancora quanto costa).",
      disegno: disegno(1) });
    S.push({ tit: "Srotolo", dove: "Righe 2 e 3 (nota 2)",
      formula: "= " + c2("n + (n − 1)") + " + " + c1("C<sub>w</sub>(n − 2)") + " = …",
      testo: "La chiamata blu fa lo stesso: n − 1 confronti, poi una chiamata su n − 2. Ogni volta la colonna è alta uno in meno: una scala che scende.",
      disegno: disegno(Math.min(2, n - 1)) });
    S.push({ tit: "Fino a C_w(1)", dove: "Righe 5 e 6 (note 3 e 4)",
      formula: "= " + c2("n + (n − 1) + … + 2") + " + " + c3("C<sub>w</sub>(1)") + " = " + c2("Σ<sub>i=2</sub><sup>n</sup> i"),
      testo: "Ci si ferma a C<sub>w</sub>(1) = 0: con un elemento non si confronta niente. Le colonne vanno da n fino a 2: la somma dei numeri da 2 a n.",
      disegno: disegno(n - 1) });
    S.push({ tit: "Gauss meno uno", dove: "Riga 7 (nota 5)",
      formula: "= " + c2("n(n + 1)/2 − 1") + " = " + (n * (n + 1) / 2 - 1),
      testo: "Con un quadretto in più (tratteggiato, la colonna alta 1) la scala sarebbe 1 + 2 + … + n = n(n + 1)/2, la formula di Gauss. Quel quadretto manca: n(n + 1)/2 − 1 = " + (n * (n + 1) / 2 - 1) + ".",
      disegno: disegno(n - 1, { gauss: true }) });
    S.push({ tit: "L'ordine di grandezza", dove: "Riga 8 (nota 6)",
      formula: "= Θ(" + c2("n²") + ")",
      testo: "n(n + 1)/2 − 1 = n²/2 + n/2 − 1: il termine che cresce di più è n²/2. La scala è circa metà di un quadrato n × n: Θ(n²).",
      disegno: disegno(n - 1, { gauss: true }) });
    return S;
  }
};

VF.migliore = {
  titolo: "Il caso migliore di quickSort, livello per livello",
  parametri: [{ id: "n", nome: "n", valori: [2, 4, 8, 16], val: 8 }],
  legenda: "Ogni riga è un livello dell'albero delle chiamate. I pezzi sono le chiamate, lunghi quanto gli elementi che ricevono. Arancione = confronti già contati (un pezzo da s elementi costa s), blu = chiamate da srotolare.",
  passi: function (P) {
    var n = P.n, k = Math.round(vfLog2(n)), u = Math.floor(256 / n), x0 = 64, dy = 30, W = x0 + n * u + 110, H = 16 + (k + 1) * dy + 10, S = [];
    function disegno(fatti, fine) {
      var D = new Disegno(W, H, "i livelli delle chiamate nel caso migliore, n = " + n), acc = 0;
      for (var j = 0; j <= k; j++) {
        var c = Math.pow(2, j), s = n / c, y = 12 + j * dy;
        D.testo(x0 - 8, y + 14, "livello " + j, { anc: "end", size: 11, col: "muted" });
        if (j > fatti) continue;
        for (var p = 0; p < c; p++) {
          var col = j < fatti ? "arancio" : (j === k && fine ? "verde" : "blu");
          D.rett(x0 + p * s * u + 1, y + 2, s * u - 3, 18, col, { rx: 3 });
          if (s * u >= 22) D.testo(x0 + p * s * u + s * u / 2, y + 15, j < fatti ? String(s) : "C" + pd("b") + "(" + s + ")", { size: s * u >= 44 ? 11 : 9.5, col: "testo" });
        }
        if (j < fatti) { acc += n; D.testo(x0 + n * u + 8, y + 15, "+ n = " + acc, { anc: "start", size: 11.5, col: "arancio" }); }
        else if (j === k && fine) D.testo(x0 + n * u + 8, y + 15, n + " · C" + pd("b") + "(1) = 0", { anc: "start", size: 11.5, col: "verde" });
      }
      return D.svg(1.2);
    }
    for (var j = 1; j <= k; j++) {
      var cj = Math.pow(2, j);
      S.push({ tit: j === 1 ? "La prima chiamata" : "Srotolo un livello", dove: (j === 1 ? "Riga 1 (nota 1)" : "Riga " + Math.min(j, 3) + " (nota 2)") + ", n = " + n,
        formula: (j === 1 ? "C<sub>b</sub>(n) = " : "= ") + c1(cj + " C<sub>b</sub>(n/" + cj + ")") + " + " + c2(j === 1 ? "n" : j + "n"),
        testo: j === 1 ? "Nel caso migliore il perno finisce a metà: partiziona fa n confronti (arancione) e lascia due chiamate su n/2 elementi (blu)."
          : "Ogni chiamata blu fa lo stesso: tanti confronti quanti elementi, e due chiamate sulla metà. Il livello appena srotolato ha " + Math.pow(2, j - 1) + " pezzi da n/" + Math.pow(2, j - 1) + ": in tutto costa ancora n. Ora " + cj + " chiamate da n/" + cj + ", e fuori si sono accumulati " + j + " volte n.",
        disegno: disegno(j, false) });
    }
    S.push({ tit: "Fino ai pezzi da 1", dove: "Riga 5 (note 3 e 4)",
      formula: "= " + c3("n · C<sub>b</sub>(1)") + " + " + c2("n log<sub>2</sub> n"),
      testo: "Ci si ferma quando i pezzi hanno 1 elemento: n/2<sup>j</sup> = 1, cioè j = log<sub>2</sub> n = " + k + " livelli. Ogni livello arancione costa n: in tutto n log<sub>2</sub> n.",
      disegno: disegno(k, true) });
    S.push({ tit: "Il risultato", dove: "Riga 6 (nota 5)",
      formula: "= " + c2("n log<sub>2</sub> n") + " = " + n * k,
      testo: "C<sub>b</sub>(1) = 0: un elemento solo non si confronta. Restano log<sub>2</sub> n righe da n confronti: n log<sub>2</sub> n = " + n + " · " + k + " = " + n * k + ".",
      disegno: disegno(k, true) });
    return S;
  }
};

VF.medio = {
  titolo: "La media sui perni: perché le due somme sono uguali",
  parametri: [{ id: "n", nome: "n", valori: [3, 4, 5, 6, 7], val: 5 }],
  legenda: "Ogni riga è una posizione k del perno, tutte con probabilità 1/n. In arancione i confronti di partiziona, in blu e viola le due chiamate ricorsive.",
  passi: function (P) {
    var n = P.n, dy = 26, x0 = 70, w = 86, W = x0 + 3 * (w + 10) + 120, H = 34 + n * dy + 40, S = [];
    function disegno(fase) {
      var D = new Disegno(W, H, "le righe della media per n = " + n), cols = [["n", "arancio"], ["C(k)", "blu"], ["C(n − k − 1)", "viola"]];
      cols.forEach(function (c, i) { D.testo(x0 + i * (w + 10) + w / 2, 18, c[0], { size: 12, col: c[1] === "arancio" ? "arancio" : c[1], peso: 600 }); });
      for (var k = 0; k < n; k++) {
        var y = 28 + k * dy;
        D.testo(x0 - 10, y + 15, "k = " + k, { anc: "end", size: 11.5, col: "muted" });
        var vals = [String(n), "C(" + k + ")", "C(" + (n - k - 1) + ")"], idx = [null, k, n - k - 1];
        vals.forEach(function (v, i) {
          var col = cols[i][1], spento = fase >= 3 && i > 0 && idx[i] < 2;
          if (fase === 0 && i > 0) col = "box";
          D.rett(x0 + i * (w + 10), y, w, dy - 5, spento ? "box" : col, { rx: 4, opacita: spento ? 0.45 : 1 });
          D.testo(x0 + i * (w + 10) + w / 2, y + 15, v + (spento ? " = 0" : ""), { size: 12, col: spento ? "muted" : "testo" });
        });
      }
      if (fase === 2) {
        var xa = x0 + 3 * (w + 10) + 4, ya = 28, yz = 28 + n * dy - 5;
        D.freccia(xa, ya + 4, xa, yz - 2, "viola", { w: 1.6 });
        D.freccia(xa, yz - 4, xa, ya + 2, "viola", { w: 1.6 });
        D.testo(xa + 8, (ya + yz) / 2 - 6, "è la colonna blu", { anc: "start", size: 11, col: "viola" });
        D.testo(xa + 8, (ya + yz) / 2 + 9, "letta dal basso", { anc: "start", size: 11, col: "viola" });
      }
      var yb = 28 + n * dy + 16;
      if (fase >= 1) {
        D.testo(x0 + w / 2, yb, "somma: n · n", { size: 11, col: "arancio" });
        D.testo(x0 + (w + 10) + w / 2, yb, "C(0) + … + C(" + (n - 1) + ")", { size: 10.5, col: "blu" });
        D.testo(x0 + 2 * (w + 10) + w / 2, yb, "C(" + (n - 1) + ") + … + C(0)", { size: 10.5, col: "viola" });
      }
      return D.svg(1.2);
    }
    S.push({ tit: "Una riga per ogni posizione del perno", dove: "L'equazione, n = " + n,
      formula: "C(n) = " + c6("(1/n)") + " Σ<sub>k=0</sub><sup>n−1</sup> ( " + c2("n") + " + " + c1("C(k)") + " + " + c4("C(n − k − 1)") + " )",
      testo: "Se il perno finisce in posizione k, partiziona fa n confronti, a sinistra restano k elementi e a destra n − k − 1. Le n righe sono i casi possibili, tutti con probabilità 1/n: C(n) è la media delle righe, cioè la loro somma diviso n.",
      disegno: disegno(0) });
    S.push({ tit: "Spezzo in tre somme", dove: "Riga 1 (nota 1)",
      formula: "= (1/n) " + c2("Σ n") + " + (1/n) " + c1("Σ C(k)") + " + (1/n) " + c4("Σ C(n − k − 1)"),
      testo: "Invece di sommare riga per riga, sommo colonna per colonna: è la stessa cosa. La colonna arancione ha n volte n. La blu ha C(0), C(1), …, C(" + (n - 1) + ") dall'alto in basso. La viola, scendendo, ha C(" + (n - 1) + "), …, C(0).",
      disegno: disegno(1) });
    S.push({ tit: "Le due colonne hanno gli stessi numeri", dove: "Riga 2 (nota 2)",
      formula: "= " + c2("n") + " + (1/n) " + c1("Σ<sub>k=0</sub><sup>n−1</sup> C(k)") + " + (1/n) " + c1("Σ<sub>k=0</sub><sup>n−1</sup> C(k)"),
      testo: "La colonna viola contiene gli stessi valori della blu, al contrario (la freccia: la colonna viola è la blu letta dal basso). Quindi la terza somma è uguale alla seconda. La prima vale n · n, diviso n fa n.",
      disegno: disegno(2) });
    S.push({ tit: "Due somme uguali, e due termini nulli", dove: "Righe 3 e 4 (note 3 e 4)",
      formula: "= n + " + c1("(2/n) Σ<sub>i=0</sub><sup>n−1</sup> C(i)") + " = n + (2/n) Σ<sub>i=" + c3("2") + "</sub><sup>n−1</sup> C(i)",
      testo: "Due somme uguali fanno due volte la stessa somma: 2/n. E C(0) = C(1) = 0 (con 0 o 1 elementi non si confronta niente): le caselle grigie non contano, quindi la somma può partire da i = 2.",
      disegno: disegno(3) });
    return S;
  }
};

// ================================================================ pacco 8 (la maggiorazione con l'integrale), pacchi 13, 15, 16, 17, 18
VF.integrale = {
  titolo: "La dimostrazione C(n) ≤ 2n ln n, con i rettangoli sotto la curva",
  parametri: [{ id: "n", nome: "n", valori: [4, 6, 8, 10, 12], val: 8 }],
  legenda: "Il rettangolo che parte da i ha base 1 e altezza uguale al termine i della somma: la sua area è il termine. La curva arancione è x ln x.",
  passi: function (P) {
    var n = P.n, C = [0, 0], i, S = [];
    for (var m = 2; m <= n; m++) { var s = 0; for (i = 0; i < m; i++) s += C[i]; C.push(m + 2 * s / m); }
    var somma = 0; for (i = 2; i < n; i++) somma += i * Math.log(i);
    var integ = n * n / 2 * Math.log(n) - n * n / 4, W = 420, H = 250, X0 = 44, X1 = 404, Y0 = 220, Y1 = 18;
    var ymax = 2 * (n - 1) * Math.log(n - 1) * 1.08;
    function X(x) { return X0 + (x - 1) / n * (X1 - X0); }
    function Y(y) { return Y0 - y / ymax * (Y0 - Y1); }
    function disegno(fase) {
      var D = new Disegno(W, H, "i termini della somma come rettangoli, n = " + n), k;
      D.linea(X0, Y0, X1, Y0, "muted"); D.linea(X0, Y0, X0, Y1, "muted");
      for (k = 1; k <= n; k++) { D.linea(X(k), Y0, X(k), Y0 + 4, "muted"); D.testo(X(k), Y0 + 16, k, { size: 10.5, col: "muted" }); }
      if (fase >= 2) {
        var pts = [];
        for (k = 0; k <= 40; k++) { var x = 2 + (n - 2) * k / 40; pts.push(r1(X(x)) + "," + r1(Y(x * Math.log(x)))); }
        if (fase >= 3) D.grezzo('<path d="M' + r1(X(2)) + ' ' + Y0 + 'L' + pts.join("L") + 'L' + r1(X(n)) + ' ' + Y0 + 'Z" fill="#fdf0e3" style="fill:var(--orange-soft);opacity:.8"/>');
        D.grezzo('<polyline points="' + pts.join(" ") + '" fill="none" stroke="#b4500f" stroke-width="2.2" style="stroke:var(--orange)"/>');
        D.testo(X(n) - 4, Y(n * Math.log(n)) - 6, "x ln x", { anc: "end", size: 11.5, col: "arancio", peso: 600 });
      }
      for (k = 2; k < n; k++) {
        if (fase === 0) {
          D.rett(X(k) + 1, Y(2 * k * Math.log(k)), X(k + 1) - X(k) - 2, Y0 - Y(2 * k * Math.log(k)), "vuoto");
          D.rett(X(k) + 4, Y(C[k]), X(k + 1) - X(k) - 8, Y0 - Y(C[k]), "verde", { rx: 1 });
        } else D.rett(X(k) + 1, Y(k * Math.log(k)), X(k + 1) - X(k) - 2, Y0 - Y(k * Math.log(k)), "blu", { rx: 1 });
      }
      if (fase === 0) D.testo(X0 + 8, Y1 + 8, "verde: C(i) vero · tratteggio: 2i ln i", { anc: "start", size: 11, col: "muted" });
      if (fase >= 3) D.testo(X0 + 8, Y1 + 8, "rettangoli blu: " + vfNum(somma) + "   area sotto la curva: ≤ " + vfNum(integ), { anc: "start", size: 11, col: "testo" });
      return D.svg(1.2);
    }
    S.push({ tit: "Ogni C(i) sotto il suo tetto", dove: "Riga 2 (nota 1): l'ipotesi induttiva, n = " + n,
      formula: "C(n) = n + (2/n) Σ<sub>i=2</sub><sup>n−1</sup> " + c3("C(i)") + " ≤ n + (2/n) Σ<sub>i=2</sub><sup>n−1</sup> " + c3("2i ln i"),
      testo: "Per ogni i tra 2 e n − 1 l'ipotesi induttiva dice C(i) ≤ 2i ln i. Nel disegno le barre verdi sono i C(i) veri, calcolati con l'equazione, e i tratteggi sono 2i ln i: ogni barra sta sotto il suo tratteggio. Sostituendo ogni termine con uno più grande, la somma può solo crescere.",
      disegno: disegno(0) });
    S.push({ tit: "Il 2 esce dalla somma", dove: "Riga 3 (nota 2)",
      formula: "= n + " + c2("(4/n)") + " " + c1("Σ<sub>i=2</sub><sup>n−1</sup> i ln i"),
      testo: "Il fattore 2 è in tutti i termini: esce, e con il 2/n fa 4/n. Ora la somma è quella dei rettangoli blu: il rettangolo che parte da i è alto i ln i e largo 1, quindi la sua area è i ln i.",
      disegno: disegno(1) });
    S.push({ tit: "I rettangoli stanno sotto la curva", dove: "Sezione 11.2: la somma è al più l'integrale",
      formula: c1("Σ<sub>i=2</sub><sup>n−1</sup> i ln i") + " ≤ " + c2("∫<sub>2</sub><sup>n</sup> x ln x dx"),
      testo: "x ln x cresce: tra i e i + 1 la curva è sempre almeno alta quanto nel punto i, cioè i ln i. Quindi ogni rettangolo blu sta sotto la curva, e tutti insieme hanno area al più quella sotto la curva da 2 a n.",
      disegno: disegno(2) });
    S.push({ tit: "Il valore dell'integrale", dove: "Riga 4 (nota 3): sezione 11.3",
      formula: "≤ n + (4/n) · " + c2("( (n²/2) ln n − n²/4 )"),
      testo: "L'area sotto la curva da 2 a n è (n²/2) ln n − n²/4 meno un pezzetto (quello da 0 a 2, che è positivo): quindi al più (n²/2) ln n − n²/4. Con n = " + n + ": rettangoli " + vfNum(somma) + ", area ≤ " + vfNum(integ) + ".",
      disegno: disegno(3) });
    S.push({ tit: "Il conto finale", dove: "Righe 5 e 6 (nota 4)",
      formula: "= n + " + c4("2n ln n") + " − " + c5("n") + " = 2n ln n ✓",
      testo: "(4/n) · (n²/2) ln n = 2n ln n e (4/n) · (n²/4) = n: il − n si mangia il + n iniziale. Resta 2n ln n = " + vfNum(2 * n * Math.log(n)) + ", e il C(" + n + ") vero è " + vfNum(C[n]) + ".",
      disegno: disegno(3) });
    return S;
  }
};

// ---- pacco 13: la somma delle discese di creaHeap
VF.discese = {
  titolo: "La somma delle discese: dai h a tutti, poi togli",
  modi: [["togli", "dai h a tutti, poi togli (il conto della lavagna)"], ["doppio", "2S − S (la dimostrazione facoltativa)"]],
  parametri: [{ id: "h", nome: "h", valori: [1, 2, 3, 4], val: 3 }],
  legenda: "Ogni cerchio è un nodo dell'albero completo di altezza h; sotto ogni nodo, una colonnina di h quadretti. Un nodo a profondità p scende al più h − p volte.",
  passi: function (P, modo) {
    var h = P.h, N = Math.pow(2, h + 1) - 1, S0 = Math.pow(2, h + 1) - h - 2, T = 0, p;
    for (p = 0; p <= h; p++) T += p * Math.pow(2, p);
    return modo === "doppio" ? vfDoppio(h) : vfTogli(h, N, S0, T);
  }
};
function vfTogli(h, N, S0, T) {
  var q = 8, sw = q + 4, x0 = 64, rowH = 14 + h * q + 12, W = x0 + Math.pow(2, h) * sw + 150, H = 10 + (h + 1) * rowH + 8, S = [];
  function disegno(fase) {
    var D = new Disegno(W, H, "le discese dei nodi di un albero completo di altezza " + h);
    for (var p = 0; p <= h; p++) {
      var c = Math.pow(2, p), y = 10 + p * rowH, larg = Math.pow(2, h) * sw, passo = larg / c;
      D.testo(x0 - 10, y + 10, "p = " + p, { anc: "end", size: 11, col: "muted" });
      for (var j = 0; j < c; j++) {
        var cx = x0 + (j + 0.5) * passo;
        D.cerchio(cx, y + 5, 4, "box", { spessore: 1 });
        for (var r = 0; r < h; r++) {
          var giu = r < h - p, col, o = { rx: 1, spessore: 1 };
          if (fase === 0) { if (!giu) continue; col = "arancio"; }
          else if (fase === 1) col = "blu";
          else if (fase === 4) { if (!giu) { col = "vuoto"; } else col = "arancio"; }
          else col = giu ? "blu" : "rosso";
          if (col === "rosso") o.tratteggio = true;
          D.rett(cx - q / 2, y + 12 + r * q, q - 1.5, q - 1.5, col, o);
        }
      }
      var testo = fase === 0 || fase === 4 ? c2t(c + " · " + (h - p) + " = " + c * (h - p)) : fase === 1 ? c1t(c + " · " + h) : c1t(c + " · " + h) + "  " + c5t("− " + c + " · " + p);
      D.testo(x0 + Math.pow(2, h) * sw + 10, y + 16, testo, { anc: "start", size: 11.5 });
    }
    return D.svg(1.2);
  }
  S.push({ tit: "Le discese", dove: "La somma da calcolare, con h = " + h,
    formula: "S = " + c2("Σ<sub>p=0</sub><sup>h</sup> 2<sup>p</sup>(h − p)") + " = " + S0,
    testo: "A profondità p ci sono 2<sup>p</sup> nodi, e ognuno, nel caso peggiore, scende fino alle foglie: h − p volte (i quadretti arancioni). S conta tutti i quadretti arancioni: la radice ne ha h, le foglie nessuno.",
    disegno: disegno(0) });
  S.push({ tit: "Prima do h quadretti a tutti", dove: "Riga 1 (nota 1): la prima parte",
    formula: "S = " + c1("h · (2<sup>0</sup> + 2<sup>1</sup> + … + 2<sup>h</sup>)") + " − (0 · 2<sup>0</sup> + 1 · 2<sup>1</sup> + … + h · 2<sup>h</sup>)",
    testo: "Il trucco: h − p = h − p, cioè «dai h, poi togli p». Prima do a ogni nodo una colonnina piena di h quadretti (blu). Sono h volte il numero dei nodi: h · (2<sup>0</sup> + … + 2<sup>h</sup>).",
    disegno: disegno(1) });
  S.push({ tit: "Poi tolgo p quadretti a chi sta a profondità p", dove: "Riga 1 (nota 1): la seconda parte",
    formula: "S = h · (2<sup>0</sup> + … + 2<sup>h</sup>) − " + c5("(0 · 2<sup>0</sup> + 1 · 2<sup>1</sup> + … + h · 2<sup>h</sup>)"),
    testo: "Un nodo a profondità p ha ricevuto h quadretti ma ne doveva avere h − p: gliene tolgo p (rossi tratteggiati). Alla profondità p sono 2<sup>p</sup> nodi, quindi tolgo p · 2<sup>p</sup> quadretti. È la seconda parentesi.",
    disegno: disegno(2) });
  S.push({ tit: "Le due parentesi hanno una formula", dove: "Riga 2 (nota 2)",
    formula: "= " + c1("h · (2<sup>h+1</sup> − 1)") + " − " + c5("((h − 1) · 2<sup>h+1</sup> + 2)"),
    testo: "Blu: i nodi sono 2<sup>0</sup> + … + 2<sup>h</sup> = 2<sup>h+1</sup> − 1 = " + N + " (la somma delle potenze di 2), quindi i quadretti blu sono " + h + " · " + N + " = " + h * N + ". Rossi: è la seconda somma, Σ p · 2<sup>p</sup> = (h − 1) · 2<sup>h+1</sup> + 2 = " + T + ".",
    disegno: disegno(2) });
  S.push({ tit: "Quello che resta", dove: "Righe 3 e 4 (note 3 e 4)",
    formula: "= h · 2<sup>h+1</sup> − h − h · 2<sup>h+1</sup> + 2<sup>h+1</sup> − 2 = " + c2("2<sup>h+1</sup> − h − 2"),
    testo: "Tolte le parentesi, h · 2<sup>h+1</sup> e − h · 2<sup>h+1</sup> si cancellano. Restano 2<sup>h+1</sup> − h − 2 = " + Math.pow(2, h + 1) + " − " + h + " − 2 = " + S0 + ". Con i quadretti: " + h * N + " blu meno " + T + " rossi fa " + (h * N - T) + ", proprio quelli arancioni, le discese.",
    disegno: disegno(4) });
  return S;
}
function vfDoppio(h) {
  var cw = 58, ch = 26, x0 = 70, y0 = 30, W = x0 + (h + 1) * cw + 20, H = y0 + 3 * (ch + 22) + 30, S = [];
  function disegno(fase) {
    var D = new Disegno(W, H, "la tabella di S, 2S e 2S − S per h = " + h), q, r;
    for (q = 0; q <= h; q++) D.testo(x0 + q * cw + cw / 2, y0 - 10, "2" + ap(q), { size: 12, peso: 600, col: "muted" });
    var righe = [["S", function (q) { return h - q; }, "blu"], ["2S", function (q) { return q === 0 ? null : h - q + 1; }, "viola"], ["2S − S", function (q) { return q === 0 ? -h : 1; }, "verde"]];
    righe.forEach(function (rg, i) {
      if (i > fase) return;
      var y = y0 + i * (ch + 22);
      D.testo(x0 - 10, y + 17, rg[0], { anc: "end", size: 12, peso: 600 });
      for (q = 0; q <= h; q++) {
        var v = rg[1](q);
        D.rett(x0 + q * cw + 2, y, cw - 4, ch, v === null ? "vuoto" : rg[2], { rx: 4 });
        D.testo(x0 + q * cw + cw / 2, y + 17, v === null ? "—" : (v < 0 ? "−" + (-v) : String(v)), { size: 12.5, col: v === null ? "muted" : "testo", peso: i === 2 ? 700 : 400 });
      }
      if (i === 1 && fase === 1) for (q = 0; q < h; q++) D.freccia(x0 + q * cw + cw / 2, y0 + ch + 2, x0 + (q + 1) * cw + cw / 2 - 6, y - 2, "viola", { w: 1.3 });
    });
    if (fase >= 3) D.graffa(x0 + cw + 2, x0 + (h + 1) * cw - 2, y0 + 2 * (ch + 22) + ch + 4, "2" + ap(1) + " + … + 2" + ap(h) + " = " + (Math.pow(2, h + 1) - 2));
    return D.svg(1.2);
  }
  var coeff = []; for (var q = 0; q <= h; q++) coeff.push((h - q) + " · 2<sup>" + q + "</sup>");
  S.push({ tit: "S, coefficiente per coefficiente", dove: "La somma, con h = " + h,
    formula: "S = " + c1(coeff.join(" + ")),
    testo: "Sotto ogni potenza 2<sup>q</sup> scrivo il suo coefficiente in S: h sotto 2<sup>0</sup>, h − 1 sotto 2<sup>1</sup>, …, 0 sotto 2<sup>h</sup>. Sono i coefficienti che danno fastidio: se fossero tutti 1, S sarebbe una somma di potenze di 2.",
    disegno: disegno(0) });
  S.push({ tit: "Moltiplico per 2: tutto si sposta di una colonna", dove: "2S",
    formula: "2S = " + c4("h · 2<sup>1</sup> + (h − 1) · 2<sup>2</sup> + … + 1 · 2<sup>h</sup>") + " + 0 · 2<sup>h+1</sup>",
    testo: "2<sup>q</sup> · 2 = 2<sup>q+1</sup>: ogni termine passa alla potenza dopo, e il suo coefficiente lo segue (le frecce). Sotto 2<sup>0</sup> in 2S non resta niente; l'ultimo termine, 0 · 2<sup>h+1</sup>, vale 0.",
    disegno: disegno(1) });
  S.push({ tit: "Sottraggo colonna per colonna", dove: "Righe 1 e 2 (note 1 e 2)",
    formula: "S = 2S − S = " + c3("−h + 2<sup>1</sup> + 2<sup>2</sup> + … + 2<sup>h</sup>"),
    testo: "2S − S = S per qualunque numero. Si sottrae tra termini con la stessa potenza: sotto 2<sup>0</sup> resta 0 − h = −h; sotto ogni altra potenza i coefficienti differiscono di 1. Ecco gli 1 che volevamo.",
    disegno: disegno(2) });
  S.push({ tit: "La somma delle potenze", dove: "Riga 3 (nota 3)",
    formula: "= −h + " + c3("(2<sup>h+1</sup> − 2)"),
    testo: "2<sup>0</sup> + 2<sup>1</sup> + … + 2<sup>h</sup> = 2<sup>h+1</sup> − 1; senza il primo termine, 2<sup>0</sup> = 1, resta 2<sup>h+1</sup> − 2 = " + (Math.pow(2, h + 1) - 2) + ".",
    disegno: disegno(3) });
  S.push({ tit: "Il risultato", dove: "Riga 4",
    formula: "= 2<sup>h+1</sup> − h − 2 = " + (Math.pow(2, h + 1) - h - 2),
    testo: "Lo stesso risultato dell'altro modo: " + Math.pow(2, h + 1) + " − " + h + " − 2 = " + (Math.pow(2, h + 1) - h - 2) + ".",
    disegno: disegno(3) });
  return S;
}

// ---- pacco 15: log2(n!) con Stirling
VF.fattoriale = {
  titolo: "log₂(n!) pezzo per pezzo: chi conta davvero",
  parametri: [{ id: "n", nome: "n", valori: [4, 8, 16, 64, 1000], val: 16 }],
  legenda: "Ogni barra è lunga quanto il valore del suo pezzo (tutte con la stessa scala).",
  passi: function (P) {
    var n = P.n, vero = 0, i;
    for (i = 2; i <= n; i++) vero += vfLog2(i);
    var A = 0.5 * vfLog2(2 * Math.PI), B = 0.5 * vfLog2(n), C = n * vfLog2(n), E = n * vfLog2(Math.E), stir = A + B + C - E;
    var W = 430, x0 = 150, L = 215, S = [], max = C;
    function bar(D, y, v, col, et, da) {
      da = da || 0;
      var x = x0 + da / max * L, w = Math.max(1.5, v / max * L);
      D.rett(x, y, w, 18, col, { rx: 3 });
      D.testo(x0 - 8, y + 13, et, { anc: "end", size: 11.5 });
      return x + w;
    }
    function num(D, x, y, v) { D.testo(x + 6, y + 13, vfNum(Math.round(v * 100) / 100), { anc: "start", size: 11, col: "muted" }); }
    function disegno(fase) {
      var D = new Disegno(W, fase === 0 ? 80 : 150, "i pezzi di log2 di n fattoriale, n = " + n), y = 10, x;
      if (fase === 0) {
        x = bar(D, y, vero, "box", "log₂(n!) vero"); num(D, x, y, vero);
        x = bar(D, y + 30, stir, "giallo", "con Stirling"); num(D, x, y + 30, stir);
        return D.svg(1.2);
      }
      x = bar(D, y, A, "blu", "log₂ √(2π)"); num(D, x, y, A);
      x = bar(D, y + 28, B, "arancio", fase >= 2 ? "½ log₂ n" : "log₂ √n"); num(D, x, y + 28, B);
      if (fase === 1) { x = bar(D, y + 56, C - E, "viola", "log₂ (n/e)ⁿ"); num(D, x, y + 56, C - E); }
      else {
        x = bar(D, y + 56, C, "viola", "n log₂ n"); num(D, x, y + 56, C);
        var xs = x0 + (C - E) / max * L;
        D.rett(xs, y + 84, x0 + L - xs, 18, "rosso", { rx: 3, tratteggio: true });
        D.testo(x0 - 8, y + 97, "− n log₂ e", { anc: "end", size: 11.5 });
        num(D, x0 + L, y + 84, -E);
      }
      if (fase === 3) D.testo(x0, y + 128, "n log₂ n è il " + Math.round(C / (A + B + C) * 100) + "% di quello che si somma", { anc: "start", size: 11.5, col: "viola", peso: 600 });
      return D.svg(1.2);
    }
    S.push({ tit: "La formula di Stirling", dove: "Riga 1 (nota 1), n = " + n,
      formula: "log<sub>2</sub>(n!) ≈ " + c6("log<sub>2</sub>(√(2πn) · (n/e)<sup>n</sup>)"),
      testo: "n! è il prodotto 1 · 2 · … · n; Stirling lo approssima con √(2πn) · (n/e)<sup>n</sup>. Le due barre sono log<sub>2</sub>(n!) calcolato davvero e quello di Stirling: quasi uguali.",
      disegno: disegno(0) });
    S.push({ tit: "Il logaritmo di un prodotto", dove: "Riga 2 (nota 2)",
      formula: "= " + c1("log<sub>2</sub> √(2π)") + " + " + c2("log<sub>2</sub> √n") + " + " + c4("log<sub>2</sub>(n/e)<sup>n</sup>"),
      testo: "√(2πn) = √(2π) · √n, e il logaritmo di un prodotto è la somma dei logaritmi: un pezzo per fattore. Le tre barre messe una dopo l'altra fanno la barra di Stirling.",
      disegno: disegno(1) });
    S.push({ tit: "Esponenti e quozienti", dove: "Riga 3 (nota 3)",
      formula: "= log<sub>2</sub> √(2π) + " + c2("½ log<sub>2</sub> n") + " + " + c4("n log<sub>2</sub> n") + " − " + c5("n log<sub>2</sub> e"),
      testo: "La radice è l'esponente ½, che scende davanti. Il pezzo viola: l'esponente n scende davanti e il quoziente diventa una differenza, n log<sub>2</sub>(n/e) = n log<sub>2</sub> n − n log<sub>2</sub> e. Il tratto rosso è la parte che si toglie.",
      disegno: disegno(2) });
    S.push({ tit: "Chi conta davvero", dove: "Riga 4 (nota 4)",
      formula: "= " + c4("Θ(n log n)"),
      testo: "log<sub>2</sub> √(2π) ≈ 1,33 è una costante, ½ log<sub>2</sub> n cresce piano, n log<sub>2</sub> e ≈ 1,44 n è lineare. n log<sub>2</sub> n cresce più di tutti: prova n = 1000 e guarda quanto restano corte le altre barre. Quindi log<sub>2</sub>(n!) = Θ(n log n).",
      disegno: disegno(3) });
    return S;
  }
};

// ---- pacco 16: i bit cambiati da k incrementi
VF.flip = {
  titolo: "Quanti bit cambiano in k incrementi",
  parametri: [{ id: "k", nome: "k", valori: [4, 7, 8, 12, 16], val: 8 }],
  legenda: "Colonne: gli incrementi 1, 2, …, k. Righe: i bit. Rosso = quel bit cambia in quell'incremento.",
  passi: function (P) {
    var k = P.k, nb = 5, q = 15, x0 = 58, y0 = 22, S = [], i, j;
    var W = x0 + Math.max(k * q, 240) + 120, H = y0 + nb * q + 150;
    function cnt(i) { return Math.floor(k / Math.pow(2, i)); }
    function disegno(fase) {
      var D = new Disegno(W, fase >= 1 ? H : y0 + nb * q + 12, "i bit cambiati in " + k + " incrementi");
      for (j = 1; j <= k; j++) D.testo(x0 + (j - 1) * q + q / 2 - 1, y0 - 6, j, { size: 9, col: "muted" });
      for (i = 0; i < nb; i++) {
        var y = y0 + i * q;
        D.testo(x0 - 8, y + 11, "bit " + i, { anc: "end", size: 11, col: "muted" });
        for (j = 1; j <= k; j++) D.rett(x0 + (j - 1) * q, y, q - 2, q - 2, j % Math.pow(2, i) === 0 ? "rosso" : "box", { rx: 2, spessore: 1 });
        D.testo(x0 + k * q + 8, y + 11, "⌊" + k + "/" + Math.pow(2, i) + "⌋ = " + cnt(i), { anc: "start", size: 11, col: "rosso" });
      }
      if (fase === 0) return D.svg(1.2);
      var yb = y0 + nb * q + 22, u = (W - x0 - 40) / (2 * k);
      D.testo(6, yb - 6, fase >= 3 ? "tutti in fila, scala ½:" : "ogni bit: i cambi (rosso) e k/2ⁱ (tratteggio)", { anc: "start", size: 11, col: "muted" });
      if (fase < 3) {
        var uu = q, righe = fase >= 2 ? 8 : nb;
        for (i = 0; i < righe; i++) {
          var yy = yb + i * 12, frac = k / Math.pow(2, i);
          if (i < nb) D.rett(x0, yy, Math.max(0.5, cnt(i) * uu), 9, "rosso", { rx: 1, spessore: 1 });
          D.rett(x0, yy, frac * uu, 9, "vuoto", { rx: 1 });
          if (i >= nb) D.testo(x0 + frac * uu + 6, yy + 8, "bit " + i + " (non c'è: lo aggiungo)", { anc: "start", size: 9.5, col: "muted" });
        }
      } else {
        var x = x0;
        D.rett(x0, yb + 4, 2 * k * u, 20, "vuoto", { rx: 2 });
        for (i = 0; i < 12; i++) {
          var w = k / Math.pow(2, i) * u;
          D.rett(x, yb + 4, Math.max(0.5, w - 1), 20, i < nb ? "rosso" : "giallo", { rx: 1, spessore: 1, opacita: i < nb ? 1 : 0.7 });
          x += w;
        }
        D.graffa(x0, x0 + 2 * k * u, yb + 28, "2k = " + 2 * k);
        D.testo(x0 + k * u / 2, yb + 18, "k", { size: 11 });
      }
      return D.svg(1.2);
    }
    var tot = 0; for (i = 0; i < nb; i++) tot += cnt(i);
    S.push({ tit: "Bit per bit", dove: "Riga 1 (nota 1), k = " + k,
      formula: "T(n, k) = " + c5("k + ⌊k/2⌋ + ⌊k/2<sup>2</sup>⌋ + … + ⌊k/2<sup>n−1</sup>⌋") + " = " + tot,
      testo: "Il bit 0 cambia a ogni incremento, il bit 1 ogni 2, il bit 2 ogni 4: il bit i ogni 2<sup>i</sup>. In k incrementi il bit i cambia ⌊k/2<sup>i</sup>⌋ volte (i quadretti rossi della sua riga). Il costo è il totale dei quadretti rossi.",
      disegno: disegno(0) });
    S.push({ tit: "Tolgo la parte intera", dove: "Riga 2 (nota 2)",
      formula: "= Σ ⌊k/2<sup>i</sup>⌋ ≤ Σ " + c5("k/2<sup>i</sup>") + " = " + c2("k") + " · Σ 1/2<sup>i</sup>",
      testo: "⌊k/2<sup>i</sup>⌋ ≤ k/2<sup>i</sup>: ogni barra rossa sta dentro il suo tratteggio, lungo k/2<sup>i</sup>. Ogni tratteggio è metà del precedente. E k è in tutti i termini: esce dalla somma.",
      disegno: disegno(1) });
    S.push({ tit: "Aggiungo infiniti bit", dove: "Riga 3 (nota 3)",
      formula: "≤ k · Σ<sub>i=0</sub><sup>" + c6("∞") + "</sup> (1/2)<sup>i</sup>",
      testo: "Aggiungo anche i termini dei bit che non ci sono (sempre più corti): sono positivi, quindi la somma non diminuisce.",
      disegno: disegno(2) });
    S.push({ tit: "Tutti in fila: mai oltre 2k", dove: "Riga 4 (nota 4): la serie geometrica",
      formula: "= k · " + c6("1/(1 − 1/2)") + " = 2k",
      testo: "Metto le barre una dopo l'altra: k, poi k/2, poi k/4… Ognuna riempie metà di quello che manca per arrivare a 2k: ci si avvicina sempre, ma non si arriva mai oltre. Quindi T(n, k) ≤ 2k = " + 2 * k + " (qui " + tot + ").",
      disegno: disegno(3) });
    return S;
  }
};

// ---- pacco 17: union by rank, il lemma #nodi ≥ 2^rank
function vfBinomiale(r) { var t = { f: [] }; for (var i = 0; i < r; i++) t.f.push(vfBinomiale(i)); return t; }
function vfConta(t) { return 1 + t.f.reduce(function (s, c) { return s + vfConta(c); }, 0); }
function vfAlt(t) { return t.f.length ? 1 + Math.max.apply(null, t.f.map(vfAlt)) : 0; }
function vfLarg(t) { return t.f.length ? t.f.reduce(function (s, c) { return s + vfLarg(c); }, 0) : 1; }
function vfAlbero(D, t, x, y, passo, dy, col, o) {
  o = o || {};
  var w = vfLarg(t) * passo, cx = x + w / 2, xx = x;
  t.f.forEach(function (c) {
    var wc = vfLarg(c) * passo;
    D.linea(cx, y, xx + wc / 2, y + dy, "muted", { w: 1.2, opacita: o.spento ? 0.3 : 0.8 });
    vfAlbero(D, c, xx, y + dy, passo, dy, c.col || col, o);
    xx += wc;
  });
  D.cerchio(cx, y, 7, t.col || col, { opacita: o.spento && (t.col || col) === o.spento ? 0.3 : 1 });
  return cx;
}
VF.rank = {
  titolo: "Union by rank: perché un albero di rank r ha almeno 2ʳ nodi",
  parametri: [{ id: "c", nome: "caso", valori: ["2,1", "1,1", "2,2", "0,2"], etichetta: function (v) { var t = v.split(","); return "rank(A) = " + t[0] + ", rank(B) = " + t[1]; }, val: "2,2", ricomincia: true }],
  legenda: "A in blu, B in arancione: qui ognuno è l'albero più piccolo del suo rank. Il rank è l'altezza (senza compressione dei cammini).",
  passi: function (P) {
    var t = P.c.split(",").map(Number), rA = t[0], rB = t[1], A = vfBinomiale(rA), B = vfBinomiale(rB), nA = vfConta(A), nB = vfConta(B);
    var sopra = rA >= rB ? A : B, sotto = rA >= rB ? B : A, rx = Math.max(rA, rB) + (rA === rB ? 1 : 0);
    function colora(x, c) { x.col = c; x.f.forEach(function (f) { colora(f, c); }); }
    colora(A, "blu"); colora(B, "arancio");
    var U = { f: sopra.f.concat([sotto]), col: sopra.col };
    var passo = 22, dy = 32, W = Math.max(280, 20 + Math.max(vfLarg(A) * passo, 130) + 30 + Math.max(vfLarg(B) * passo, 120) + 10), H = 50 + (Math.max(rA, rB) + 1) * dy + 32 + rx * dy + 16, S = [];
    function disegno(spento) {
      var D = new Disegno(W, H, "gli alberi A, B e la loro unione");
      D.testo(10, 14, "prima della UNION", { anc: "start", size: 11, col: "muted" });
      var xB = 20 + Math.max(vfLarg(A) * passo, 130) + 30;
      D.testo(20, 32, "A: " + nA + (nA === 1 ? " nodo" : " nodi") + ", rank " + rA, { anc: "start", size: 11, col: "blu", peso: 600 });
      D.testo(xB, 32, "B: " + nB + (nB === 1 ? " nodo" : " nodi") + ", rank " + rB, { anc: "start", size: 11, col: "arancio", peso: 600 });
      vfAlbero(D, A, 20, 50, passo, dy, "blu");
      vfAlbero(D, B, xB, 50, passo, dy, "arancio");
      var y2 = 50 + (Math.max(rA, rB) + 1) * dy + 14;
      D.linea(10, y2 - 14, W - 10, y2 - 14, "muted", { opacita: 0.4 });
      D.testo(10, y2, "dopo UNION(A, B): radice x", { anc: "start", size: 11, col: "muted" });
      var cU = vfAlbero(D, U, 20, y2 + 18, passo, dy, "blu", { spento: spento });
      D.testo(cU + 14, y2 + 22, "rank(x) = " + rx + "   (" + (nA + nB) + " nodi)", { anc: "start", size: 11.5, peso: 600 });
      return D.svg(1.15);
    }
    var x = "#nodi(x)", g = rA > rB ? "A" : "B";
    S.push({ tit: "L'unione mette insieme i nodi", dove: "rank(A) = " + rA + ", rank(B) = " + rB + (rA === rB ? ": caso dei rank uguali" : ": caso rank(" + g + ") più grande"),
      formula: x + " = " + c1("#nodi(A)") + " + " + c2("#nodi(B)"),
      testo: "UNION attacca la radice di rank più piccolo sotto quella di rank più grande (a pari rank, B sotto A). I nodi dell'albero nuovo sono quelli di A più quelli di B: " + nA + " + " + nB + " = " + (nA + nB) + ".",
      disegno: disegno() });
    if (rA !== rB) {
      var big = rA > rB ? "A" : "B", rb = Math.max(rA, rB), cb = rA > rB ? c1 : c2;
      S.push({ tit: "Butto via l'albero più basso", dove: "Nota 1",
        formula: "≥ " + cb("#nodi(" + big + ")"),
        testo: "L'albero più basso ha almeno un nodo, quindi togliendolo la somma non aumenta: ci basta l'albero più alto, " + big + ".",
        disegno: disegno(rA > rB ? "arancio" : "blu") });
      S.push({ tit: "Ipotesi induttiva", dove: "Nota 2",
        formula: "≥ " + cb("2<sup>rank(" + big + ")</sup>") + " = 2<sup>" + rb + "</sup>",
        testo: big + " è stato costruito con meno UNION, quindi per l'ipotesi induttiva ha almeno 2<sup>rank(" + big + ")</sup> = " + Math.pow(2, rb) + " nodi (qui esattamente: è l'albero più piccolo con quel rank).",
        disegno: disegno(rA > rB ? "arancio" : "blu") });
      S.push({ tit: "Il rank non è cresciuto", dove: "rank(x) = rank(" + big + ")",
        formula: "= 2<sup>rank(x)</sup> ✓",
        testo: "L'albero più basso è finito sotto la radice di " + big + ", ma non lo fa diventare più alto: rank(x) = rank(" + big + ") = " + rb + ". Quindi #nodi(x) ≥ 2<sup>rank(x)</sup>.",
        disegno: disegno() });
    } else {
      S.push({ tit: "Ipotesi induttiva su tutti e due", dove: "Nota 2",
        formula: "≥ " + c1("2<sup>rank(A)</sup>") + " + " + c2("2<sup>rank(B)</sup>"),
        testo: "A e B sono stati costruiti con meno UNION: per l'ipotesi induttiva A ha almeno 2<sup>" + rA + "</sup> = " + nA + " nodi e B almeno 2<sup>" + rB + "</sup> = " + nB + ".",
        disegno: disegno() });
      S.push({ tit: "Due volte lo stesso", dove: "Nota 3",
        formula: "= 2 · " + c1("2<sup>rank(A)</sup>"),
        testo: "rank(A) = rank(B), quindi i due termini sono uguali: due copie di 2<sup>" + rA + "</sup>.",
        disegno: disegno() });
      S.push({ tit: "Il rank cresce di uno", dove: "Ultima riga",
        formula: "= 2<sup>rank(A)+1</sup> = 2<sup>rank(x)</sup> ✓",
        testo: "B, alto quanto A, è finito un livello sotto la radice: l'albero nuovo è più alto di uno, rank(x) = rank(A) + 1 = " + rx + ". E 2 · 2<sup>" + rA + "</sup> = 2<sup>" + rx + "</sup>: i nodi sono raddoppiati proprio quando il rank è cresciuto.",
        disegno: disegno() });
    }
    return S;
  }
};

// ---- pacco 18: un albero ha #V − 1 archi
var VF_GRAFO = { v: { 1: [210, 26], 2: [112, 84], 3: [308, 84], 4: [52, 142], 5: [150, 142], 6: [262, 142], 7: [356, 142], 8: [150, 200], 9: [226, 200], 10: [300, 200] },
  e: [[1, 2], [1, 3], [2, 4], [2, 5], [5, 8], [3, 6], [3, 7], [6, 9], [6, 10]] };
VF.archi = {
  titolo: "Perché un albero ha #V − 1 archi: togli un vertice",
  parametri: [{ id: "x", nome: "il vertice x", valori: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], val: 3 }],
  legenda: "Puoi anche toccare un vertice nel disegno per sceglierlo come x. In arancione x e i suoi archi; ogni pezzo ha il suo colore.",
  passi: function (P) {
    var x = P.x, G = VF_GRAFO, vic = {}, id;
    for (id in G.v) vic[id] = [];
    G.e.forEach(function (e) { vic[e[0]].push(e[1]); vic[e[1]].push(e[0]); });
    var pezzi = [], dove = {};
    vic[x].forEach(function (s) {
      var pz = [s], coda = [s]; dove[s] = pezzi.length;
      while (coda.length) { var u = coda.shift(); vic[u].forEach(function (w) { if (w !== x && dove[w] === undefined) { dove[w] = pezzi.length; pz.push(w); coda.push(w); } }); }
      pezzi.push(pz);
    });
    var COL = ["blu", "verde", "viola", "rosso"], CT = [c1, c3, c4, c5], k = pezzi.length;
    function disegno(fase) {
      var D = new Disegno(420, 226 + k * 19, "un albero di 10 vertici, senza il vertice " + x);
      G.e.forEach(function (e) {
        var a = G.v[e[0]], b = G.v[e[1]], dx = e[0] === x || e[1] === x;
        var col = dx ? "arancio" : VF_TRATTO[COL[dove[e[0]]]] ? COL[dove[e[0]]] : "muted";
        D.linea(a[0], a[1], b[0], b[1], col, { w: dx ? 3 : 2.4, tratt: dx && fase === 0 ? false : false });
      });
      for (id in G.v) {
        var p = G.v[id], n = Number(id), c = n === x ? "arancio" : COL[dove[n]];
        D.grezzo('<g data-vfp="x" data-vfv="' + n + '" style="cursor:pointer">');
        D.cerchio(p[0], p[1], 13, c, { spessore: n === x ? 2.5 : 1.5 });
        D.testo(p[0], p[1] + 4.5, id, { size: 12, peso: n === x ? 700 : 400 });
        D.grezzo("</g>");
      }
      pezzi.forEach(function (pz, j) {
        var v = pz.length, vv = v + (v === 1 ? " vertice" : " vertici");
        function ar(m) { return m + (m === 1 ? " arco" : " archi"); }
        var t = fase === 0 ? ar(v - 1) + " dentro" : fase === 1 ? vv + ", " + ar(v - 1) : vv + ", " + ar(v) + " con quello arancione";
        D.testo(8, 236 + j * 19, "G" + pd(j + 1) + ": " + t, { anc: "start", size: 14, col: COL[j], peso: 600 });
      });
      return D.svg(1.15);
    }
    var EE = pezzi.map(function (pz, j) { return CT[j]("#E" + sub(j + 1)); }).join(" + ");
    var VV = pezzi.map(function (pz, j) { return CT[j]("(#V" + sub(j + 1) + " − 1)"); }).join(" + ");
    var V2 = pezzi.map(function (pz, j) { return CT[j]("#V" + sub(j + 1)); }).join(" + ");
    var num = pezzi.map(function (pz) { return pz.length; });
    return [
      { tit: "Tolgo x: restano k pezzi", dove: "Riga 1 (nota 1): x = " + x + ", k = " + k,
        formula: "#E = " + EE + " + " + c2("k"),
        testo: "Tolgo il vertice x = " + x + " e i suoi archi (arancioni). L'albero si spezza in k = " + k + (k === 1 ? " pezzo" : " pezzi") + ", uno per ogni arco di x: un arco porta in un pezzo, e due archi di x non possono portare nello stesso pezzo, se no ci sarebbe un ciclo. Gli archi di G sono quelli dentro i pezzi più i k arancioni.",
        disegno: disegno(0) },
      { tit: "Ipotesi induttiva su ogni pezzo", dove: "Riga 2 (nota 2)",
        formula: "= " + VV + " + " + c2("k"),
        testo: "Ogni pezzo è un albero con meno vertici di G (connesso e senza cicli): per l'ipotesi induttiva ha un arco in meno dei suoi vertici. Qui: " + num.map(function (v) { return v + (v === 1 ? " vertice → 0 archi" : " vertici → " + (v - 1) + (v === 2 ? " arco" : " archi")); }).join("; ") + ".",
        disegno: disegno(1) },
      { tit: "Ogni arco arancione paga un − 1", dove: "Riga 3 (nota 3)",
        formula: "= " + V2,
        testo: "I k «− 1» si cancellano con il + k: ogni pezzo riceve il suo arco arancione, quello che lo collega a x, e con quello i suoi archi diventano tanti quanti i suoi vertici.",
        disegno: disegno(2) },
      { tit: "Tutti i vertici tranne x", dove: "Riga 4 (nota 4)",
        formula: "= " + c6("#V − 1") + " = " + num.join(" + ") + " = 9",
        testo: "I pezzi contengono tutti i vertici di G tranne x: " + num.join(" + ") + " = 9 = 10 − 1. Quindi #E = #V − 1. Prova con un altro x: i pezzi cambiano, il conto no.",
        disegno: disegno(2) }
    ];
  }
};

// ================================================================ pacco 14: da dove cominciano le foglie
VF.foglieheap = {
  titolo: "Perché le foglie cominciano da ⌊n/2⌋",
  parametri: [{ id: "n", nome: "n", valori: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], val: 10 }],
  legenda: "In alto l'albero, in basso lo stesso albero nell'array. In verde le foglie. Le celle tratteggiate dopo la fine non esistono: ci finirebbero i figli che non ci sono.",
  passi: function (P) {
    var n = P.n, f = Math.floor(n / 2), pari = n % 2 === 0, S = [];
    var W = 420, q = Math.min(24, Math.floor(380 / (n + 2))), xa = (W - (n + 2) * q) / 2, ya = 196, H = 250;
    function xc(i) { return xa + i * q + (q - 2) / 2; }
    function liv(i) { return Math.floor(vfLog2(i + 1)); }
    function xt(i) { var p = liv(i), slot = (W - 40) / Math.pow(2, p); return 20 + (i - Math.pow(2, p) + 1 + 0.5) * slot; }
    function arco(D, i, j, col) {
      var x1 = xc(i), x2 = xc(j), h = Math.min(60, 14 + (x2 - x1) * 0.35);
      D.grezzo('<path d="M' + r1(x1) + ' ' + (ya - 2) + 'C' + r1(x1) + ' ' + r1(ya - h) + ' ' + r1(x2) + ' ' + r1(ya - h) + ' ' + r1(x2) + ' ' + (ya - 5) + '" fill="none" stroke="' + VF_TRATTO[col][1] + '" stroke-width="2" style="stroke:var(' + VF_TRATTO[col][0] + ')"' + (j >= n ? ' stroke-dasharray="4 3"' : "") + '/>');
      D.grezzo('<path d="M' + r1(x2) + ' ' + (ya - 2) + 'l-4 -7h8z" fill="' + VF_TRATTO[col][1] + '" style="fill:var(' + VF_TRATTO[col][0] + ')"/>');
    }
    function disegno(o) {
      var D = new Disegno(W, H, "albero e array con " + n + " posizioni"), i;
      for (i = 1; i < n; i++) D.linea(xt((i - 1) >> 1), 20 + liv((i - 1) >> 1) * 34, xt(i), 20 + liv(i) * 34, "muted", { opacita: 0.5, w: 1.2 });
      for (i = 0; i < n; i++) {
        var col = o.col ? o.col(i) : (i >= f ? "verde" : "blu");
        D.cerchio(xt(i), 20 + liv(i) * 34, 11, col);
        D.testo(xt(i), 24 + liv(i) * 34, i, { size: 10.5 });
        D.rett(xa + i * q, ya, q - 2, q - 2, col, { rx: 3 });
        D.testo(xc(i), ya + q / 2 + 3, i, { size: Math.min(11, q - 8) });
      }
      for (i = n; i < n + 2; i++) { D.rett(xa + i * q, ya, q - 2, q - 2, "vuoto"); D.testo(xc(i), ya + q / 2 + 3, i, { size: Math.min(10, q - 9), col: "muted" }); }
      D.linea(xa + n * q - 1, ya - 4, xa + n * q - 1, ya + q + 2, "rosso", { w: 2 });
      D.testo(xa + n * q + 2, ya + q + 14, "fine dell'array", { anc: "start", size: 10.5, col: "rosso" });
      (o.archi || []).forEach(function (a) { arco(D, a[0], a[1], a[2]); });
      (o.graffe || []).forEach(function (g) { D.graffa(xa + g[0] * q, xa + (g[1] + 1) * q - 2, ya + q + 3 + (g[3] || 0) * 24, g[2], { anc: g[4] }); });
      return D.svg(1.2);
    }
    S.push({ tit: "Foglia vuol dire: il figlio sinistro sarebbe fuori", dove: "Primo punto, con n = " + n,
      formula: "i è una foglia  ⟺  " + c3("2i + 1 ≥ n"),
      testo: "Una foglia non ha figli. Nell'array il figlio sinistro di i starebbe in 2i + 1: se quella cella è oltre la fine (l'ultima è n − 1 = " + (n - 1) + "), il figlio non c'è. E se manca il sinistro manca anche il destro, che viene dopo. In verde le foglie: guarda dove cominciano.",
      disegno: disegno({}) });
    S.push({ tit: "Metà arrotondata, poi raddoppiata", dove: "Secondo punto: ⌊n/2⌋ è n/2 oppure (n − 1)/2",
      formula: c1("2⌊n/2⌋") + " = " + (pari ? c1("n") + " (n è pari)" : c1("n − 1") + " (n è dispari)"),
      testo: "⌊n/2⌋ = " + f + " è la metà di n arrotondata per difetto. Raddoppiandola: " + (pari ? "n è pari, non si è arrotondato niente, e si torna a n = " + n + "." : "n è dispari, arrotondando si è perso mezzo, e si torna a n − 1 = " + (n - 1) + ": resta fuori una cella (l'ultima).") + " Le due graffe sono le due metà da " + f + ".",
      disegno: disegno({ col: function (i) { return i < f ? "blu" : i < 2 * f ? "viola" : "box"; }, graffe: [[0, f - 1, "⌊n/2⌋ = " + f], [f, 2 * f - 1, "altre " + f]] }) });
    S.push({ tit: "Più 1: si esce dall'array", dove: "Secondo punto: 2⌊n/2⌋ + 1 ≥ n",
      formula: "2⌊n/2⌋ + 1 = " + c2(pari ? "n + 1" : "n") + " ≥ n",
      testo: "Il figlio sinistro di ⌊n/2⌋ = " + f + " starebbe in 2 · " + f + " + 1 = " + (2 * f + 1) + ": " + (pari ? "una cella oltre n" : "proprio n") + ", oltre la fine (freccia tratteggiata). Quindi " + f + " è una foglia. Vale sempre: n + 1 se n è pari, n se è dispari, e tutti e due sono ≥ n.",
      disegno: disegno({ col: function (i) { return i === f ? "arancio" : i > f ? "verde" : "blu"; }, archi: [[f, 2 * f + 1, "arancio"]] }) });
    S.push({ tit: "Quella prima ha ancora un figlio", dove: "Perché ⌊n/2⌋ è la prima foglia",
      formula: "2(⌊n/2⌋ − 1) + 1 = 2⌊n/2⌋ − 1 = " + c1(pari ? "n − 1" : "n − 2") + " < n",
      testo: "La posizione appena prima, ⌊n/2⌋ − 1 = " + (f - 1) + ", ha il figlio sinistro in " + (2 * f - 1) + ", " + (pari ? "l'ultima cella" : "la penultima cella") + ": dentro l'array (freccia piena). Quindi non è una foglia: è l'ultimo nodo con figli. Per questo le foglie cominciano proprio da ⌊n/2⌋.",
      disegno: disegno({ col: function (i) { return i === f - 1 ? "giallo" : i === 2 * f - 1 ? "blu" : i >= f ? "verde" : "box"; }, archi: [[f - 1, 2 * f - 1, "blu"], [f, 2 * f + 1, "arancio"]] }) });
    S.push({ tit: "Da lì alla fine, tutte foglie", dove: "Terzo punto",
      formula: c3("da ⌊n/2⌋ a n − 1") + ": n − ⌊n/2⌋ = " + (n - f) + " foglie su " + n,
      testo: "Andando avanti, i cresce e 2i + 1 cresce ancora di più: resta fuori. Quindi tutte le posizioni da ⌊n/2⌋ = " + f + " a n − 1 = " + (n - 1) + " sono foglie: n − ⌊n/2⌋ = " + (n - f) + ", la metà arrotondata per eccesso. Le foglie sono già heap, quindi creaHeap non ha bisogno di chiamare risistema su di loro.",
      disegno: disegno({ graffe: [[f, n - 1, (n - f) + " foglie", 0, "start"]] }) });
    return S;
  }
};

[].forEach.call(document.querySelectorAll("[data-vf]"), vfMonta);
})();
