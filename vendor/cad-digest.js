// Prognos · resumo geométrico de um desenho CAD (cotas reais, elevações, vistas, lista de peças).
// Função pura: recebe o banco lido pelo LibreDWG e devolve só números e textos do desenho — nada estimado.
const lp = s => String(s ?? "").replace(/\\[A-Za-z][^;\\]*;|\\P|[{}]|\\~/g, " ").replace(/%%[cC]/g, "Ø").replace(/%%[pP]/g, "±").replace(/%%d/gi, "°").replace(/\s+/g, " ").trim();
const num = v => Math.round(+v * 10) / 10;
export function resumoCAD(db, opt = {}) {
  const ents = [...(db.entities || [])];
  const dims = [], textos = [], itens = [], elev = [];
  for (const e of ents) {
    if (e.type === "DIMENSION" && e.measurement > 0 && e.subDefinitionPoint1 && e.subDefinitionPoint2) {
      const a = e.subDefinitionPoint1, b = e.subDefinitionPoint2;
      const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
      dims.push({ v: num(e.measurement), a: [num(a.x), num(a.y)], b: [num(b.x), num(b.y)], dir: dx > dy * 2 ? "H" : dy > dx * 2 ? "V" : "I", texto: lp(e.text || "").replace("<>", "").trim(), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 });
    } else if (e.type === "DIMENSION" && e.measurement > 0) {
      const t = e.textPoint || e.definitionPoint || { x: 0, y: 0 };
      dims.push({ v: num(e.measurement), a: [num(t.x), num(t.y)], b: [num(t.x), num(t.y)], dir: "R", texto: lp(e.text || ""), cx: t.x, cy: t.y, radial: true });
    } else if (e.type === "TEXT" || e.type === "MTEXT") {
      const p = e.startPoint || e.insertionPoint || { x: 0, y: 0 }, t = lp(e.text || e.textString || "");
      if (t) textos.push({ t, x: p.x, y: p.y, l: e.layer });
    } else if (e.type === "INSERT" && Array.isArray(e.attribs) && e.attribs.length) {
      const at = e.attribs.map(a => lp(a.text || a.textString || "")).filter(Boolean);
      if (at.length) itens.push({ bloco: e.name, x: e.insertionPoint.x, y: e.insertionPoint.y, attr: at });
    }
  }
  // cotas de nível ("+1300", "-4774", "+0.00") ficam em camadas de cota como texto
  for (const t of textos) { const m = /^([+\-±])\s*(\d+(?:[.,]\d+)?)$/.exec(t.t.replace(/\s/g, "")); if (m) elev.push({ v: (m[1] === "-" ? -1 : 1) * parseFloat(m[2].replace(",", ".")), x: t.x, y: t.y }); }
  for (const e of ents) if (e.type === "INSERT" && Array.isArray(e.attribs)) for (const a of e.attribs) { const t = lp(a.text || ""); const m = /^([+\-])\s*(\d+(?:[.,]\d+)?)$/.exec(t); if (m) elev.push({ v: (m[1] === "-" ? -1 : 1) * parseFloat(m[2].replace(",", ".")), x: a.startPoint?.x ?? e.insertionPoint.x, y: a.startPoint?.y ?? e.insertionPoint.y }); }
  // agrupa cotas por vizinhança (cada grupo é uma vista/corte)
  const lim = opt.lim || 4500, pai = dims.map((_, i) => i);
  const f = i => pai[i] === i ? i : (pai[i] = f(pai[i]));
  const ord = dims.map((d, i) => i).sort((i, j) => dims[i].cx - dims[j].cx);
  for (let ii = 0; ii < ord.length; ii++) for (let jj = ii + 1; jj < ord.length; jj++) { const i = ord[ii], j = ord[jj]; if (dims[j].cx - dims[i].cx > lim) break; if (Math.hypot(dims[i].cx - dims[j].cx, dims[i].cy - dims[j].cy) < lim) pai[f(i)] = f(j); }
  const gr = new Map(); dims.forEach((d, i) => { const r = f(i); if (!gr.has(r)) gr.set(r, []); gr.get(r).push(d) });
  const vistas = [];
  for (const ds of gr.values()) {
    if (ds.length < 2) continue;
    const xs = ds.flatMap(d => [d.a[0], d.b[0]]), ys = ds.flatMap(d => [d.a[1], d.b[1]]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const dentro = (p, m = 2500) => p.x >= x0 - m && p.x <= x1 + m && p.y >= y0 - m && p.y <= y1 + m;
    const rotulos = textos.filter(t => dentro(t, 1500) && t.t.length > 2 && !/^[+\-±]/.test(t.t)).map(t => t.t).filter((t, i, a) => a.indexOf(t) === i).slice(0, 14);
    const niveis = elev.filter(p => dentro(p, 1500)).map(p => p.v).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b - a);
    const itensV = itens.filter(i => dentro(i, 1500)).map(i => i.attr.join(" ")).filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
    vistas.push({ x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1), n_cotas: ds.length, cotas_horizontais: ds.filter(d => d.dir === "H").map(d => ({ v: d.v, de: Math.round(Math.min(d.a[0], d.b[0]) - x0), ate: Math.round(Math.max(d.a[0], d.b[0]) - x0), y: Math.round((d.a[1] + d.b[1]) / 2 - y0) })).sort((p, q) => p.y - q.y || p.de - q.de), cotas_verticais: ds.filter(d => d.dir === "V").map(d => ({ v: d.v, de: Math.round(Math.min(d.a[1], d.b[1]) - y0), ate: Math.round(Math.max(d.a[1], d.b[1]) - y0), x: Math.round((d.a[0] + d.b[0]) / 2 - x0) })).sort((p, q) => p.x - q.x || p.de - q.de), outras: ds.filter(d => d.dir === "I" || d.dir === "R").map(d => ({ v: d.v, texto: d.texto || undefined })), niveis, rotulos, itens: itensV });
  }
  // lista de peças (legenda POS/PLANO/DESCRIÇÃO): linhas de texto com "001 004258 1 U DESCRIÇÃO"
  const lista = []; const linhas = new Map();
  for (const t of textos) { const k = Math.round(t.y / 40); if (!linhas.has(k)) linhas.set(k, []); linhas.get(k).push(t) }
  for (const l of linhas.values()) { l.sort((a, b) => a.x - b.x); const s = l.map(t => t.t).join(" "); if (/^\d{3}\s+\d{4,6}\s+\d+\s+(U|M|m|KG|kg)\b/.test(s)) lista.push(s) }
  const camadas = {}; for (const e of ents) camadas[e.layer] = (camadas[e.layer] || 0) + 1;
  const notas = textos.filter(t => /^\s*\d?[.)]?\s*(ALL|FOR|THE|CONCRETE|TODAS|PARA)\b/i.test(t.t) || /NOTES?:?/i.test(t.t)).map(t => t.t).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);
  return { vistas: vistas.sort((p, q) => q.n_cotas - p.n_cotas), lista_pecas: lista.filter((v, i, a) => a.indexOf(v) === i).slice(0, 60), notas, camadas_principais: Object.entries(camadas).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ":" + v) };
}

// Paredes e lajes de um corte: pares de linhas paralelas cuja distância é uma espessura cotada no desenho. Coordenadas: x ao longo da cota horizontal maior; z em mm a partir do fundo da laje (z = cota_fundo + altura acima dela).
export function perfilCorte(db, v, ctx) {
  const H = v.cotas_horizontais.reduce((a, b) => !a || b.v > a.v ? b : a, null);
  if (!H) return null;
  const xa = v.x0 + H.de, xb = v.x0 + H.ate, ya = v.y0 - 100, yb = v.y1 + 100;
  const esps = new Set([...v.cotas_horizontais, ...v.cotas_verticais].map(c => c.v).filter(c => c >= 150 && c <= 700)); if (ctx.esp) { esps.clear(); esps.add(ctx.esp) }
  const ruim = /cota|dim|text|rayado|eje|axis|imagin|hatch|defpoints|fina/i, S = [];
  const add = (a, b, l) => { if (ruim.test(l || "")) return; const dx = b.x - a.x, dy = b.y - a.y; if (Math.hypot(dx, dy) < 300) return;
    if (Math.min(a.x, b.x) < xa - 100 || Math.max(a.x, b.x) > xb + 100 || Math.min(a.y, b.y) < ya || Math.max(a.y, b.y) > yb) return;
    if (Math.abs(dx) < 2) S.push({ o: "V", c: a.x, a: Math.min(a.y, b.y), b: Math.max(a.y, b.y) }); else if (Math.abs(dy) < 2) S.push({ o: "H", c: a.y, a: Math.min(a.x, b.x), b: Math.max(a.x, b.x) }) };
  for (const e of db.entities || []) { if (e.type === "LINE") add(e.startPoint, e.endPoint, e.layer); else if (e.type === "LWPOLYLINE") { const w = e.vertices || []; for (let i = 0; i < w.length - 1; i++) add(w[i], w[i + 1], e.layer); if ((e.flag & 1) && w.length > 2) add(w[w.length - 1], w[0], e.layer) } }
  const une = (o) => { const g = new Map(); for (const s of S.filter(s => s.o === o)) { const k = Math.round(s.c / 4) * 4; if (!g.has(k)) g.set(k, []); g.get(k).push([s.a, s.b]) }
    const out = []; for (const [k, iv] of g) { iv.sort((p, q) => p[0] - q[0]); let cur = null; for (const t of iv) { if (cur && t[0] <= cur[1] + 30) cur[1] = Math.max(cur[1], t[1]); else { if (cur) out.push({ c: k, a: cur[0], b: cur[1] }); cur = [...t] } } if (cur) out.push({ c: k, a: cur[0], b: cur[1] }) } return out };
  const ehEsp = d => [...esps].some(e => Math.abs(e - d) <= Math.max(6, e * 0.02));
  const pares = (L) => { const r = []; L.sort((p, q) => p.c - q.c); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const d = L[j].c - L[i].c; if (d > 720) break; if (!ehEsp(d)) continue; const a = Math.max(L[i].a, L[j].a), b = Math.min(L[i].b, L[j].b); if (b - a >= 1200) r.push({ c0: L[i].c, c1: L[j].c, a, b }) } return r };
  const Vs = pares(une("V")), Hs = pares(une("H"));
  const base = Hs.filter(p => p.b - p.a >= 0.45 * H.v).sort((p, q) => p.c0 - q.c0)[0]; if (!base) return null;
  const zb = ctx.cota_fundo, z = y => Math.round(y - base.c0 + zb), x = X => Math.round(X - xa), zTopo = ctx.topo ?? 1500;
  let caixas = [...Vs.map(p => ({ t: "parede", x0: x(p.c0), x1: x(p.c1), z0: z(p.a), z1: z(p.b) })), ...Hs.map(p => ({ t: "laje", x0: x(p.a), x1: x(p.b), z0: z(p.c0), z1: z(p.c1) }))].filter(c => c.z0 <= zTopo && c.z1 >= zb - 5).map(c => ({ ...c, z1: Math.min(c.z1, zTopo - 200) })).filter(c => c.z1 - c.z0 >= 300);
  const fora = []; for (const c of caixas) { const d = fora.find(o => o.t === c.t && Math.abs(o.x0 - c.x0) < 25 && Math.abs(o.x1 - c.x1) < 25 && Math.abs(o.z0 - c.z0) < 25 && Math.abs(o.z1 - c.z1) < 25); if (!d) fora.push(c) }
  return { comprimento: Math.round(H.v), caixas: fora.sort((p, q) => p.t.localeCompare(q.t) || p.x0 - q.x0) };
}

// Sugestão de parâmetros de um poço/canal de concreto; cada valor traz a cota ou as linhas de onde veio.
export function sugestaoPoco(R, db) {
  const ev = [], P = {}, vs = R.vistas || [];
  const maior = (l) => (l || []).reduce((a, b) => !a || b.v > a.v ? b : a, null);
  const cortes = vs.filter(v => v.niveis.length >= 3 && maior(v.cotas_verticais)?.v >= 4000 && maior(v.cotas_horizontais));
  if (!cortes.length) return { erro: "não achei um corte cotado com níveis (poço/tanque/canal)" };
  const A = cortes.reduce((a, b) => maior(b.cotas_horizontais).v > maior(a.cotas_horizontais).v ? b : a);
  const hA = maior(A.cotas_horizontais), vA = (() => { const mn = Math.abs(Math.min(...cortes.flatMap(v => v.niveis))); return cortes.flatMap(v => v.cotas_verticais).filter(c => c.v >= mn - 50 && c.v <= mn + 1500).reduce((a, b) => !a || b.v > a.v ? b : a, null) || maior(A.cotas_verticais) })();
  P.comprimento = Math.round(hA.v); ev.push(`comprimento ${P.comprimento}: maior cota horizontal do corte longitudinal`);
  P.altura_parede = Math.round(vA.v); ev.push(`altura ${P.altura_parede}: maior cota vertical do corte (do fundo da laje ao topo)`);
  const B = cortes.find(v => v !== A && v.cotas_verticais.some(c => Math.abs(c.v - vA.v) < 5));
  if (B) { P.largura = Math.round(maior(B.cotas_horizontais).v); ev.push(`largura ${P.largura}: maior cota horizontal do corte transversal (mesma altura ${P.altura_parede})`) }
  const niveis = [...new Set(cortes.flatMap(v => v.niveis))].sort((a, b) => a - b);
  const e = (() => { const peq = {}; for (const v of vs) for (const c of [...v.cotas_horizontais, ...v.cotas_verticais]) if (c.v >= 150 && c.v <= 600) peq[c.v] = (peq[c.v] || 0) + 1; const t = Object.entries(peq).sort((a, b) => b[1] - a[1])[0]; return t && t[1] >= 3 ? +t[0] : null })();
  if (e) { P.esp_parede = e; P.esp_fundo = e; ev.push(`espessura ${e}: cota repetida nos cortes (parede e laje)`) }
  const min = niveis[0];
  P.cota_fundo = e && Math.abs(vA.v - (Math.abs(min) + e)) < 5 ? -P.altura_parede : min;
  ev.push(P.cota_fundo === min ? `fundo na cota ${min}: menor nível do corte` : `fundo da laje em ${P.cota_fundo}: o nível ${min} é o topo da laje (${P.altura_parede} = ${Math.abs(min)} + ${e}); topo da parede em ±0,00`);
  let perfil = null; try { if (db) perfil = perfilCorte(db, A, { cota_fundo: P.cota_fundo, esp: e, topo: Math.max(...niveis.filter(n => n < 3000)) + 200 }) } catch (er) {}
  if (perfil && perfil.caixas.length) { P.corte = perfil.caixas; ev.push(`${perfil.caixas.length} paredes/lajes lidas das linhas paralelas do corte (distância 150–800 mm), com posições x/z reais`) }
  const nao = ["armaduras, chumbadores, grelhas, escadas, tubulações e equipamentos dos detalhes", "colunas/pórtico dos eixos PV e plataformas (posição em relação ao poço não confirmada pelas cotas)", "trecho de canal/túnel (níveis -2373, -4774) e demais vistas"];
  return { familia: "poco_concreto", parametros: P, evidencias: ev, niveis_do_desenho: niveis, nao_modelado: nao };
}
