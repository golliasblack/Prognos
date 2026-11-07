// Prognos · FICHA do desenho CAD: lê o carimbo (legenda do rodapé), as folhas, os títulos das vistas, as notas e a lista de peças.
// Função pura: recebe o banco lido pelo LibreDWG e devolve só o que está escrito no desenho.
// O carimbo costuma ficar no espaço de papel (cada aba "SHEET n") como atributos de um bloco; sem ele, cai para os textos do rodapé.
export function limpaTexto(s) {
  return String(s ?? "")
    .replace(/\\[ACFHQTWfhqtw][^;\\{}]*;|\\p[^;\\{}]*;/g, "")
    .replace(/\\[Pp]/g, " | ").replace(/\\[LlOoKk~]/g, "")
    .replace(/[{}]/g, "").replace(/%%[cC]/g, "Ø").replace(/%%[pP]/g, "±").replace(/%%[dD]/g, "°").replace(/%%[uUoO]/g, "")
    .replace(/\s+/g, " ").replace(/(\|\s*)+$/g, "").trim();
}
const at = a => { const t = a?.text; return limpaTexto(typeof t === "string" ? t : (t && typeof t === "object" ? (t.text ?? t.textString ?? "") : (a?.textString ?? a?.value ?? ""))) };
const posDe = e => e.startPoint || e.insertionPoint || e.textPoint || { x: 0, y: 0 };
const TAG_CARIMBO = /^(NUMPLA|NUM|NUMERO|N_?DOC|DOC|DESENHO|DRAWING|DWG|DESCRIP\d*|TITULO|TITLE|DIBUJ|DESENH\w*|DRAWN|INSP|VERIF\w*|CHECK\w*|APROB\w*|APPROV\w*|FECHA|DATA|DATE|ESCALA|SCALE|REV\w*|HOJA|FOLHA|SHEET|TOT[-_ ]?HOJAS|TOTAL|UNIDADES|UNITS|MATERIAL|AREA|SECTION|PROJETO|PROJECT|CLIENTE|CLIENT|OBSERVACION|OBSERVACAO|MASA|PESO|NIVEL)/i;
const CHAVES = [
  ["titulo", /^(DESCRIP\d*|TITULO|TITLE|DESCRICAO|DESCRIPCION)$/i, true],
  ["numero_planta", /^(NUMPLA|NUMERO|NUM|N_?DOC|DOC|DESENHO|DRAWING|DWG)$/i],
  ["desenhista", /^(DIBUJ\w*|DESENH\w*|DRAWN\w*)$/i], ["verificador", /^(INSP\w*|VERIF\w*|CHECK\w*)$/i], ["aprovador", /^(APROB\w*|APPROV\w*)$/i],
  ["data", /^(FECHA|DATA|DATE)$/i], ["escala", /^(ESCALA|SCALE)$/i], ["revisao", /^(REV\w*)$/i], ["folha", /^(HOJA|FOLHA|SHEET)$/i], ["total_folhas", /^TOT[-_ ]?(HOJAS|FOLHAS|SHEETS)$/i],
  ["unidades", /^(UNIDADES|UNITS)$/i], ["material", /^MATERIAL$/i], ["area", /^AREA$/i], ["secao", /^SECTION$/i], ["projeto", /^(PROJETO|PROJECT)$/i], ["cliente", /^(CLIENTE|CLIENT)$/i], ["observacao", /^(OBSERVACION|OBSERVACAO)$/i]];
const NUM_DESENHO = /^[A-Z]{1,4}[-_ ]?[A-Z]?\d{4,}[-A-Z0-9_./]*$/i;
const LEGENDA = /^(DIRECTION OF SLOPE|CONVENTIONAL GRAPHICAL SYMBOLS|ELEVATION (FOR|AT)|SECTIONS?$|PLAN VIEW$)/i;
const VISTA = /^(SECTION|SEC[CÇ][AÃ]O|CORTE|DETAIL|DETALHE|VIEW|VISTA|PLAN VIEW|PLANTA|ELEVATION|ELEVA[CÇ][AÃ]O|FACHADA|PLANT VIEW)\b/i;
const NOTAS = /^(NOTES?|NOTAS?|OBSERVA[CÇ][OÕ]ES|GENERAL NOTES)\s*:?/i;

function varre(ents, saida) {
  for (const e of ents || []) {
    if (e.type === "INSERT" && Array.isArray(e.attribs) && e.attribs.length) {
      const attrs = []; for (const a of e.attribs) { const v = at(a), tag = String(a.tag ?? "").trim(); if (v) attrs.push([tag, v]) }
      if (attrs.length) saida.inserts.push({ bloco: e.name, x: e.insertionPoint?.x ?? 0, y: e.insertionPoint?.y ?? 0, attrs, todos: e.attribs.length });
    } else if (e.type === "TEXT" || e.type === "MTEXT") {
      const t = limpaTexto(e.text ?? e.textString ?? ""); if (t) { const p = posDe(e); saida.textos.push({ t, x: p.x, y: p.y }) }
    }
  }
}
function carimbo(inserts) {
  // blocos de carimbo: vários atributos com nomes típicos, ou nome de bloco típico; ignora linhas de lista de peças (POS/PLANO/DESCRIPCION)
  const lista = [], blocos = [];
  for (const b of inserts) {
    const tags = b.attrs.map(a => a[0].toUpperCase());
    if (tags.includes("POS") && (tags.includes("DESCRIPCION") || tags.includes("DESCRICAO") || tags.includes("DESCRIPTION"))) { lista.push(b); continue }
    const pontos = b.attrs.filter(a => TAG_CARIMBO.test(a[0])).length, porNome = /carimbo|cajet|rotulo|r[óo]tulo|title|titulo|tb_|^a[0-4][_-]|moldura|frame|legenda/i.test(b.bloco || "");
    if (pontos >= 2 || porNome || b.attrs.some(a => NUM_DESENHO.test(a[1]) && /DE-|DEI|DES|DWG/i.test(a[1]))) blocos.push(b);
  }
  const campos = {}, extras = [];
  for (const b of blocos) for (const [tag, v] of b.attrs) {
    let achou = false;
    for (const [k, re, junta] of CHAVES) if (re.test(tag)) { achou = true; if (!campos[k]) campos[k] = v; else if (junta && !campos[k].includes(v)) campos[k] += " " + v; break }
    if (!achou) { if (NUM_DESENHO.test(v) && v.length >= 10 && !campos.numero) campos.numero = v; else if (NUM_DESENHO.test(tag) && tag.length >= 10 && !campos.numero) campos.numero = v.length >= 8 ? v : tag; else if (tag && tag !== "0" && !extras.some(x => x[0] === tag)) extras.push([tag, v]) }
  }
  return { campos, extras, lista };
}
export function fichaCAD(db) {
  const L = db.objects?.LAYOUT || [], nomePorHandle = new Map(L.map(l => [String(l.handle), l])), recs = db.tables?.BLOCK_RECORD?.entries || [];
  const modelo = { inserts: [], textos: [] }; varre(db.entities, modelo);
  // entradas do espaço de papel
  const papeis = [];
  for (const b of recs) {
    const n = String(b.name || ""); if (!/^\*Paper_Space/i.test(n)) continue;
    const lay = nomePorHandle.get(String(b.layout)), s = { inserts: [], textos: [], nome: lay?.layoutName || n, ordem: lay?.tabOrder ?? 99, ext: lay ? [lay.minExtent, lay.maxExtent] : null };
    varre(b.entities, s); if (s.inserts.length || s.textos.length) papeis.push(s);
  }
  papeis.sort((a, b) => a.ordem - b.ordem);
  const todosInserts = [...papeis.flatMap(p => p.inserts), ...modelo.inserts];
  const C = carimbo(todosInserts);
  const folhas = papeis.map(p => {
    const c = carimbo(p.inserts).campos, vistas = [], notas = [], visto = new Set();
    for (const t of p.textos) {
      if (LEGENDA.test(t.t) || visto.has(t.t)) continue; visto.add(t.t);
      if (NOTAS.test(t.t)) notas.push(t.t.slice(0, 900)); else if (VISTA.test(t.t) && t.t.length < 140) vistas.push(t.t.replace(/\s*\|.*$/, "").trim());
    }
    return { aba: p.nome, folha: c.folha ? c.folha + (c.total_folhas ? "/" + c.total_folhas : "") : undefined, escala: c.escala, revisao: c.revisao, vistas: [...new Set(vistas)].slice(0, 20), notas: notas.slice(0, 3) };
  });
  const pecas = [];
  for (const b of [...C.lista, ...todosInserts.filter(x => !C.lista.includes(x) && x.attrs.some(a => /^POS$/i.test(a[0])))]) {
    const g = Object.fromEntries(b.attrs.map(a => [a[0].toUpperCase(), a[1]])); const d = g.DESCRIPCION || g.DESCRICAO || g.DESCRIPTION || "";
    if (d.length < 3) continue;
    const s = `${g.POS || ""} ${g.PLANO ? "plano " + g.PLANO : ""} ${g.CANTIDAD || g.QTD ? "qtd " + (g.CANTIDAD || g.QTD) + (g.UNIDADES ? " " + g.UNIDADES : "") : ""} ${d}`.replace(/\s+/g, " ").trim(); if (s && !pecas.includes(s)) pecas.push(s);
  }
  pecas.sort();
  // rodapé: textos da faixa inferior da folha (ou do desenho todo, se não há carimbo em atributos)
  let rodape = [];
  const temCarimbo = Object.keys(C.campos).length >= 3;
  if (!temCarimbo) {
    const fontes = papeis.length ? papeis.map(p => ({ ts: p.textos, ext: p.ext })) : [{ ts: modelo.textos, ext: null }];
    for (const f of fontes) {
      if (!f.ts.length) continue; const ys = f.ts.map(t => t.y), y0 = f.ext ? Math.min(f.ext[0].y, ...ys) : Math.min(...ys), y1 = f.ext ? Math.max(f.ext[1].y, ...ys) : Math.max(...ys), faixa = y0 + (y1 - y0) * 0.18;
      for (const t of f.ts.filter(t => t.y <= faixa).sort((a, b) => b.x - a.x)) if (t.t.length > 1 && !rodape.includes(t.t)) rodape.push(t.t);
    }
    rodape = rodape.slice(0, 30);
  }
  const cp = C.campos, id = [cp.numero, cp.numero_planta && "planta " + cp.numero_planta].filter(Boolean).join(" · ");
  const ficha = { numero: cp.numero, numero_planta: cp.numero_planta, titulo: cp.titulo, area: cp.area, secao: cp.secao, desenhista: cp.desenhista, verificador: cp.verificador, aprovador: cp.aprovador, data: cp.data, escala: cp.escala, revisao: cp.revisao, unidades: cp.unidades, total_folhas: cp.total_folhas, outros_campos: C.extras.slice(0, 20), folhas, lista_pecas: pecas.slice(0, 80), rodape };
  for (const k of Object.keys(ficha)) if (ficha[k] == null || ficha[k] === "" || (Array.isArray(ficha[k]) && !ficha[k].length)) delete ficha[k];
  const notasAll = [...new Set(folhas.flatMap(f => f.notas))].sort((a, b) => b.length - a.length).filter((n, i, a) => !a.slice(0, i).some(m => m.includes(n.slice(0, 120))));
  for (const f of folhas) delete f.notas;
  if (notasAll.length) ficha.notas = notasAll.slice(0, 3);
  const ln = [];
  if (id) ln.push("Desenho nº " + id); if (ficha.titulo) ln.push("Título: " + ficha.titulo);
  const loc = [ficha.area && "Área " + ficha.area, ficha.secao && "Seção " + ficha.secao, ficha.projeto && "Projeto " + ficha.projeto].filter(Boolean).join(" · "); if (loc) ln.push(loc);
  const quem = [ficha.desenhista && "Desenhista " + ficha.desenhista, ficha.verificador && "Verificação " + ficha.verificador, ficha.aprovador && "Aprovação " + ficha.aprovador, ficha.data && "Data " + ficha.data, ficha.revisao && "Rev " + ficha.revisao, ficha.unidades && "Unid. " + ficha.unidades].filter(Boolean).join(" · "); if (quem) ln.push(quem);
  if (folhas.length) ln.push("Folhas: " + folhas.map(f => `${f.aba}${f.folha ? " (" + f.folha + ")" : ""}${f.escala ? " esc. " + f.escala : ""}${f.vistas.length ? " — " + f.vistas.join("; ") : ""}`).join(" | "));
  for (const n of notasAll.slice(0, 3)) ln.push("Notas: " + n);
  if (pecas.length) ln.push("Lista de peças: " + pecas.join("; "));
  if (ficha.outros_campos) ficha.outros_campos = ficha.outros_campos.filter(x => !NUM_DESENHO.test(x[0]) && x[1] !== cp.numero);
  if (ficha.outros_campos && ficha.outros_campos.length) ln.push("Outros campos do carimbo: " + ficha.outros_campos.map(x => x.join("=")).join("; "));
  if (rodape.length) ln.push("Textos do rodapé (sem carimbo em atributos): " + rodape.join(" | "));
  const resumo = [id, ficha.titulo, ficha.data && "data " + ficha.data, ficha.desenhista && "desenhista " + ficha.desenhista, folhas.length && folhas.length + " folha(s)", ficha.escala && "esc. " + ficha.escala].filter(Boolean).join(" · ");
  return { ficha, texto: ln.join("\n"), resumo, tem_carimbo: temCarimbo };
}
