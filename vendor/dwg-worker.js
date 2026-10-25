// Prognos · leitor de DWG (LibreDWG em WebAssembly) — roda isolado num worker.
import { LibreDwg, Dwg_File_Type } from "./libredwg/dist/libredwg-web.js";
import { resumoCAD, sugestaoPoco } from "./cad-digest.js";
let lib = null;
const limpa = s => String(s ?? "").replace(/\\[A-Za-z][^;\\]*;|\\P|[{}]|\\~/g, " ").replace(/%%[cdp]/gi, " ").replace(/\s+/g, " ").trim();
function coleta(ents, out, cont) {
  for (const e of ents || []) {
    cont[e.type] = (cont[e.type] || 0) + 1;
    for (const k of ["text", "value", "textString", "tag", "prompt"]) { const v = e[k]; if (typeof v === "string" && v.trim()) out.push(limpa(v)); else if (v && typeof v === "object" && typeof v.text === "string") out.push(limpa(v.text)); }
    if (e.type === "DIMENSION" && !e.text && e.measurement) out.push("cota " + (+e.measurement).toFixed(2));
    if (e.type === "INSERT" && e.name && !e.name.startsWith("*")) out.push("bloco " + e.name);
    if (Array.isArray(e.attribs)) coleta(e.attribs, out, cont);
  }
}
onmessage = async (ev) => {
  const { id, buf, modo } = ev.data;
  try {
    if (!lib) lib = await LibreDwg.create();
    const dwg = lib.dwg_read_data(buf, Dwg_File_Type.DWG);
    if (!dwg) throw new Error("não abriu");
    const db = lib.convert(dwg);
    if (modo === "geo") { const R = resumoCAD(db); let S = null; try { S = sugestaoPoco(R, db) } catch (e) {} try { lib.dwg_free(dwg); } catch (e) {} postMessage({ id, ok: true, texto: JSON.stringify({ ...R, sugestao_poco: S }) }); return; }
    const textos = [], cont = {};
    coleta(db.entities, textos, cont);
    for (const b of db.tables?.BLOCK_RECORD?.entries || []) if (!String(b.name || "").startsWith("*Model")) coleta(b.entities, textos, {});
    const camadas = (db.tables?.LAYER?.entries || []).map(l => l.name).filter(Boolean);
    try { lib.dwg_free(dwg); } catch (e) {}
    const unicos = [...new Set(textos.filter(t => t && t.length > 1))];
    postMessage({ id, ok: true, texto: `Camadas: ${camadas.slice(0, 80).join(", ")}\nEntidades: ${Object.entries(cont).map(([k, v]) => k + " " + v).join(", ")}\nTextos: ${unicos.join(" | ")}`.slice(0, 200000) });
  } catch (e) { lib = null; postMessage({ id, ok: false, erro: String(e?.message || e) }); }
};
