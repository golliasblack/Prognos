// Prognos · Black and White — roteador de IAs com troca automática.
// Fala o formato da Anthropic com o app e traduz para provedores compatíveis com OpenAI.
// Cada provedor só entra na fila se a chave dele estiver cadastrada em Supabase → Edge Functions → Secrets.
// Ordem: segredo IA_ORDEM (ex.: "groq,cerebras,openrouter,github,gemini,mistral,anthropic").
// Modelo de cada provedor: segredo MODELO_<PROVEDOR> (ex.: MODELO_GROQ).

const env = (k: string) => Deno.env.get(k) ?? "";
const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGEM") ?? "https://golliasblack.github.io",
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-prognos-model, x-prognos-provedor, x-prognos-tentativas",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Prov = { id: string; nome: string; tipo: "anthropic" | "openai"; base: string; chave: string; modelo: string; modeloRapido?: string; visao: boolean; extra?: Record<string, string> };
// Todos com plano grátis sem cartão (conferido em out/2026), exceto onde indicado.
const PROVEDORES: any[] = [
  { id: "groq", nome: "Groq", tipo: "openai", base: "https://api.groq.com/openai/v1", chaveEnv: "GROQ_API_KEY", modeloPadrao: "openai/gpt-oss-120b", rapidoPadrao: "openai/gpt-oss-20b", visao: false },
  { id: "gemini", nome: "Google Gemini", tipo: "openai", base: "https://generativelanguage.googleapis.com/v1beta/openai", chaveEnv: "GEMINI_API_KEY", modeloPadrao: "gemini-2.5-flash", rapidoPadrao: "gemini-2.5-flash", visao: true },
  { id: "nvidia", nome: "NVIDIA", tipo: "openai", base: "https://integrate.api.nvidia.com/v1", chaveEnv: "NVIDIA_API_KEY", modeloPadrao: "openai/gpt-oss-120b", rapidoPadrao: "openai/gpt-oss-20b", visao: false },
  { id: "cloudflare", nome: "Cloudflare", tipo: "openai", base: () => `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID")}/ai/v1`, chaveEnv: "CLOUDFLARE_API_TOKEN", exige: ["CLOUDFLARE_ACCOUNT_ID"], modeloPadrao: "@cf/openai/gpt-oss-120b", rapidoPadrao: "@cf/openai/gpt-oss-20b", visao: false },
  { id: "github", nome: "GitHub Models", tipo: "openai", base: "https://models.github.ai/inference", chaveEnv: "GITHUB_MODELS_TOKEN", modeloPadrao: "openai/gpt-4.1", rapidoPadrao: "openai/gpt-4.1-mini", visao: true },
  { id: "ollama", nome: "Ollama Cloud", tipo: "openai", base: "https://ollama.com/v1", chaveEnv: "OLLAMA_API_KEY", modeloPadrao: "gpt-oss:120b", rapidoPadrao: "gpt-oss:20b", visao: false },
  { id: "openrouter", nome: "OpenRouter", tipo: "openai", base: "https://openrouter.ai/api/v1", chaveEnv: "OPENROUTER_API_KEY", modeloPadrao: "openrouter/free", visao: false, extra: { "HTTP-Referer": "https://golliasblack.github.io/Prognos/", "X-Title": "Prognos" } },
  { id: "zai", nome: "Z.ai (GLM)", tipo: "openai", base: "https://api.z.ai/api/paas/v4", chaveEnv: "ZAI_API_KEY", modeloPadrao: "glm-4.7-flash", visao: false },
  { id: "mistral", nome: "Mistral", tipo: "openai", base: "https://api.mistral.ai/v1", chaveEnv: "MISTRAL_API_KEY", modeloPadrao: "mistral-medium-latest", rapidoPadrao: "mistral-small-latest", visao: true },
  { id: "huggingface", nome: "Hugging Face", tipo: "openai", base: "https://router.huggingface.co/v1", chaveEnv: "HF_TOKEN", modeloPadrao: "openai/gpt-oss-120b", visao: false },
  { id: "cerebras", nome: "Cerebras", tipo: "openai", base: "https://api.cerebras.ai/v1", chaveEnv: "CEREBRAS_API_KEY", modeloPadrao: "gpt-oss-120b", visao: false }, // hoje pede cartão
  // OVHcloud: funciona sem chave (2 pedidos/min por IP); com OVH_API_KEY o limite sobe. Reserva para nunca ficar sem resposta.
  { id: "ovh", nome: "OVHcloud", tipo: "openai", base: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1", chaveEnv: "OVH_API_KEY", semChave: true, modeloPadrao: "gpt-oss-120b", visao: false },
  { id: "anthropic", nome: "Anthropic", tipo: "anthropic", base: "https://api.anthropic.com/v1", chaveEnv: "ANTHROPIC_API_KEY", modeloPadrao: "claude-sonnet-5-5", rapidoPadrao: "claude-haiku-5-5", visao: true }, // paga
];
const ORDEM_PADRAO = "groq,gemini,nvidia,cloudflare,github,ollama,openrouter,zai,mistral,huggingface,cerebras,ovh,anthropic";

function provedoresAtivos(): Prov[] {
  const ordem = (env("IA_ORDEM") || ORDEM_PADRAO).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const todos = PROVEDORES as any[];
  const lista = [...ordem, ...todos.map((p) => p.id).filter((id) => !ordem.includes(id))];
  return lista.map((id) => todos.find((p) => p.id === id)).filter(Boolean).map((p: any) => {
    const up = p.id.toUpperCase();
    return { ...p, base: typeof p.base === "function" ? p.base() : p.base, chave: env(p.chaveEnv) || (p.semChave && env("OVH_DESLIGAR") !== "sim" ? "-" : ""), ok: (p.exige ?? []).every((k: string) => env(k)), modelo: env(`MODELO_${up}`) || p.modeloPadrao, modeloRapido: env(`MODELO_${up}_RAPIDO`) || p.rapidoPadrao, visao: env(`VISAO_${up}`) ? env(`VISAO_${up}`) === "sim" : p.visao };
  }).filter((p: any) => p.chave && p.ok);
}

// Modelo substituto descoberto em tempo de execução, quando o padrão some do provedor.
const substituto = new Map<string, { normal: string; rapido: string }>();
const PREFERE = [/gpt-oss-120b/i, /gemini-[\d.]+-flash(?!-lite)(?!.*(image|tts|audio|live|thinking-exp))/i, /llama-?3\.3-70b/i, /qwen3?.*(235b|80b|72b|32b)/i, /deepseek-v3/i, /mistral-(medium|large)/i, /llama.*70b/i, /gpt-4\.1(?!-nano)/i];
const PREFERE_RAPIDO = [/gpt-oss-20b/i, /gemini-[\d.]+-flash-lite/i, /llama-?3\.1-8b/i, /mistral-small/i, /gpt-4\.1-mini/i];
async function trocaModelo(p: any, falhou: string) {
  const r = await fetch(`${p.base}/models`, { headers: p.chave !== "-" ? { Authorization: `Bearer ${p.chave}` } : {} });
  if (!r.ok) return;
  const j: any = await r.json();
  const ids: string[] = (j.data ?? j.models ?? []).map((m: any) => String(m.id ?? m.name ?? "").replace(/^models\//, "")).filter((x: string) => x && x !== falhou && !/embed|whisper|tts|image|vision-only|guard|rerank/i.test(x));
  const acha = (lista: RegExp[]) => { for (const re of lista) { const m = ids.find((x) => re.test(x)); if (m) return m; } return ""; };
  const normal = acha(PREFERE) || ids[0]; if (!normal) return;
  substituto.set(p.id, { normal, rapido: acha(PREFERE_RAPIDO) || normal });
  console.log(JSON.stringify({ ev: "ia_modelo_trocado", provedor: p.id, de: falhou, para: normal }));
}

// Pausa temporária de provedor que estourou cota (por instância da função).
const pausa = new Map<string, number>();
const pausado = (id: string) => (pausa.get(id) ?? 0) > Date.now();

// ---------------- tradução Anthropic -> OpenAI
function textoSistema(s: unknown): string {
  if (!s) return "";
  if (typeof s === "string") return s;
  if (Array.isArray(s)) return s.map((b: any) => b?.text ?? "").join("\n");
  return "";
}
function limpaSchema(s: any): any {
  if (s === null || typeof s !== "object" || Array.isArray(s)) return { type: "string" };
  const o: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "cache_control") continue;
    if (k === "properties" && v && typeof v === "object") o.properties = Object.fromEntries(Object.entries(v as any).map(([n, x]) => [n, limpaSchema(x)]));
    else if (k === "items") o.items = limpaSchema(v);
    else if ((k === "anyOf" || k === "oneOf") && Array.isArray(v)) o[k] = v.map(limpaSchema);
    else o[k] = v;
  }
  if (!o.type && !o.anyOf && !o.oneOf && !o.enum) o.type = o.properties ? "object" : o.items ? "array" : "string";
  if (o.type === "object" && o.properties && Object.keys(o.properties).length === 0) delete o.properties;
  return o;
}
function paraOpenAI(b: any, modelo: string, stream: boolean) {
  const msgs: any[] = [];
  const sys = textoSistema(b.system);
  if (sys) msgs.push({ role: "system", content: sys });
  for (const m of b.messages ?? []) {
    const blocos = typeof m.content === "string" ? [{ type: "text", text: m.content }] : (m.content ?? []);
    if (m.role === "assistant") {
      const texto = blocos.filter((x: any) => x.type === "text").map((x: any) => x.text).join("");
      const calls = blocos.filter((x: any) => x.type === "tool_use").map((x: any) => ({ id: x.id, type: "function", function: { name: x.name, arguments: JSON.stringify(x.input ?? {}) } }));
      const msg: any = { role: "assistant", content: texto || (calls.length ? null : "") };
      if (calls.length) msg.tool_calls = calls;
      msgs.push(msg);
    } else {
      for (const x of blocos.filter((x: any) => x.type === "tool_result")) {
        const c = typeof x.content === "string" ? x.content : (x.content ?? []).map((y: any) => y.text ?? "").join("\n");
        msgs.push({ role: "tool", tool_call_id: x.tool_use_id, content: (x.is_error ? "ERRO: " : "") + c });
      }
      const partes = blocos.filter((x: any) => x.type === "text" || x.type === "image");
      if (partes.length) {
        const temImg = partes.some((x: any) => x.type === "image");
        msgs.push({
          role: "user",
          content: temImg
            ? partes.map((x: any) => x.type === "text" ? { type: "text", text: x.text } : { type: "image_url", image_url: { url: `data:${x.source?.media_type ?? "image/jpeg"};base64,${x.source?.data}` } })
            : partes.map((x: any) => x.text).join("\n\n"),
        });
      }
    }
  }
  const out: any = { model: modelo, messages: msgs, max_tokens: Math.min(Math.max(+b.max_tokens || 8000, 256), 16000), stream };
  if (stream) out.stream_options = { include_usage: true };
  if (Array.isArray(b.tools) && b.tools.length) {
    out.tools = b.tools.map((t: any) => ({ type: "function", function: { name: t.name, description: t.description ?? "", parameters: limpaSchema(t.input_schema ?? { type: "object" }) } }));
    if (b.sem_ferramentas) out.tool_choice = "none";
  }
  return out;
}
const PARADA: Record<string, string> = { stop: "end_turn", tool_calls: "tool_use", length: "max_tokens", function_call: "tool_use", content_filter: "refusal" };

function streamAnthropic(corpo: ReadableStream<Uint8Array>, modelo: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder(), dec = new TextDecoder();
  return new ReadableStream({
    async start(ctrl) {
      const send = (ev: string, data: unknown) => ctrl.enqueue(enc.encode(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`));
      send("message_start", { type: "message_start", message: { id: "msg_" + crypto.randomUUID().replace(/-/g, ""), type: "message", role: "assistant", model: modelo, content: [], usage: { input_tokens: 0, output_tokens: 0 } } });
      let idx = -1, txt: number | null = null, fim = "end_turn", uso: any = {};
      const tools = new Map<number, { i: number; id: string; name: string; args: string; started: boolean }>();
      const fechaTexto = () => { if (txt !== null) { send("content_block_stop", { type: "content_block_stop", index: txt }); txt = null; } };
      const iniciaTool = (t: any) => {
        fechaTexto(); idx++; t.i = idx; t.started = true;
        send("content_block_start", { type: "content_block_start", index: t.i, content_block: { type: "tool_use", id: t.id, name: t.name, input: {} } });
        if (t.args) send("content_block_delta", { type: "content_block_delta", index: t.i, delta: { type: "input_json_delta", partial_json: t.args } });
      };
      const rd = corpo.getReader(); let buf = "";
      try {
        for (;;) {
          const { done, value } = await rd.read(); if (done) break;
          buf += dec.decode(value, { stream: true }); let n;
          while ((n = buf.indexOf("\n")) >= 0) {
            const linha = buf.slice(0, n).trim(); buf = buf.slice(n + 1);
            if (!linha.startsWith("data:")) continue;
            const d = linha.slice(5).trim(); if (!d || d === "[DONE]") continue;
            let j: any; try { j = JSON.parse(d); } catch { continue; }
            if (j.error) { send("error", { type: "error", error: { type: "api_error", message: j.error.message ?? String(j.error) } }); continue; }
            if (j.usage) uso = j.usage;
            const ch = j.choices?.[0]; if (!ch) continue;
            const dl = ch.delta ?? {};
            if (typeof dl.content === "string" && dl.content) {
              if (txt === null) { idx++; txt = idx; send("content_block_start", { type: "content_block_start", index: txt, content_block: { type: "text", text: "" } }); }
              send("content_block_delta", { type: "content_block_delta", index: txt, delta: { type: "text_delta", text: dl.content } });
            }
            for (const tc of dl.tool_calls ?? []) {
              const k = tc.index ?? 0;
              let t = tools.get(k);
              if (!t) { t = { i: -1, id: tc.id || "call_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20), name: "", args: "", started: false }; tools.set(k, t); }
              if (tc.id && !t.started) t.id = tc.id;
              if (tc.function?.name) t.name = tc.function.name;
              const a = tc.function?.arguments ?? "";
              if (!t.started) { t.args += a; if (t.name) iniciaTool(t); }
              else if (a) send("content_block_delta", { type: "content_block_delta", index: t.i, delta: { type: "input_json_delta", partial_json: a } });
            }
            if (ch.finish_reason) fim = PARADA[ch.finish_reason] ?? "end_turn";
          }
        }
        for (const t of tools.values()) if (!t.started) iniciaTool(t);
        if (tools.size) fim = "tool_use";
        fechaTexto();
        for (const t of tools.values()) send("content_block_stop", { type: "content_block_stop", index: t.i });
        console.log(JSON.stringify({ ev: "ia_fim", modelo, fim, ferramentas: tools.size, texto: idx }));
        send("message_delta", { type: "message_delta", delta: { stop_reason: fim }, usage: { output_tokens: uso.completion_tokens ?? 0, input_tokens: uso.prompt_tokens ?? 0 } });
        send("message_stop", { type: "message_stop" });
      } catch (e) {
        send("error", { type: "error", error: { type: "api_error", message: String(e) } });
      }
      ctrl.close();
    },
  });
}
function respostaAnthropic(j: any, modelo: string) {
  const m = j.choices?.[0]?.message ?? {};
  const content: any[] = [];
  if (m.content) content.push({ type: "text", text: m.content });
  for (const tc of m.tool_calls ?? []) {
    let input = {}; try { input = JSON.parse(tc.function?.arguments || "{}"); } catch { /* */ }
    content.push({ type: "tool_use", id: tc.id || "call_" + crypto.randomUUID().slice(0, 8), name: tc.function?.name, input });
  }
  return { id: j.id, type: "message", role: "assistant", model: modelo, content, stop_reason: PARADA[j.choices?.[0]?.finish_reason] ?? "end_turn", usage: { input_tokens: j.usage?.prompt_tokens ?? 0, output_tokens: j.usage?.completion_tokens ?? 0 } };
}
const temImagem = (b: any) => (b.messages ?? []).some((m: any) => Array.isArray(m.content) && m.content.some((x: any) => x.type === "image"));

// ---------------- servidor
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { code: "invalid_request", message: "Use POST" });
  const auth = req.headers.get("Authorization") ?? "";
  const m = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/sou_membro`, { method: "POST", headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: auth, "Content-Type": "application/json" }, body: "{}" });
  if (!m.ok) return json(401, { code: "session_expired", message: "Sessão inválida" });
  if ((await m.json()) !== true) return json(403, { code: "not_granted", message: "Usuário bloqueado no Prognos" });

  let b: any;
  try { b = await req.json(); } catch { return json(400, { code: "invalid_request", message: "JSON inválido" }); }
  const ativos = provedoresAtivos();
  if (b.acao === "status") return json(200, { provedores: ativos.map((p) => ({ id: p.id, nome: p.nome, modelo: p.modelo, visao: p.visao, pausado: pausado(p.id) })) });
  if (!ativos.length) return json(503, { code: "sampling_disabled", message: "Nenhuma chave de IA cadastrada. Cadastre pelo menos uma em Supabase → Edge Functions → Secrets (ex.: GROQ_API_KEY)." });
  if (!Array.isArray(b.messages) || !b.messages.length) return json(400, { code: "invalid_request", message: "messages vazio" });

  // cota diária por pessoa: as chaves grátis são compartilhadas por todos os usuários
  const limite = Number(env("LIMITE_DIARIO_IA")) || 300;
  const u = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/registrar_uso_ia`, { method: "POST", headers: { apikey: env("SUPABASE_ANON_KEY"), Authorization: auth, "Content-Type": "application/json" }, body: "{}" });
  if (u.ok && Number(await u.json()) > limite) return json(429, { code: "cota_diaria", message: `Você atingiu o limite de ${limite} mensagens de IA de hoje. A cota volta amanhã.` });

  const stream = b.stream !== false, img = temImagem(b), rapido = b.tier === "quick";
  let fila = ativos.filter((p) => !pausado(p.id));
  if (!fila.length) fila = ativos;
  if (img) { const comVisao = fila.filter((p) => p.visao); if (comVisao.length) fila = comVisao; }
  if (b.provedor) { const p = ativos.find((x) => x.id === b.provedor); if (p) fila = [p, ...fila.filter((x) => x !== p)]; }
  if (Array.isArray(b.pular) && b.pular.length) { const sem = fila.filter((p) => !b.pular.includes(p.nome) && !b.pular.includes(p.id)); if (sem.length) fila = sem; }

  const erros: string[] = [];
  const refeitos = new Set<string>();
  for (let i = 0; i < fila.length; i++) {
    const p = fila[i];
    const modelo = p.tipo === "anthropic"
      ? ({ quick: env("MODELO_ANTHROPIC_RAPIDO") || "claude-haiku-5-5", complex: env("MODELO_ANTHROPIC_PROFUNDO") || "claude-opus-5-5" } as any)[b.tier] ?? p.modelo
      : substituto.has(p.id) ? (rapido ? substituto.get(p.id)!.rapido : substituto.get(p.id)!.normal)
      : (rapido && p.modeloRapido) ? p.modeloRapido : p.modelo;
    const t0 = Date.now(), ctl = new AbortController(), limiteT = setTimeout(() => ctl.abort(), 45000);
    try {
      let r: Response;
      if (p.tipo === "anthropic") {
        const payload: any = { model: modelo, max_tokens: Math.min(Math.max(+b.max_tokens || 8000, 256), 32000), messages: b.messages, stream };
        if (b.system) payload.system = b.system;
        if (Array.isArray(b.tools) && b.tools.length) { payload.tools = b.tools; if (b.sem_ferramentas) payload.tool_choice = { type: "none" }; }
        r = await fetch(`${p.base}/messages`, { method: "POST", signal: ctl.signal, headers: { "x-api-key": p.chave, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        r = await fetch(`${p.base}/chat/completions`, { method: "POST", signal: ctl.signal, headers: { ...(p.chave !== "-" ? { Authorization: `Bearer ${p.chave}` } : {}), "Content-Type": "application/json", ...(p.extra ?? {}) }, body: JSON.stringify(paraOpenAI(b, modelo, stream)) });
      }
      clearTimeout(limiteT);
      console.log(JSON.stringify({ ev: "ia", provedor: p.id, modelo, status: r.status, ms: Date.now() - t0, stream, tools: (b.tools || []).length }));
      if (!r.ok) {
        const t = (await r.text()).slice(0, 300);
        console.log(JSON.stringify({ ev: "ia_falha", provedor: p.id, modelo, status: r.status, corpo: t.slice(0, 200) }));
        erros.push(`${p.nome} ${r.status}: ${t}`);
        // modelo retirado ou renomeado pelo provedor: descobre outro na lista do próprio provedor e usa nas próximas chamadas
        if ((r.status === 404 || r.status === 410 || (r.status === 400 && /model/i.test(t))) && p.tipo === "openai") { pausa.set(p.id, Date.now() + 20_000); await trocaModelo(p, modelo).catch(() => {}); if (substituto.has(p.id)) { pausa.delete(p.id); if (!refeitos.has(p.id)) { refeitos.add(p.id); fila.splice(i + 1, 0, p); } } }
        if (r.status === 429 || r.status === 402) pausa.set(p.id, Date.now() + (Number(r.headers.get("retry-after")) * 1000 || 60_000));
        else if (r.status === 401 || r.status === 403) pausa.set(p.id, Date.now() + 10 * 60_000);
        continue; // próximo provedor
      }
      const h = { ...CORS, "x-prognos-model": modelo, "x-prognos-provedor": p.nome, "x-prognos-tentativas": String(erros.length + 1) };
      if (p.tipo === "anthropic") return new Response(r.body, { status: 200, headers: { ...h, "Content-Type": stream ? "text/event-stream" : "application/json" } });
      if (stream) return new Response(streamAnthropic(r.body!, modelo), { status: 200, headers: { ...h, "Content-Type": "text/event-stream" } });
      return new Response(JSON.stringify(respostaAnthropic(await r.json(), modelo)), { status: 200, headers: { ...h, "Content-Type": "application/json" } });
    } catch (e) {
      clearTimeout(limiteT); console.log(JSON.stringify({ ev: "ia_erro", provedor: p.id, ms: Date.now() - t0, erro: String(e).slice(0, 200) }));
      if (String(e).includes("abort")) pausa.set(p.id, Date.now() + 120_000);
      erros.push(`${p.nome}: ${String(e).slice(0, 200)}`);
    }
  }
  return json(429, { code: "rate_limited", message: "Todas as IAs cadastradas falharam ou estão sem cota agora. " + erros.join(" | ").slice(0, 900) });
});
