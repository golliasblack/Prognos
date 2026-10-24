// Prognos · Black and White — biblioteca online de acesso aberto.
// Busca livros e artigos gratuitos e legais e devolve o texto para a IA estudar e explicar.
// Fontes: OpenAlex (artigos científicos de acesso aberto, inclui SciELO), arXiv, DOAJ,
// Open Library / Internet Archive (livros em domínio público), Projeto Gutenberg e Wikipédia (pt e en).

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGEM") ?? "https://golliasblack.github.io",
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-prognos-total, x-prognos-tipo",
};
const UA = { "User-Agent": "Prognos/1.0 (Black and White; biblioteca de acesso aberto)" };
const env = (k: string) => Deno.env.get(k) ?? "";
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const limpa = (s: string) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

async function pega(url: string, ms = 12000): Promise<Response> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { headers: UA, signal: c.signal, redirect: "follow" }); } finally { clearTimeout(t); }
}
async function pegaJson(url: string) { const r = await pega(url); if (!r.ok) throw new Error(`${r.status}`); return await r.json(); }

type Item = { fonte: string; tipo: string; titulo: string; autores?: string; ano?: number | string; resumo?: string; url_leitura?: string; url_pagina?: string; idioma?: string; citacoes?: number };

const resumoOpenAlex = (inv: Record<string, number[]> | null) => {
  if (!inv) return "";
  const pos: [number, string][] = [];
  for (const [w, ps] of Object.entries(inv)) for (const p of ps) pos.push([p, w]);
  return pos.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(" ").slice(0, 1200);
};

async function openalex(q: string, n: number): Promise<Item[]> {
  const j = await pegaJson(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=is_oa:true&per-page=${n}&select=id,display_name,publication_year,authorships,primary_location,best_oa_location,open_access,doi,abstract_inverted_index,cited_by_count,language`);
  return (j.results ?? []).map((w: any) => ({
    fonte: "OpenAlex", tipo: "artigo", titulo: w.display_name, ano: w.publication_year, idioma: w.language, citacoes: w.cited_by_count,
    autores: (w.authorships ?? []).slice(0, 4).map((a: any) => a.author?.display_name).filter(Boolean).join(", "),
    resumo: resumoOpenAlex(w.abstract_inverted_index),
    url_leitura: w.best_oa_location?.pdf_url || w.open_access?.oa_url || w.best_oa_location?.landing_page_url || "",
    url_pagina: w.doi || w.primary_location?.landing_page_url || w.id,
  }));
}
async function arxiv(q: string, n: number): Promise<Item[]> {
  const r = await pega(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=${n}&sortBy=relevance`);
  const x = await r.text();
  return [...x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
    const e = m[1], g = (t: string) => (e.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) ?? [])[1] ?? "";
    const id = g("id").trim();
    return { fonte: "arXiv", tipo: "artigo", titulo: limpa(g("title")), ano: g("published").slice(0, 4), resumo: limpa(g("summary")).slice(0, 1200),
      autores: [...e.matchAll(/<name>([^<]+)<\/name>/g)].slice(0, 4).map((a) => a[1]).join(", "), url_pagina: id, url_leitura: id.replace("/abs/", "/pdf/"), idioma: "en" };
  });
}
async function doaj(q: string, n: number): Promise<Item[]> {
  const j = await pegaJson(`https://doaj.org/api/search/articles/${encodeURIComponent(q)}?page=1&pageSize=${n}`);
  return (j.results ?? []).map((a: any) => {
    const b = a.bibjson ?? {};
    const ft = (b.link ?? []).find((l: any) => l.type === "fulltext")?.url ?? "";
    return { fonte: "DOAJ", tipo: "artigo", titulo: b.title, ano: b.year, resumo: limpa(b.abstract ?? "").slice(0, 1200), autores: (b.author ?? []).slice(0, 4).map((x: any) => x.name).join(", "), url_leitura: ft, url_pagina: ft || (b.identifier ?? []).find((i: any) => i.type === "doi")?.id, idioma: (b.journal?.language ?? [])[0] };
  });
}
async function openlibrary(q: string, n: number): Promise<Item[]> {
  const j = await pegaJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&has_fulltext=true&limit=${n * 3}&fields=key,title,author_name,first_publish_year,ia,ebook_access,language`);
  return (j.docs ?? []).filter((d: any) => d.ebook_access === "public" && d.ia?.length).slice(0, n).map((d: any) => ({
    fonte: "Open Library", tipo: "livro", titulo: d.title, ano: d.first_publish_year, autores: (d.author_name ?? []).slice(0, 3).join(", "), idioma: (d.language ?? [])[0],
    url_pagina: `https://openlibrary.org${d.key}`, url_leitura: `https://archive.org/download/${d.ia[0]}/${d.ia[0]}_djvu.txt`,
  }));
}
async function gutenberg(q: string, n: number): Promise<Item[]> {
  const j = await pegaJson(`https://gutendex.com/books?search=${encodeURIComponent(q)}`);
  return (j.results ?? []).slice(0, n).map((b: any) => {
    const f = b.formats ?? {};
    const txt = Object.entries(f).find(([k]) => k.startsWith("text/plain"))?.[1] as string | undefined;
    return { fonte: "Projeto Gutenberg", tipo: "livro", titulo: b.title, autores: (b.authors ?? []).map((a: any) => a.name).join(", "), idioma: (b.languages ?? [])[0], url_pagina: `https://www.gutenberg.org/ebooks/${b.id}`, url_leitura: txt || f["text/html"] || "" };
  });
}
async function wikipedia(q: string, n: number, lang: string): Promise<Item[]> {
  const j = await pegaJson(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${n}&format=json&utf8=1`);
  return (j.query?.search ?? []).map((s: any) => ({ fonte: `Wikipédia (${lang})`, tipo: "enciclopedia", titulo: s.title, resumo: limpa(s.snippet), idioma: lang,
    url_pagina: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`, url_leitura: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}` }));
}

// ---------------- leitura com proteção contra uso como proxy aberto
function urlSegura(u: string): URL {
  const url = new URL(u);
  if (!/^https?:$/.test(url.protocol)) throw new Error("protocolo não permitido");
  const h = url.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^(10|127|0)\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || h.includes(":") || h.endsWith("supabase.co")) throw new Error("endereço não permitido");
  return url;
}
async function ler(u: string) {
  let url = urlSegura(u);
  const wiki = url.hostname.match(/^([a-z]{2,3})\.wikipedia\.org$/);
  if (wiki && url.pathname.startsWith("/wiki/")) {
    const titulo = decodeURIComponent(url.pathname.slice(6));
    const j = await pegaJson(`https://${wiki[1]}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(titulo)}&format=json`);
    const pg: any = Object.values(j.query?.pages ?? {})[0] ?? {};
    return { tipo: "texto", texto: `${pg.title ?? titulo}\n\n${pg.extract ?? ""}` };
  }
  if (url.hostname === "arxiv.org" && url.pathname.startsWith("/abs/")) url = new URL(url.href.replace("/abs/", "/pdf/"));
  const r = await pega(url.href, 25000);
  if (!r.ok) throw new Error(`a fonte respondeu ${r.status}`);
  const ct = r.headers.get("content-type") ?? "";
  const tam = Number(r.headers.get("content-length") ?? 0);
  if (tam > 40 * 1024 * 1024) throw new Error("arquivo maior que 40 MB");
  if (ct.includes("pdf") || /\.pdf($|\?)/i.test(url.pathname)) return { tipo: "pdf", corpo: await r.arrayBuffer() };
  if (!/text|html|xml|json/.test(ct) && ct) throw new Error(`tipo de conteúdo não suportado: ${ct}`);
  let t = await r.text();
  if (/html|xml/.test(ct) || /<html/i.test(t.slice(0, 500))) {
    t = t.replace(/<(script|style|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/h\d>|<\/li>|<\/tr>|<\/div>/gi, "\n").replace(/<[^>]+>/g, " ");
    t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  }
  t = t.replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  return { tipo: "texto", texto: t.slice(0, 3_000_000) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { erro: "Use POST" });
  const m = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/sou_membro`, { method: "POST", headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: req.headers.get("Authorization") ?? "", "Content-Type": "application/json" }, body: "{}" });
  if (!m.ok) return json(401, { erro: "Sessão inválida" });
  if ((await m.json()) !== true) return json(403, { erro: "Usuário não autorizado" });
  let b: any; try { b = await req.json(); } catch { return json(400, { erro: "JSON inválido" }); }

  if (b.acao === "buscar") {
    const q = String(b.consulta ?? "").trim().slice(0, 300); if (!q) return json(400, { erro: "consulta vazia" });
    const tipo = String(b.tipo ?? "todos"), n = Math.min(10, Math.max(2, +b.limite || 5));
    const tarefas: [string, Promise<Item[]>][] = [];
    if (tipo === "todos" || tipo === "artigos") tarefas.push(["OpenAlex", openalex(q, n)], ["arXiv", arxiv(q, Math.ceil(n / 2))], ["DOAJ", doaj(q, Math.ceil(n / 2))]);
    if (tipo === "todos" || tipo === "livros") tarefas.push(["Open Library", openlibrary(q, n)], ["Gutenberg", gutenberg(q, Math.ceil(n / 2))]);
    if (tipo === "todos" || tipo === "enciclopedia") tarefas.push(["Wikipédia pt", wikipedia(q, 3, "pt")], ["Wikipédia en", wikipedia(q, 3, "en")]);
    const res = await Promise.allSettled(tarefas.map((t) => t[1]));
    const itens: Item[] = [], falhas: string[] = [];
    res.forEach((r, i) => { if (r.status === "fulfilled") itens.push(...r.value.filter((x) => x.titulo)); else falhas.push(`${tarefas[i][0]}: ${String(r.reason).slice(0, 80)}`); });
    return json(200, { consulta: q, itens, falhas });
  }
  if (b.acao === "ler") {
    try {
      const r: any = await ler(String(b.url ?? ""));
      if (r.tipo === "pdf") return new Response(r.corpo, { status: 200, headers: { ...CORS, "Content-Type": "application/pdf", "x-prognos-tipo": "pdf" } });
      return json(200, { tipo: "texto", texto: r.texto });
    } catch (e) { return json(422, { erro: String((e as Error).message ?? e) }); }
  }
  return json(400, { erro: "ação desconhecida" });
});
