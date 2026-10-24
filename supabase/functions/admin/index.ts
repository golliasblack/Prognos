// Prognos · Black and White — administração de usuários (precisa da chave de serviço, por isso roda no servidor).
// master: cadastra, exclui e nomeia administradores em qualquer empresa/unidade.
// admin de unidade: cadastra usuários comuns na própria unidade.
const CORS = { "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGEM") ?? "https://golliasblack.github.io", "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const env = (k: string) => Deno.env.get(k) ?? "";
const URL_ = env("SUPABASE_URL"), SRV = env("SUPABASE_SERVICE_ROLE_KEY"), ANON = env("SUPABASE_ANON_KEY");
const APP = env("APP_URL") || "https://golliasblack.github.io/Prognos/";
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const rpcUser = async (auth: string, fn: string, body: unknown = {}) => { const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: ANON, Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `erro ${r.status}`); return r.json(); };
const rpcSrv = async (fn: string, body: unknown) => { const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SRV, Authorization: `Bearer ${SRV}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `erro ${r.status}`); return r.status === 204 ? null : r.json(); };
const authAdmin = (path: string, init: RequestInit = {}) => fetch(`${URL_}/auth/v1/${path}`, { ...init, headers: { apikey: SRV, Authorization: `Bearer ${SRV}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { erro: "Use POST" });
  const auth = req.headers.get("Authorization") ?? "";
  let papel: any, eu: any;
  try { papel = await rpcUser(auth, "meu_papel"); eu = await (await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } })).json(); } catch { return json(401, { erro: "Sessão inválida" }); }
  if (!papel?.master && !(papel?.unidades_ids ?? []).length) return json(403, { erro: "Apenas administradores" });
  let b: any; try { b = await req.json(); } catch { return json(400, { erro: "JSON inválido" }); }
  try {
    if (b.acao === "criar") {
      const email = String(b.email ?? "").trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { erro: "E-mail inválido" });
      let unidade: string = b.unidade_id;
      if (!papel.master) { if (!papel.unidades_ids.includes(unidade)) return json(403, { erro: "Você só cadastra usuários na sua unidade" }); if (b.admin_unidade) return json(403, { erro: "Só o master nomeia administradores" }); }
      else if (!unidade) { if (!b.empresa || !b.unidade) return json(400, { erro: "Informe a empresa e a unidade" }); unidade = await rpcSrv("srv_resolver_unidade", { empresa: b.empresa, unidade: b.unidade, email }); }
      let id: string | null = await rpcSrv("srv_id_por_email", { e: email });
      let convidado = false;
      if (!id) {
        const r = await authAdmin(`invite?redirect_to=${encodeURIComponent(APP)}`, { method: "POST", body: JSON.stringify({ email, data: { nome: b.nome ?? "", convidado_por: eu?.email ?? "" } }) });
        const j = await r.json(); if (!r.ok) return json(400, { erro: j.msg || j.error_description || j.message || "Não consegui enviar o convite" });
        id = j.id ?? j.user?.id; convidado = true;
      }
      if (await rpcSrv("srv_e_master", { alvo: id }) && !papel.master) return json(403, { erro: "Este usuário é master" });
      await rpcSrv("srv_vincular", { alvo: id, unidade, nome: b.nome ?? null, admin_unidade: !!(papel.master && b.admin_unidade) });
      return json(200, { ok: true, convidado, mensagem: convidado ? `Convite enviado para ${email}. A pessoa recebe um e-mail para criar a senha.` : `${email} já tinha conta e foi vinculado à unidade.` });
    }
    if (b.acao === "excluir") {
      if (!papel.master) return json(403, { erro: "Só o master exclui contas" });
      const alvo = String(b.usuario ?? ""); if (!alvo || alvo === eu?.id) return json(400, { erro: "Você não pode excluir a si mesmo" });
      if (await rpcSrv("srv_e_master", { alvo })) return json(403, { erro: "Contas master não podem ser excluídas por aqui" });
      const r = await authAdmin(`admin/users/${alvo}`, { method: "DELETE" }); if (!r.ok) return json(400, { erro: (await r.json().catch(() => ({}))).msg || "Não consegui excluir" });
      return json(200, { ok: true });
    }
    return json(400, { erro: "ação desconhecida" });
  } catch (e) { return json(400, { erro: String((e as Error).message ?? e).slice(0, 300) }); }
});
