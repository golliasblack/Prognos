/* Prognos · Black and White — app de chat com ferramentas.
   Backend: Supabase (Auth, Postgres, Edge Function "ia" que guarda a chave da Anthropic). */
"use strict";
const SB_URL="https://hxzgorearzxtvippjhjg.supabase.co";
const SB_KEY="sb_publishable_eIfvP_NdNxo8nXYxookWiw_MTmQkCxY";
const $=id=>document.getElementById(id);
const DAY=864e5;
const PLC={files:[],units:[],decl:{},routines:new Set(),fmt:""};
const CAD={model:null,feats:[],err:""};
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* ======================= AUTENTICAÇÃO ======================= */
let SESS=store.get("prognos.sess");
async function authCall(path,body){const r=await fetch(`${SB_URL}/auth/v1/${path}`,{method:"POST",headers:{apikey:SB_KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.msg||j.error_description||j.message||("erro "+r.status));return j}
function setSess(j){SESS={access:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000-60000,user:j.user};store.set("prognos.sess",SESS)}
async function token(){if(!SESS)throw Object.assign(new Error("sem sessão"),{code:"session_expired"});
  if(Date.now()>SESS.exp){try{setSess(await authCall("token?grant_type=refresh_token",{refresh_token:SESS.refresh}))}catch(e){logout(true);throw Object.assign(new Error("Sessão expirada"),{code:"session_expired"})}}return SESS.access}
function logout(silent){SESS=null;store.del("prognos.sess");showLogin(silent?"Sua sessão expirou. Entre de novo.":"")}
async function sb(path,{method="GET",body,headers={}}={}){const t=await token();const r=await fetch(`${SB_URL}/rest/v1/${path}`,{method,headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json",...headers},body:body===undefined?undefined:JSON.stringify(body)});
  if(r.status===401){logout(true);throw new Error("Sessão expirada")}const txt=await r.text();if(!r.ok)throw new Error(txt.slice(0,300));return txt?JSON.parse(txt):null}
const rpc=(fn,args)=>sb("rpc/"+fn,{method:"POST",body:args||{}});

/* ======================= MARKDOWN ======================= */
function md(t){const L=esc(String(t||"")).split("\n");let h="",inL=null,inC=false,code="",tb=null;
  const inline=s=>s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>");
  const closeL=()=>{if(inL){h+=`</${inL}>`;inL=null}};const closeT=()=>{if(tb){h+="<table>"+tb.map((r,i)=>"<tr>"+r.map(c=>i===0?`<th>${inline(c)}</th>`:`<td>${inline(c)}</td>`).join("")+"</tr>").join("")+"</table>";tb=null}};
  for(const l of L){if(/^\s*```/.test(l)){if(inC){h+=`<pre><code>${code}</code></pre>`;code="";inC=false}else{closeL();closeT();inC=true}continue}
    if(inC){code+=l+"\n";continue}
    if(/^\s*\|.*\|\s*$/.test(l)){closeL();const cells=l.trim().replace(/^\||\|$/g,"").split("|").map(c=>c.trim());if(cells.every(c=>/^:?-{2,}:?$/.test(c)))continue;(tb||(tb=[])).push(cells);continue}else closeT();
    let m=l.match(/^\s*[-*] (.*)/);if(m){if(inL!=="ul"){closeL();h+="<ul>";inL="ul"}h+=`<li>${inline(m[1])}</li>`;continue}
    m=l.match(/^\s*\d+[.)] (.*)/);if(m){if(inL!=="ol"){closeL();h+="<ol>";inL="ol"}h+=`<li>${inline(m[1])}</li>`;continue}
    closeL();m=l.match(/^(#{1,4}) (.*)/);if(m){h+=`<h${Math.min(4,m[1].length+1)}>${inline(m[2])}</h${Math.min(4,m[1].length+1)}>`;continue}
    if(l.trim())h+=`<p>${inline(l)}</p>`}
  if(inC)h+=`<pre><code>${code}</code></pre>`;closeL();closeT();return h}

/* ======================= ANEXOS ======================= */
const ANX={};let anxSeq=0,pending=[];
async function downscale(blob,max=1568){try{const bmp=await createImageBitmap(blob);const s=Math.min(1,max/Math.max(bmp.width,bmp.height));const cv=document.createElement("canvas");cv.width=Math.round(bmp.width*s);cv.height=Math.round(bmp.height*s);cv.getContext("2d").drawImage(bmp,0,0,cv.width,cv.height);return await new Promise(r=>cv.toBlob(r,"image/jpeg",.85))}catch(e){return blob}}
async function videoFrames(file,n=6){const v=document.createElement("video");v.muted=true;v.playsInline=true;v.src=URL.createObjectURL(file);
  await new Promise(r=>{v.onloadeddata=r;setTimeout(r,8000)});const d=v.duration;const out=[];if(!isFinite(d)||!d)return out;
  for(let i=0;i<n;i++){await new Promise(r=>{const f=()=>{v.removeEventListener("seeked",f);r()};v.addEventListener("seeked",f);v.currentTime=d*(i+.5)/n;setTimeout(r,3000)});
    const W=Math.min(1280,v.videoWidth||1280),H=Math.round(W*(v.videoHeight||720)/(v.videoWidth||1280)),cv=document.createElement("canvas");cv.width=W;cv.height=H;cv.getContext("2d").drawImage(v,0,0,W,H);
    const b=await new Promise(r=>cv.toBlob(r,"image/jpeg",.82));if(b)out.push(b)}URL.revokeObjectURL(v.src);return out}
function decodeText(ab){let t=new TextDecoder("utf-8").decode(ab);if(/\x00/.test(t.slice(0,400)))t=new TextDecoder("utf-16le").decode(ab);else if(t.includes("\uFFFD"))t=new TextDecoder("latin1").decode(ab);return t.replace(/^\uFEFF/,"")}
async function readTableAB(name,ab){const ext=name.toLowerCase().split(".").pop();if(["csv","txt"].includes(ext))return splitCSV(decodeText(ab));
  await need("xlsx");const wb=XLSX.read(ab,{type:"array",cellDates:true});return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:true,defval:""})}
const PLC_EXT=/\.(l5x|l5k|scl|st|awl|stl|exp|iec|prg|il|udt)$/i;
async function readAttachment(file){const a={id:"A"+(++anxSeq),nome:file.name,tamanho:file.size,ext:(file.name.split(".").pop()||"").toLowerCase(),kind:"outro",texto:"",imgs:[],rows:null,info:""};
  try{
    if(file.type.startsWith("image/")||/^(jpe?g|png|webp|gif|bmp|tiff?)$/.test(a.ext)){a.kind="imagem";a.imgs=[await downscale(file)]}
    else if(file.type.startsWith("video/")){a.kind="imagem";a.imgs=await videoFrames(file);a.info=`${a.imgs.length} quadros extraídos do vídeo`}
    else{const ab=await file.arrayBuffer();
      if(a.ext==="pdf"){await need("pdf");const pdf=await pdfjsLib.getDocument({data:ab,isEvalSupported:false}).promise;let t="";const n=Math.min(pdf.numPages,400);
        for(let p=1;p<=n;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();t+=`\n[p.${p}] `+tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("")}
        a.kind="texto";a.texto=t;a.info=`${pdf.numPages} páginas`;
        if(t.replace(/\s|\[p\.\d+\]/g,"").length<100*Math.min(n,3)){a.kind="imagem";for(let p=1;p<=Math.min(4,pdf.numPages);p++){const pg=await pdf.getPage(p),vp=pg.getViewport({scale:1.6}),cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;a.imgs.push(await new Promise(r=>cv.toBlob(r,"image/jpeg",.85)))}a.info+=" · digitalizado, lido como imagem"}}
      else if(a.ext==="docx"){await need("docx");a.texto=(await mammoth.extractRawText({arrayBuffer:ab})).value;a.kind="texto"}
      else if(a.ext==="pptx"){await need("zip");const z=await JSZip.loadAsync(ab);const fs=Object.keys(z.files).filter(f=>/ppt\/slides\/slide\d+\.xml$/.test(f)).sort((x,y)=>+x.match(/(\d+)\.xml/)[1]-+y.match(/(\d+)\.xml/)[1]);
        for(const f of fs){const x=await z.file(f).async("string");a.texto+=`\n[slide ${f.match(/(\d+)\.xml/)[1]}] `+(x.match(/<a:t>[^<]*<\/a:t>/g)||[]).map(s=>s.replace(/<\/?a:t>/g,"")).join(" ")}a.kind="texto"}
      else if(["xlsx","xlsm","xls","ods","csv"].includes(a.ext)){a.rows=await readTableAB(file.name,ab);a.kind="tabela";const hi=headerRow(a.rows);a.info=`${a.rows.length} linhas`;
        a.texto=a.rows.slice(0,40).map(r=>r.map(c=>c instanceof Date?iso(c):String(c??"")).join(" | ")).join("\n")}
      else if(a.ext==="zip"){await need("zip");const z=await JSZip.loadAsync(ab);const names=Object.keys(z.files).filter(n=>!z.files[n].dir);a.kind="texto";a.texto="Conteúdo do ZIP:\n"+names.slice(0,300).join("\n");
        for(const n of names.filter(n=>/\.(txt|csv|st|scl|awl|l5x|xml|htm|html|json|log)$/i.test(n)).slice(0,20)){const t=await z.file(n).async("string");a.texto+=`\n\n=== ${n} ===\n${t.slice(0,20000)}`}}
      else{const t=decodeText(ab);const printable=(t.slice(0,5000).match(/[\p{L}\p{N}\p{P}\s]/gu)||[]).length/Math.max(1,Math.min(t.length,5000));
        if(printable>.85){a.texto=t;a.kind=PLC_EXT.test(file.name)||(/\.(xml|txt)$/i.test(file.name)&&detectFmt(file.name,t)!=="Texto ou tabela"&&!/^Texto/.test(detectFmt(file.name,t)))?"plc":"texto";if(/\.(html?|xml)$/i.test(file.name)&&a.kind==="texto")a.texto=t.replace(/<(script|style)[\s\S]*?<\/\1>/gi,"").replace(/<br\s*\/?>|<\/p>|<\/tr>|<\/div>|<\/li>/gi,"\n").replace(/<[^>]+>/g," ")}
        else a.info="formato binário (ex.: DWG, EXE): só nome e tamanho"}}
  }catch(e){a.info="não consegui ler: "+(e.message||e)}
  if(a.kind==="texto"&&!a.info)a.info=`${a.texto.length.toLocaleString("pt-BR")} caracteres`;
  ANX[a.id]=a;return a}
function anxDescr(a,limit){let s=`[Anexo ${a.id}: ${a.nome} · ${a.kind}${a.info?" · "+a.info:""} · ${(a.tamanho/1024).toFixed(0)} kB]`;
  if(a.kind==="tabela")s+=`\nPrimeiras linhas:\n${a.texto.slice(0,6000)}\n(Use analisar_alarmes, analisar_malha ou ler_anexo para trabalhar com a tabela inteira.)`;
  else if(a.kind==="plc")s+=`\nPrograma de CLP detectado (${detectFmt(a.nome,a.texto)}). Use revisar_clp com este anexo.\nInício:\n${a.texto.slice(0,Math.min(limit,8000))}`;
  else if(a.texto)s+=`\n${a.texto.slice(0,limit)}${a.texto.length>limit?`\n[… mais ${(a.texto.length-limit).toLocaleString("pt-BR")} caracteres; use ler_anexo]`:""}`;
  return s}
async function blobB64(b){const ab=await b.arrayBuffer();let s="";const u=new Uint8Array(ab);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}

/* ======================= CHAMADA À IA ======================= */
function apiErr(code,message,text){return Object.assign(new Error(message),{code,text})}
async function iaStream(body,{signal,onText,onTool}={}){const t=await token();
  const r=await fetch(`${SB_URL}/functions/v1/ia`,{method:"POST",signal,headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({...body,stream:true})});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw apiErr(j.code||"upstream_error",j.message||("erro "+r.status))}
  const prov={provedor:r.headers.get("x-prognos-provedor")||"",modelo:r.headers.get("x-prognos-model")||""};
  const rd=r.body.getReader(),dec=new TextDecoder();let buf="",blocks=[],stop=null,usage={};
  for(;;){const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;
    while((i=buf.indexOf("\n\n"))>=0){const raw=buf.slice(0,i);buf=buf.slice(i+2);const line=raw.split("\n").find(l=>l.startsWith("data:"));if(!line)continue;let ev;try{ev=JSON.parse(line.slice(5))}catch(e){continue}
      if(ev.type==="content_block_start"){blocks[ev.index]={...ev.content_block,_json:""};if(ev.content_block.type==="tool_use")onTool?.(ev.content_block)}
      else if(ev.type==="content_block_delta"){const b=blocks[ev.index];if(ev.delta.type==="text_delta"){b.text=(b.text||"")+ev.delta.text;onText?.(blocks.filter(x=>x&&x.type==="text").map(x=>x.text).join(""))}else if(ev.delta.type==="input_json_delta")b._json+=ev.delta.partial_json}
      else if(ev.type==="content_block_stop"){const b=blocks[ev.index];if(b&&b.type==="tool_use"){try{b.input=b._json?JSON.parse(b._json):{}}catch(e){b.input={}}}}
      else if(ev.type==="message_delta"){stop=ev.delta.stop_reason;Object.assign(usage,ev.usage||{})}
      else if(ev.type==="message_start"){Object.assign(usage,ev.message?.usage||{})}
      else if(ev.type==="error")throw apiErr(ev.error?.type==="overloaded_error"?"rate_limited":"upstream_error",ev.error?.message||"erro da IA")}}
  const content=blocks.filter(Boolean).map(b=>b.type==="text"?{type:"text",text:b.text||""}:b.type==="tool_use"?{type:"tool_use",id:b.id,name:b.name,input:b.input||{}}:null).filter(Boolean);
  return {content,stop,usage,prov}}
async function iaOnce(prompt,{tier="default",system,maxTokens=4000,images}={}){const t=await token();const content=[];
  for(const im of images||[])content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:await blobB64(im)}});content.push({type:"text",text:prompt});
  const r=await fetch(`${SB_URL}/functions/v1/ia`,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({tier,system,max_tokens:maxTokens,stream:false,messages:[{role:"user",content}]})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw apiErr(j.code||"upstream_error",j.message||("erro "+r.status));return (j.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("")}
/* rede Prognos: a lição vai sem nome de empresa, pessoa, unidade, tag ou número de ordem */
async function compartilharNaRede(x){const bruto=JSON.stringify({componente:x.tipo_real,modo:x.modo,causa:x.causa,licao:x.licao,desfecho:x.desfecho,horas:x.horas_ate_falha,regime:x.regime});
  const t=await iaOnce(`Anonimize este retorno de campo de manutenção para uma base de conhecimento pública entre empresas. Remova nomes de empresas, unidades, cidades, pessoas, tags e códigos de equipamento, números de ordem ou nota, fornecedores específicos de serviço e qualquer dado que identifique a planta. Mantenha o conhecimento técnico: tipo de componente, modo, mecanismo, causa, sinais precoces e a lição. Classifique o setor industrial de forma genérica se der para inferir (siderurgia, mineração, papel e celulose, petróleo e gás, alimentos, energia, química, saneamento, outro) ou deixe vazio.
Responda só JSON: {"tipo_componente":"","modo":"","mecanismo":"","causa":"","licao":"","setor":"","regime":"","util":true}. Se não houver conhecimento técnico reutilizável, "util": false.
Retorno: ${bruto}`,{tier:"quick",maxTokens:700});
  const j=parseJSON(t);if(!j||j.util===false||!j.licao||!(j.tipo_componente||x.tipo_real))return false;
  const cut=(v,n)=>v?String(v).slice(0,n):null,h=+x.horas_ate_falha;
  await sb("conhecimento_global",{method:"POST",body:[{tipo_componente:cut(x.tipo_real||j.tipo_componente,80),modo:cut(j.modo,200),mecanismo:cut(j.mecanismo,300),causa:cut(j.causa,400),licao:cut(j.licao,1200),setor:cut(j.setor,60),regime:cut(j.regime,200),desfecho:cut(x.desfecho,40),
    vida_h:h>0&&h<2e6?h:null,suspensao:x.desfecho==="trocado_sem_defeito"||x.desfecho==="operando"}],headers:{Prefer:"return=minimal"}});return true}
function parseJSON(t){try{return JSON.parse(t)}catch(e){}const f=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(f){try{return JSON.parse(f[1])}catch(e){}}const a=t.search(/[\[{]/),b=Math.max(t.lastIndexOf("}"),t.lastIndexOf("]"));if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch(e){}}return null}
const errText=e=>({session_expired:"Sua sessão expirou. Entre de novo.",not_granted:"Este usuário está bloqueado no Prognos.",cota_diaria:(e.message||"Limite diário de IA atingido."),sampling_disabled:"Nenhuma IA configurada: cadastre pelo menos uma chave (ex.: GROQ_API_KEY ou GEMINI_API_KEY) em Supabase → Edge Functions → Secrets.",rate_limited:(e.message||"Todas as IAs estão sem cota agora.").slice(0,400),invalid_request:"A IA recusou o pedido: "+(e.message||"").slice(0,200)}[e.code])||("Falha ao falar com a IA: "+(e.message||"erro").slice(0,200));

/* ======================= BIBLIOTECA ONLINE ======================= */
async function bib(body,raw){const t=await token();const r=await fetch(`${SB_URL}/functions/v1/biblioteca`,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(raw)return r;const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.erro||("biblioteca: erro "+r.status));return j}
const LIDOS=new Map();
async function lerOnline(url){if(LIDOS.has(url))return LIDOS.get(url);const r=await bib({acao:"ler",url},true);
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.erro||("não consegui ler: "+r.status))}
  let t="";if((r.headers.get("content-type")||"").includes("pdf")){await need("pdf");const pdf=await pdfjsLib.getDocument({data:await r.arrayBuffer(),isEvalSupported:false}).promise;
    for(let p=1;p<=Math.min(pdf.numPages,600);p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();t+=`\n[p.${p}] `+tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("")}}
  else t=(await r.json()).texto||"";if(LIDOS.size>20)LIDOS.delete(LIDOS.keys().next().value);LIDOS.set(url,t);return t}
function chunkText(t,max){const out=[];t=t.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n");let i=0;while(i<t.length&&out.length<max){let p=t.slice(i,i+1500);if(i+1500<t.length){const c=Math.max(p.lastIndexOf("\n"),p.lastIndexOf(". "));if(c>900)p=p.slice(0,c+1)}if(p.trim().length>40)out.push(p.trim());i+=Math.max(200,p.length-150)}return out}

/* ======================= MOTOR DE CONFIABILIDADE ======================= */
const COND={boa:.9,atencao:.65,"atenção":.65,alerta:.35,critica:.12,"crítica":.12};
function lifeModel(a){const c=LIB[a.tipo]||LIB.gen_mec,hd=Math.min(24,Math.max(.5,+a.horas_dia||24));
  const f={carga:a.carga_pct??75,temp:a.temperatura_c??35,poeira:String(Math.round(+a.poeira||0)),umidade:String(Math.round(+a.umidade||0)),corros:String(Math.round(+a.corrosao||0)),regime:a.regime||"preventiva"};
  const env=envFactor(f,c),ren=[];(a.falhas||[]).forEach(d=>{const x=parseDate(d);if(x)ren.push({d:x,t:"falha"})});(a.trocas_preventivas||[]).forEach(d=>{const x=parseDate(d);if(x)ren.push({d:x,t:"prev"})});
  ren.sort((x,y)=>x.d-y.d);const comp=[...(a.vidas_h||[]).map(Number).filter(v=>v>0)],cens=[...(a.vidas_interrompidas_h||[]).map(Number).filter(v=>v>0)];
  for(let i=1;i<ren.length;i++){const h=(ren[i].d-ren[i-1].d)/DAY*hd;if(h>0)(ren[i].t==="prev"?cens:comp).push(h)}
  let beta=c.beta,bmle=null;if(comp.length>=3){bmle=weibullMLEbeta(comp,cens);if(bmle)beta=(5*c.beta+comp.length*Math.min(6,Math.max(.5,bmle)))/(5+comp.length)}
  const last=ren.length?ren[ren.length-1].d:null,inst=a.instalado_em?parseDate(a.instalado_em):last;
  const age=a.horas_desde_troca!=null?+a.horas_desde_troca:inst?Math.max(0,(Date.now()-inst)/DAY*hd):0;
  const eta0=c.eta*env.tot,aa=2+comp.length,bb=Math.pow(eta0,beta)+comp.reduce((s,t)=>s+Math.pow(t,beta),0)+cens.reduce((s,t)=>s+Math.pow(t,beta),0)+Math.pow(age,beta),etaPost=Math.pow(bb/(aa-1),1/beta);
  const HI=COND[String(a.condicao||"").toLowerCase()]??null;
  const models=[{n:"Motor local (Weibull bayesiano)",type:"post",beta,eta:etaPost,w:1+.5*(comp.length+.5*cens.length)}];
  (a.modelos_especialistas||[]).forEach(m=>{if(+m.beta>0&&+m.eta_h>0)models.push({n:m.nome||"especialista",type:"wb",beta:+m.beta,eta:+m.eta_h,w:Math.max(0,+m.peso||.5)})});
  const rv=a.vida_remanescente_h;if(rv&&+rv.p50>0)models.push({n:rv.nome||"condição / preditiva",type:"rul",p10:+rv.p10||+rv.p50*.4,p50:+rv.p50,p90:+rv.p90||+rv.p50*2.2,w:Math.max(0,+rv.peso||1)});
  const W=models.reduce((s,m)=>s+m.w,0);models.forEach(m=>m.share=m.w/W);const cum=[];let acc=0;models.forEach(m=>{acc+=m.share;cum.push(acc)});
  const N=20000,out=new Float64Array(N);
  for(let i=0;i<N;i++){const r=Math.random();let j=cum.findIndex(x=>r<=x);if(j<0)j=models.length-1;const m=models[j];let rem;
    if(m.type==="rul"){const sg=Math.max(.15,(Math.log(m.p90)-Math.log(m.p10))/2.5631);rem=Math.exp(Math.log(m.p50)+sg*randn())}
    else{let eta=m.eta;if(m.type==="post")eta=Math.pow(bb/rgamma(aa),1/m.beta);const te=effAge(age,m.beta,eta,HI);rem=eta*Math.pow(Math.pow(te/eta,m.beta)-Math.log(Math.random()),1/m.beta)-te}
    out[i]=Math.max(1,rem)}
  out.sort();const q=p=>out[Math.min(N-1,Math.floor(p*N))],pIn=d=>{const h=d*hd;let lo=0,hi=N;while(lo<hi){const mid=(lo+hi)>>1;if(out[mid]<h)lo=mid+1;else hi=mid}return lo/N};
  const p30=pIn(30),risco=p30<.1?0:p30<.3?1:p30<.6?2:3,qq={p10:q(.1),p50:q(.5),p90:q(.9),p95:q(.95)},maxD=Math.max(10,qq.p95/hd*1.08);
  const curve=[];for(let i=0;i<=60;i++){const d=maxD*i/60;curve.push([+d.toFixed(1),+(1-pIn(d)).toFixed(4)])}
  const dt=h=>iso(new Date(Date.now()+h/hd*DAY));
  return {nome:a.nome||c.n,tipo:a.tipo,tipo_nome:c.n,horas_dia:hd,idade_h:Math.round(age),beta:+beta.toFixed(2),beta_mle:bmle&&+bmle.toFixed(2),eta_h:Math.round(etaPost),fator_ambiente:+env.tot.toFixed(2),
    vidas_completas:comp.length,suspensoes:cens.length,datas:{p10:dt(qq.p10),p50:dt(qq.p50),p90:dt(qq.p90)},dias:{p10:Math.round(qq.p10/hd),p50:Math.round(qq.p50/hd),p90:Math.round(qq.p90/hd)},
    prob:{d30:+p30.toFixed(3),d90:+pIn(90).toFixed(3),d180:+pIn(180).toFixed(3)},risco:["baixo","moderado","alto","crítico"][risco],nivel:risco,
    inspecionar_em_dias:Math.max(1,Math.round(Math.min(qq.p10/hd*.5,c.pf/hd/2))),modelos:models.map(m=>({nome:m.n,peso:+m.share.toFixed(2)})),curve,maxD:Math.round(maxD),
    referencia:{beta:c.beta,eta_h:c.eta,modos:c.modos,deteccao:c.tec,pf_h:c.pf}}}

/* ======================= ALARMES E MALHAS ======================= */
function guessCols(head,rows){const h=head.map(x=>String(x).toLowerCase()),used=new Set(),map={};
  const F=[["time",/eventstamp|alarmtime|origination|timestamp|data.?hora|date.?time|hora|time|data|date|ocorr/],["tag",/tagname|^tag|source|origem|objeto|alarm.?name|^name|ponto|nome/],["state",/alarmstate|state|estado|status|event.?type|tipo|type|evento|transi/],["prio",/prior|severi/],["desc",/descri|message|mensagem|texto|comment|coment/],["oper",/operator|operador|user|usu/]];
  F.forEach(([k,re])=>{let j=-1;if(k==="time"){let bs=0;h.forEach((x,i)=>{if(used.has(i))return;const sc=rows.slice(0,60).filter(r=>!isNaN(toTime(r[i]))).length+(re.test(x)?5:0);if(sc>bs){bs=sc;j=i}})}else j=h.findIndex((x,i)=>!used.has(i)&&re.test(x));map[k]=j;if(j>=0)used.add(j)});return map}
function alarmStats(all,cols){const hi=headerRow(all),head=all[hi].map(x=>String(x??"").trim()),rows=all.slice(hi+1),m=guessCols(head,rows);
  if(cols)Object.entries(cols).forEach(([k,v])=>{const j=head.findIndex(h=>h.toLowerCase()===String(v).toLowerCase());if(j>=0)m[k]=j});
  if(m.time<0||m.tag<0)throw new Error("não encontrei as colunas de horário e de tag. Colunas: "+head.join(", "));
  const ev=[];for(const r of rows){const t=toTime(r[m.time]);if(isNaN(t))continue;const tag=String(r[m.tag]??"").trim();if(!tag)continue;ev.push({t,tag,kind:alKind(m.state>=0?r[m.state]:null),desc:m.desc>=0?String(r[m.desc]??""):"",oper:m.oper>=0?String(r[m.oper]??""):"",prio:m.prio>=0?String(r[m.prio]??""):""})}
  if(ev.length<5)throw new Error("poucas linhas com horário válido");ev.sort((a,b)=>a.t-b.t);const t0=ev[0].t,t1=ev[ev.length-1].t,span=Math.max(36e5,t1-t0),nd=span/DAY;
  const al=ev.filter(e=>e.kind==="alm"),op=ev.filter(e=>e.kind==="opr"),B=Math.ceil(span/6e5)+1,bk=new Array(B).fill(0);al.forEach(e=>bk[Math.floor((e.t-t0)/6e5)]++);let peak=0,flood=0;bk.forEach(c=>{if(c>peak)peak=c;if(c>10)flood++});
  const by={};al.forEach(e=>{const o=by[e.tag]||(by[e.tag]={tag:e.tag,n:0,desc:e.desc,times:[]});o.n++;o.times.push(e.t);if(!o.desc&&e.desc)o.desc=e.desc});const tags=Object.values(by).sort((a,b)=>b.n-a.n);
  tags.forEach(o=>{let c=0;for(let i=2;i<o.times.length;i++)if(o.times[i]-o.times[i-2]<=6e4)c++;o.chat=c;delete o.times});
  const last={};ev.forEach(e=>{if(e.kind==="alm"||e.kind==="rtn")last[e.tag]=e});const hasRtn=ev.some(e=>e.kind==="rtn"),standing=hasRtn?Object.values(last).filter(e=>e.kind==="alm"&&t1-e.t>DAY).map(e=>({tag:e.tag,desc:e.desc,desde:fmtBR(e.t)})):[];
  const ot={};op.forEach(e=>{const o=ot[e.tag]||(ot[e.tag]={tag:e.tag,n:0,desc:e.desc,ops:new Set()});o.n++;if(e.oper)o.ops.add(e.oper)});const opTop=Object.values(ot).sort((a,b)=>b.n-a.n).slice(0,12).map(o=>({tag:o.tag,desc:o.desc,n:o.n,operadores:o.ops.size}));
  const hrA=new Array(24).fill(0),hrO=new Array(24).fill(0);al.forEach(e=>hrA[new Date(e.t).getHours()]++);op.forEach(e=>hrO[new Date(e.t).getHours()]++);
  const top10=tags.slice(0,10).reduce((s,x)=>s+x.n,0);
  return {periodo:{de:fmtBR(t0),ate:fmtBR(t1),dias:+nd.toFixed(1)},linhas:ev.length,alarmes:al.length,intervencoes:op.length,por_dia:+(al.length/nd).toFixed(1),por_10min:+(al.length/(span/6e5)).toFixed(2),inundacao_pct:+(flood/B*100).toFixed(2),pico_10min:peak,
    top10_pct:al.length?+(top10/al.length*100).toFixed(1):0,tags_com_alarme:tags.length,piores:tags.slice(0,15),repetitivos:tags.filter(o=>o.chat>0).sort((a,b)=>b.chat-a.chat).slice(0,10).map(o=>({tag:o.tag,episodios:o.chat})),permanentes:standing.slice(0,15),
    intervencoes_por_tag:opTop,alarmes_por_hora:hrA,intervencoes_por_hora:hrO,colunas:Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v>=0?head[v]:null]))}}
function loopStats(all,sel){const hi=headerRow(all),head=all[hi].map(x=>String(x??"").trim()),body=all.slice(hi+1),hl=head.map(h=>h.toLowerCase());
  let tc=-1,bs=0;head.forEach((_,i)=>{const s=body.slice(0,60).filter(r=>!isNaN(toTime(r[i]))).length;if(s>bs){bs=s;tc=i}});if(tc<0)throw new Error("não achei a coluna de horário");
  const tagC=hl.findIndex((h,i)=>i!==tc&&/tagname|^tag|ponto|^name|nome/.test(h)),valC=hl.findIndex((h,i)=>i!==tc&&/^value|valor|^vvalue/.test(h));const cols={};let T=[];
  if(tagC>=0&&valC>=0){const per={};body.forEach(r=>{const t=toTime(r[tc]),g=String(r[tagC]||"").trim();if(isNaN(t)||!g)return;(per[g]||(per[g]=[])).push([t,r[valC]])});const names=Object.keys(per);names.forEach(n=>per[n].sort((a,b)=>a[0]-b[0]));
    const ref=names.reduce((a,b)=>per[a].length>=per[b].length?a:b);T=per[ref].map(x=>x[0]);names.forEach(n=>{const a=per[n];let j=0,l=NaN;cols[n]=T.map(t=>{while(j<a.length&&a[j][0]<=t){l=a[j][1];j++}return l})})}
  else{const ok=body.filter(r=>!isNaN(toTime(r[tc]))).sort((a,b)=>toTime(a[tc])-toTime(b[tc]));T=ok.map(r=>toTime(r[tc]));head.forEach((h,i)=>{if(i!==tc)cols[h||"coluna "+(i+1)]=ok.map(r=>r[i])})}
  const names=Object.keys(cols),pick=(v,re)=>{if(v){const k=names.find(n=>n.toLowerCase()===String(v).toLowerCase())||names.find(n=>n.toLowerCase().includes(String(v).toLowerCase()));if(k)return k}return re?names.find(n=>re.test(n.toLowerCase())):null};
  const kPV=pick(sel.pv,/(^|[._\s])pv($|[._\s])|medi|process/)||names[0],kSP=pick(sel.sp,/(^|[._\s])sp($|[._\s])|setpoint/),kO=pick(sel.saida,/(^|[._\s])(out|op|mv|cv)($|[._\s])|sa[ií]da|output/),kM=pick(sel.modo,/mode|modo/);
  const pv=cols[kPV].map(toNum),sp=kSP?cols[kSP].map(toNum):null,ou=kO?cols[kO].map(toNum):null,mo=kM?cols[kM]:null,idx=[];for(let i=0;i<T.length;i++)if(isFinite(pv[i])&&(!sp||isFinite(sp[i]))&&(!ou||isFinite(ou[i])))idx.push(i);
  if(idx.length<30)throw new Error("poucos pontos válidos ("+idx.length+")");const P=idx.map(i=>pv[i]),TT=idx.map(i=>T[i]),mP=P.reduce((a,b)=>a+b,0)/P.length,SP=sp?idx.map(i=>sp[i]):P.map(()=>mP),O=ou?idx.map(i=>ou[i]):null;
  const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))]},mSP=SP.reduce((a,b)=>a+b,0)/SP.length,span=+sel.faixa>0?+sel.faixa:Math.max(1e-6,Math.max(q(P,.99),q(SP,.99))-Math.min(q(P,.01),q(SP,.01)),Math.abs(mSP)*.05);
  const Pf=[];P.forEach((v,i)=>Pf.push(i?Pf[i-1]+.2*(v-Pf[i-1]):v));const E=P.map((v,i)=>SP[i]-v),Ef=Pf.map((v,i)=>SP[i]-v);
  const iae=E.reduce((s,e)=>s+Math.abs(e),0)/E.length/span*100,sd=Math.sqrt(E.reduce((s,e)=>s+e*e,0)/E.length)/span*100,inBand=E.filter(e=>Math.abs(e)<=.02*span).length/E.length*100;
  const durs=[];let st=0,pk=0;for(let i=1;i<Ef.length;i++){pk=Math.max(pk,Math.abs(Ef[i]));if(Ef[i]!==0&&Math.sign(Ef[i])!==Math.sign(Ef[i-1])){if(pk>.01*span&&TT[i]>TT[st])durs.push(TT[i]-TT[st]);st=i;pk=0}}
  const mean=durs.reduce((a,b)=>a+b,0)/(durs.length||1),cv=durs.length>1?Math.sqrt(durs.reduce((s,d)=>s+(d-mean)**2,0)/durs.length)/mean:1,hours=(TT[TT.length-1]-TT[0])/36e5;
  const osc=durs.length>=10&&cv<.5?`sustentada, período ~${fmtDur(2*mean)}`:durs.length>=10?"perturbações frequentes":"sem oscilação relevante";
  let sat=null,trv=null,rev=null,fro=null;if(O){let a=Infinity,b=-Infinity;O.forEach(v=>{if(v<a)a=v;if(v>b)b=v});const pct=a>=-1&&b<=101,lo=pct?0:a,os=Math.max(1e-9,(pct?100:b)-lo);sat=O.filter(v=>v>=lo+.98*os||v<=lo+.02*os).length/O.length*100;
    let tr=0,rv=0,dir=0;for(let i=1;i<O.length;i++){const d=O[i]-O[i-1];tr+=Math.abs(d);if(Math.abs(d)>.002*os){const s=Math.sign(d);if(dir&&s!==dir)rv++;dir=s}}const dd=Math.max(hours/24,1/24);trv=tr/os*100/dd;rev=rv/dd;let fr=0;for(let i=1;i<O.length;i++)if(O[i]===O[i-1]&&Math.abs(E[i])>.02*span)fr++;fro=fr/O.length*100}
  let man=null,modos=null;if(mo){const mv=idx.map(i=>String(mo[i])),c={};mv.forEach(v=>c[v]=(c[v]||0)+1);modos=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,n])=>`${k}: ${(n/mv.length*100).toFixed(0)}%`).join(" · ");const mm=mv.filter(v=>/man|^m$|local|hand/i.test(v)).length;if(mm)man=mm/mv.length*100}
  const stp=Math.max(1,Math.ceil(TT.length/700)),serie=[];for(let i=0;i<TT.length;i+=stp)serie.push([TT[i],+P[i].toFixed(4),sp?+SP[i].toFixed(4):null,O?+O[i].toFixed(3):null]);
  const amostra=[];const s2=Math.max(1,Math.ceil(TT.length/200));for(let i=0;i<TT.length;i+=s2)amostra.push([fmtBR(TT[i]).slice(0,16),+P[i].toFixed(3),sp?+SP[i].toFixed(3):null,O?+O[i].toFixed(2):null]);
  return {colunas:{pv:kPV,sp:kSP,saida:kO,modo:kM,disponiveis:names.slice(0,40)},pontos:TT.length,horas:+hours.toFixed(1),faixa:+fmtNum(span),iae_pct:+iae.toFixed(2),desvio_pct:+sd.toFixed(2),dentro_2pct:+inBand.toFixed(0),oscilacao:osc,meio_ciclos:durs.length,
    saturacao_pct:sat&&+sat.toFixed(1),curso_valvula_pct_dia:trv&&Math.round(trv),reversoes_dia:rev&&Math.round(rev),saida_parada_com_erro_pct:fro&&+fro.toFixed(1),manual_pct:man&&+man.toFixed(1),modos,serie,amostra}}

/* ======================= CLP ======================= */
function plcAnalyzeFiles(files){PLC.units=[];PLC.decl={};PLC.routines=new Set();
  for(const f of files){f.fmt=detectFmt(f.name,f.text);try{if(f.fmt==="Rockwell L5X")parseL5X(f);else if(f.fmt==="PLCopen XML")parsePLCopen(f);else if(f.fmt==="Siemens TIA Openness XML")parseTIA(f);else parseText(f)}catch(e){PLC.units.push({name:f.name,lang:"txt",text:f.text.slice(0,200000),src:f.name})}}
  PLC.fmt=[...new Set(files.map(f=>f.fmt))].join(" + ");const U=PLC.units,iss=[],add=(sev,regra,local,detalhe)=>iss.push({sev,regra,local,detalhe});const ins={},coils={},latch={},unlatch={},timers={},jsr=[];
  U.filter(u=>u.lang==="rung").forEach(u=>{const re=/\b([A-Z][A-Z0-9_]{1,15})\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;let m;while((m=re.exec(u.text))){const mn=m[1],op=m[2].split(",")[0].trim();ins[mn]=(ins[mn]||0)+1;
      if(mn==="OTE")(coils[op]||(coils[op]=[])).push(u.name);if(mn==="OTL")(latch[op]||(latch[op]=[])).push(u.name);if(mn==="OTU")(unlatch[op]||(unlatch[op]=[])).push(u.name);if(/^(TON|TOF|RTO|CTU|CTD|TONR|TOFR)$/.test(mn))(timers[op]||(timers[op]=[])).push(u.name+" ("+mn+")");if(mn==="JSR")jsr.push({r:op,u:u.name})}
    if(/\bAFI\(\)/.test(u.text))add("média","Rung desabilitado (AFI)",u.name,"Linha sempre falsa.")});
  U.filter(u=>u.lang==="awl"||u.lang==="il").forEach(u=>stripComments(u.text).split(/\n/).forEach(l=>{let m=l.match(/^\s*(=|OUT)\s+([^\s;\/]+)/i);if(m)(coils[m[2]]||(coils[m[2]]=[])).push(u.name);m=l.match(/^\s*(S|SET)\s+([^\s;\/]+)/i);if(m)(latch[m[2]]||(latch[m[2]]=[])).push(u.name);m=l.match(/^\s*(R|RST)\s+([^\s;\/]+)/i);if(m)(unlatch[m[2]]||(unlatch[m[2]]=[])).push(u.name)}));
  Object.entries(coils).forEach(([o,us])=>{if(us.length>1)add("alta","Bobina dupla",us.slice(0,4).join(" · "),`${o} escrito como saída em ${us.length} lugares; só a última escrita vale.`)});
  Object.keys(latch).forEach(o=>{if(!unlatch[o])add("média","Selo sem reset",latch[o][0],`${o} é setado e nunca resetado.`);if(coils[o])add("alta","Saída comum e retentiva misturadas",latch[o][0],`${o} recebe saída comum e set.`)});
  Object.entries(timers).forEach(([o,us])=>{if(us.length>1)add("alta","Temporizador ou contador reutilizado",us.slice(0,3).join(" · "),`${o} usado em ${us.length} instruções.`)});
  jsr.forEach(j=>{if(PLC.routines.size&&!PLC.routines.has(j.r))add("alta","Chamada para rotina inexistente",j.u,`JSR para ${j.r}, ausente no que foi carregado.`)});
  const asg={};U.filter(u=>u.lang==="st").forEach(u=>{const code=stripComments(u.text).replace(/\bVAR[\s\S]*?\bEND_VAR\b/gi,"");let m;const re=/(^|[;\n]|\bTHEN\b|\bELSE\b|\bDO\b)\s*([#"]?[A-Za-z_][\w."#\[\]]*)\s*:=/g;while((m=re.exec(code))){const v=m[2].replace(/[#"]/g,"");(asg[v]||(asg[v]=new Set())).add(u.name)}
    const dre=/\/\s*([#"]?[A-Za-z_][\w."#]*)/g,seen=new Set();let d;while((d=dre.exec(code))){const v=d[1].replace(/[#"]/g,"");if(seen.has(v))continue;seen.add(v);const e=reEsc(v);if(!new RegExp(e+"\\s*(<>|>|<|=)\\s*0|0\\s*(<>|<|>)\\s*"+e).test(code))add("média","Divisão sem proteção",u.name,`Divisão por ${v} sem teste de zero.`)}
    const cmp=code.replace(/:=/g,"≔");Object.entries(PLC.decl).forEach(([n,dd])=>{if(/^(L?REAL|FLOAT)/i.test(dd.type)&&new RegExp("[#\"]?\\b"+reEsc(n)+"\\b\"?\\s*=(?!=)").test(cmp))add("média","Igualdade com número real",u.name,`${n} é ${dd.type}; use faixa de tolerância.`)})});
  Object.entries(asg).forEach(([v,us])=>{if(us.size>1)add("média","Escrita em vários blocos",[...us].slice(0,4).join(" · "),`${v} escrito em ${us.size} blocos.`)});
  const used=new Set((U.map(u=>u.text.replace(/\bVAR[\s\S]*?\bEND_VAR\b/gi,"")).join(" ").match(/[A-Za-z_]\w*/g)||[])),dn=Object.keys(PLC.decl),unused=dn.filter(n=>!used.has(n)&&!used.has(n.split(".")[0]));
  if(unused.length)add("baixa","Declarado e não usado na lógica",`${unused.length} de ${dn.length}`,unused.slice(0,25).join(", ")+". Podem ser usados pela IHM; confirme antes de apagar.");
  let excerpt="";for(const u of U){const p=`\n### ${u.name} [${u.lang}]${u.comment?" // "+u.comment.slice(0,150):""}\n${u.text}\n`;if(excerpt.length+p.length>60000)break;excerpt+=p}
  return {formato:PLC.fmt,unidades:U.length,rungs:U.filter(u=>u.lang==="rung").length,declaracoes:dn.length,rotinas:PLC.routines.size,instrucoes:Object.entries(ins).sort((a,b)=>b[1]-a[1]).slice(0,10),achados:iss,trecho_codigo:excerpt}}

/* ======================= CAD ======================= */
function cadPrepare(M){M.parametros=(Array.isArray(M.parametros)?M.parametros:[]).filter(p=>p&&p.nome!=null);
  M.features=(Array.isArray(M.features)?M.features:[]).map(f=>({...f,op:OPMAP[String(f.op||"").toLowerCase()]||String(f.op||"")})).filter(f=>SOLID.has(f.op)||CUT.has(f.op));
  M.parametros.forEach(p=>{let n=String(p.nome).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\W/g,"_");if(!/^[A-Za-z_]/.test(n))n="p_"+n;p.nome=n});
  M.features.forEach(f=>{f.eixo=(String(f.eixo||"z").toLowerCase().match(/[xyz]/)||["z"])[0]});return M}
function cadResolve(M){const P={};let err="",feats=[];try{M.parametros.forEach(p=>{P[p.nome]=evalExpr(p.valor,P)});const num=v=>evalExpr(v,P);
    feats=M.features.map(f=>{const o={op:f.op,eixo:f.eixo||"z"};["d","h","w","p","x","y","z","pcd","n","angulo0"].forEach(k=>{if(f[k]!==undefined&&f[k]!==null&&f[k]!=="")o[k]=num(f[k])});["x","y","z","angulo0"].forEach(k=>{if(o[k]===undefined)o[k]=0});if(Array.isArray(f.perfil))o.perfil=f.perfil.map(q=>[Math.max(0,num(q[0])),num(q[1])]);if(o.n!=null)o.n=Math.max(1,Math.round(o.n));return o});
    const bad=feats.find(o=>(o.op==="revolucao"&&!(o.perfil&&o.perfil.length>=3))||(["cilindro","furo"].includes(o.op)&&!(o.d>0&&o.h>0))||(["caixa","rasgo"].includes(o.op)&&!(o.w>0&&o.p>0&&o.h>0))||(o.op==="furos_circulares"&&!(o.d>0&&o.h>0&&o.pcd>0)));if(bad)throw new Error(`operação ${bad.op} com medidas incompletas`);if(!feats.length)throw new Error("nenhuma operação válida")}catch(e){err=e.message}
  return {feats,err}}
function withCad(M,feats,fn){const pm=CAD.model,pf=CAD.feats;CAD.model=M;CAD.feats=feats;try{return fn()}finally{CAD.model=pm;CAD.feats=pf}}
async function render3D(el,feats){if(!feats.length){el.innerHTML="";return}try{await loadScript("vendor/three.min.js")}catch(e){el.innerHTML=`<p class="note">Não consegui carregar o 3D.</p>`;return}
  el.innerHTML="";const W=el.clientWidth||600,H=el.clientHeight||320,cs=getComputedStyle(document.documentElement),col=n=>new THREE.Color((cs.getPropertyValue(n)||"#888").trim()||"#888");let ren;
  try{ren=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){el.innerHTML=`<p class="note">Este navegador não liberou o 3D.</p>`;return}ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(W,H);el.append(ren.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(35,W/H,.1,1e6);cam.up.set(0,0,1);scene.add(new THREE.HemisphereLight(0xffffff,0x777777,.9));const dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(1,-1.5,2);scene.add(dl);
  const dark=document.documentElement.style.colorScheme==="dark"||cs.colorScheme==="dark";const matS=new THREE.MeshStandardMaterial({color:new THREE.Color(dark?"#BDBDBD":"#D9D9D9"),metalness:.35,roughness:.5,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}),matH=new THREE.MeshStandardMaterial({color:new THREE.Color(dark?"#FFFFFF":"#111111"),roughness:.9}),matL=new THREE.LineBasicMaterial({color:col("--fg")});
  const g0=new THREE.Group(),add=(g,cut)=>{g0.add(new THREE.Mesh(g,cut?matH:matS));if(!cut)g0.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,25),matL))};
  const cyl=f=>{const g=new THREE.CylinderGeometry(f.d/2,f.d/2,f.h,48);if(f.eixo==="x"){g.rotateZ(-Math.PI/2);g.translate(f.x+f.h/2,f.y,f.z)}else if(f.eixo==="y")g.translate(f.x,f.y+f.h/2,f.z);else{g.rotateX(Math.PI/2);g.translate(f.x,f.y,f.z+f.h/2)}return g};
  feats.forEach(f=>{const cut=CUT.has(f.op);if(f.op==="revolucao"){const pts=f.perfil.map(q=>new THREE.Vector2(q[0],q[1]));pts.push(pts[0].clone());const g=new THREE.LatheGeometry(pts,72);g.rotateX(Math.PI/2);add(g,false)}
    else if(f.op==="cilindro"||f.op==="furo")add(cyl({...f,h:f.h*(cut?1.01:1)}),cut);else if(f.op==="caixa"||f.op==="rasgo"){const g=new THREE.BoxGeometry(f.w,f.p,f.h);g.translate(f.x,f.y,f.z+f.h/2);add(g,cut)}
    else if(f.op==="furos_circulares")for(let i=0;i<f.n;i++){const a=(f.angulo0+i*360/f.n)*Math.PI/180;add(cyl({d:f.d,h:f.h*1.01,x:f.pcd/2*Math.cos(a),y:f.pcd/2*Math.sin(a),z:f.z-f.h*.005,eixo:"z"}),true)}});
  scene.add(g0);const box=new THREE.Box3().setFromObject(g0),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()).length()||100;let th=-1,ph=1.05,dist=sz*1.6;
  const place=()=>{cam.position.set(c.x+dist*Math.sin(ph)*Math.cos(th),c.y+dist*Math.sin(ph)*Math.sin(th),c.z+dist*Math.cos(ph));cam.lookAt(c);ren.render(scene,cam)};place();
  let dr=null;const cv=ren.domElement;cv.style.touchAction="none";cv.addEventListener("pointerdown",e=>{dr={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});cv.addEventListener("pointermove",e=>{if(!dr)return;th-=(e.clientX-dr.x)*.01;ph=Math.min(Math.PI-.05,Math.max(.05,ph-(e.clientY-dr.y)*.01));dr={x:e.clientX,y:e.clientY};place()});
  cv.addEventListener("pointerup",()=>dr=null);cv.addEventListener("wheel",e=>{e.preventDefault();dist*=e.deltaY>0?1.1:.9;place()},{passive:false})}
function saveBlob(name,data,type="text/plain"){const b=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}

/* ======================= GRÁFICOS ======================= */
function relSVG(curve,maxD,insp){const W=720,H=170,ml=40,mr=10,mt=10,mb=24,X=d=>ml+d/maxD*(W-ml-mr),Y=r=>mt+(1-r)*(H-mt-mb);let s="";
  [0,.25,.5,.75,1].forEach(r=>s+=`<line x1="${ml}" x2="${W-mr}" y1="${Y(r)}" y2="${Y(r)}" stroke="var(--line)"/><text x="${ml-5}" y="${Y(r)+3}" text-anchor="end">${r*100}%</text>`);
  const pts=curve.map(([d,r])=>`${X(d).toFixed(1)},${Y(r).toFixed(1)}`).join(" ");s+=`<polygon points="${ml},${Y(0)} ${pts} ${W-mr},${Y(0)}" fill="var(--fg)" opacity=".07"/><polyline points="${pts}" fill="none" stroke="var(--fg)" stroke-width="2"/>`;
  if(insp&&insp<maxD)s+=`<line x1="${X(insp)}" x2="${X(insp)}" y1="${mt}" y2="${H-mb}" stroke="var(--fg)" stroke-dasharray="3 3"/><text x="${X(insp)+4}" y="${mt+10}">inspecionar</text>`;
  for(let i=0;i<=5;i++){const d=maxD*i/5;s+=`<text x="${X(d)}" y="${H-6}" text-anchor="${i?i===5?"end":"middle":"start"}">+${Math.round(d)} d</text>`}
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px">${s}</svg>`}
function barsSVG(vals,labels,vals2){const W=720,H=150,ml=34,mr=8,mt=8,mb=22,n=vals.length,mx=Math.max(1,...vals,...(vals2||[])),bw=(W-ml-mr)/n;let s="";
  for(let i=0;i<=3;i++){const y=mt+i*(H-mt-mb)/3;s+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${ml-4}" y="${y+3}" text-anchor="end">${Math.round(mx*(1-i/3))}</text>`}
  vals.forEach((v,i)=>{const h=(H-mt-mb)*v/mx,w=vals2?bw*.4:bw*.75;s+=`<rect x="${ml+i*bw+bw*.1}" y="${H-mb-h}" width="${w}" height="${h}" fill="var(--fg)"/>`;if(vals2){const h2=(H-mt-mb)*vals2[i]/mx;s+=`<rect x="${ml+i*bw+bw*.5}" y="${H-mb-h2}" width="${w}" height="${h2}" fill="none" stroke="var(--fg)"/>`}
    if(i%Math.ceil(n/12)===0)s+=`<text x="${ml+i*bw+bw/2}" y="${H-6}" text-anchor="middle">${labels[i]}</text>`});return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px">${s}</svg>`}
function lineSVG(serie,k,label,dash){const W=720,H=150,ml=48,mr=8,mt=14,mb=22,v=serie.map(r=>r[k]).filter(x=>x!=null&&isFinite(x));if(!v.length)return "";let lo=Math.min(...v),hi=Math.max(...v);if(hi-lo<1e-9){hi+=1;lo-=1}const p=(hi-lo)*.06;lo-=p;hi+=p;
  const t0=serie[0][0],t1=serie[serie.length-1][0],X=t=>ml+(t-t0)/Math.max(1,t1-t0)*(W-ml-mr),Y=y=>mt+(1-(y-lo)/(hi-lo))*(H-mt-mb);let s="";
  for(let i=0;i<=3;i++){const y=lo+(hi-lo)*i/3;s+=`<line x1="${ml}" x2="${W-mr}" y1="${Y(y)}" y2="${Y(y)}" stroke="var(--line)"/><text x="${ml-4}" y="${Y(y)+3}" text-anchor="end">${fmtNum(y)}</text>`}
  const path=ks=>{let d="";serie.forEach(r=>{if(r[ks]==null||!isFinite(r[ks]))return;d+=(d?"L":"M")+X(r[0]).toFixed(1)+","+Y(r[ks]).toFixed(1)});return d};
  s+=`<path d="${path(k)}" fill="none" stroke="var(--fg)" stroke-width="1.3"/>`;if(dash!=null)s+=`<path d="${path(dash)}" fill="none" stroke="var(--fg)" stroke-dasharray="5 3" stroke-width="1.2" opacity=".7"/>`;
  s+=`<text x="${ml+4}" y="10">${esc(label)}</text>`;for(let i=0;i<=3;i++){const t=t0+(t1-t0)*i/3;s+=`<text x="${X(t)}" y="${H-6}" text-anchor="${i?i===3?"end":"middle":"start"}">${fmtBR(t).slice(0,16)}</text>`}
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px">${s}</svg>`}

/* ======================= CARTÕES ======================= */
const kpi=(a,b,c)=>`<div><small>${a}</small><strong>${b}</strong>${c?`<em>${c}</em>`:""}</div>`;
function card(title,inner,acts=""){const el=document.createElement("section");el.className="card";el.innerHTML=`<header><b>${esc(title)}</b><div class="acts">${acts}</div></header>${inner}`;return el}
const CARDS={
  sim:d=>simCard(d),
  previsao(d){const pct=x=>Math.round(x*100)+"%";return card("Previsão de falha · "+d.nome,`<div class="kpis">${kpi("Risco",`<span class="risk r${d.nivel}">${d.risco}</span>`,pct(d.prob.d30)+" em 30 dias")}${kpi("P10 · cedo",brDate(d.datas.p10),"+"+d.dias.p10+" dias")}${kpi("P50 · mediana",brDate(d.datas.p50),"+"+d.dias.p50+" dias")}${kpi("P90 · tarde",brDate(d.datas.p90),"+"+d.dias.p90+" dias")}</div>
    <div class="chart">${relSVG(d.curve,d.maxD,d.inspecionar_em_dias)}</div><div class="kpis">${kpi("Inspecionar em até",d.inspecionar_em_dias+" dias")}${kpi("Forma β",d.beta,d.beta_mle?"histórico "+d.beta_mle:"referência")}${kpi("Vida η",fmtH(d.eta_h),"fator ambiente "+d.fator_ambiente+"×")}${kpi("Histórico",d.vidas_completas+" vidas",d.suspensoes+" interrompidas")}</div>
    <p class="note">${esc(d.tipo_nome)} · idade ${fmtH(d.idade_h)} · modelos: ${d.modelos.map(m=>esc(m.nome)+" "+Math.round(m.peso*100)+"%").join(", ")}. Estimativa probabilística: 50% de chance de falhar antes do P50.</p>`)},
  fontes(d){return card(`Base da planta · ${d.itens.length} resultado(s)`,`<div class="scroll">${d.itens.map(r=>`<div class="src"><b>${esc(r.origem==="evento"?(r.data?brDate(r.data)+" · ":"")+(r.tipo_evento||"evento")+(r.equipamento?" · "+r.equipamento:""):r.nome||"arquivo")}</b>${r.caminho?`<div class="p">${esc(r.caminho)}${r.pagina?" · p."+r.pagina:""}</div>`:""}<q>${esc(String(r.texto||"").slice(0,260))}</q></div>`).join("")||`<div class="src">Nada encontrado para “${esc(d.consulta)}”.</div>`}</div>`)},
  biblioteca(d){const T={artigo:"Artigo",livro:"Livro",enciclopedia:"Enciclopédia"};return card(`Biblioteca aberta · ${d.itens.length} resultado(s)`,`<div class="scroll">${d.itens.map(r=>`<div class="src"><b>${esc(r.titulo)}</b><div class="p">${esc(T[r.tipo]||r.tipo)} · ${esc(r.fonte)}${r.ano?" · "+esc(r.ano):""}${r.autores?" · "+esc(String(r.autores).slice(0,90)):""}</div>${r.resumo?`<q>${esc(String(r.resumo).slice(0,240))}</q>`:""}<div class="p">${r.url_pagina?`<a href="${esc(r.url_pagina)}" target="_blank" rel="noopener">abrir página</a>`:""}${r.url_leitura&&r.url_leitura!==r.url_pagina?` · <a href="${esc(r.url_leitura)}" target="_blank" rel="noopener">texto completo</a>`:""}</div></div>`).join("")||`<div class="src">Nada encontrado para “${esc(d.consulta)}”.</div>`}</div>`)},
  historico(d){return card(`Histórico · ${d.equipamento}`,`<div class="kpis">${kpi("Eventos",d.total)}${kpi("Falhas e trocas",d.falhas_trocas)}${kpi("Intervalo médio",d.intervalo_medio_dias?d.intervalo_medio_dias+" dias":"—")}</div><div class="scroll"><table class="tbl"><tr><th>Data</th><th>Tipo</th><th>Relato</th></tr>${d.eventos.map(e=>`<tr><td class="n">${brDate(e.data)}</td><td>${esc(e.tipo_evento||"")}</td><td>${esc(e.texto||"")}</td></tr>`).join("")}</table></div>`)},
  enxame(d){const el=card("Enxame de especialistas",`<div class="agents">${d.agentes.map(a=>`<div data-ag="${a.k}"><b>${esc(a.n)}</b><span>${esc(a.status||"na fila")}</span></div>`).join("")}</div>`);return el},
  alarmes(d){return card("Alarmes e eventos · ISA-18.2",`<div class="kpis">${kpi("Alarmes por dia",d.por_dia,"meta ~150")}${kpi("Por 10 min",d.por_10min,"meta ~1")}${kpi("Em inundação",d.inundacao_pct+"%","meta < 1%")}${kpi("10 piores tags",d.top10_pct+"%","da carga")}${kpi("Repetitivos",d.repetitivos.length)}${kpi("Intervenções",d.intervencoes)}</div>
    <div class="chart">${barsSVG(d.alarmes_por_hora,[...Array(24).keys()].map(String),d.intervencoes_por_hora)}</div><p class="note" style="border-top:0;padding-top:0">Barras cheias: alarmes por hora do dia. Contorno: intervenções do operador.</p>
    <div class="scroll"><table class="tbl"><tr><th>Tag</th><th>Descrição</th><th>Ativações</th><th>Repetições</th></tr>${d.piores.slice(0,12).map(o=>`<tr><td>${esc(o.tag)}</td><td>${esc(o.desc)}</td><td class="n">${o.n}</td><td class="n">${o.chat||""}</td></tr>`).join("")}</table></div><p class="note">Período ${esc(d.periodo.de)} a ${esc(d.periodo.ate)} · ${d.linhas} linhas.</p>`)},
  malha(d){return card("Malha de controle · "+(d.colunas.pv||""),`<div class="kpis">${kpi("Erro médio",d.iae_pct+"%","da faixa")}${kpi("Dentro de ±2%",d.dentro_2pct+"%")}${kpi("Oscilação",esc(d.oscilacao))}${d.saturacao_pct!=null?kpi("Saturação",d.saturacao_pct+"%"):""}${d.curso_valvula_pct_dia!=null?kpi("Curso da válvula",d.curso_valvula_pct_dia+"%/dia"):""}${d.reversoes_dia!=null?kpi("Reversões",d.reversoes_dia+"/dia"):""}${d.manual_pct!=null?kpi("Em manual",d.manual_pct+"%"):""}</div>
    <div class="chart">${lineSVG(d.serie,1,"PV (linha) e SP (tracejado)",d.colunas.sp?2:null)}</div>${d.colunas.saida?`<div class="chart">${lineSVG(d.serie,3,"Saída do controlador")}</div>`:""}<p class="note">${d.pontos} pontos em ${d.horas} h · faixa ${d.faixa}.</p>`)},
  clp(d){return card(`CLP · ${d.formato}`,`<div class="kpis">${kpi("Unidades",d.unidades)}${kpi("Rungs",d.rungs)}${kpi("Declarações",d.declaracoes)}${kpi("Achados",d.achados.length)}</div><div class="scroll"><table class="tbl"><tr><th>Sev.</th><th>Achado</th><th>Local</th><th>Detalhe</th></tr>${d.achados.map(i=>`<tr><td><span class="risk r${i.sev==="alta"?3:i.sev==="média"?2:0}">${esc(i.sev)}</span></td><td>${esc(i.regra)}</td><td>${esc(i.local)}</td><td>${esc(i.detalhe)}</td></tr>`).join("")||`<tr><td colspan="4">Nenhum achado pelas regras automáticas.</td></tr>`}</table></div>`)},
  cad(d){const M=cadPrepare(JSON.parse(JSON.stringify(d.modelo)));const el=card("Peça · "+(M.nome||"modelo"),`<div class="cad3d"></div><div class="chart cad2"></div><div class="params"></div><p class="note"></p>`,`<button class="btn" data-x="scad">OpenSCAD</button><button class="btn" data-x="py">CadQuery</button><button class="btn" data-x="dxf">DXF</button><button class="btn" data-x="svg">SVG</button>`);
    const draw=()=>{const {feats,err}=cadResolve(M);el.querySelector(".cad2").innerHTML=err?`<p class="note">${esc(err)}</p>`:withCad(M,feats,()=>cadSVG(false));if(!err)render3D(el.querySelector(".cad3d"),feats);el._f=feats;el._e=err};
    el.querySelector(".params").innerHTML=M.parametros.map((p,i)=>`<label>${esc(p.nome)}<input data-i="${i}" value="${esc(p.valor)}" class="${p.origem==="estimado"?"est":""}" title="${esc(p.descricao||"")}"></label>`).join("");
    el.querySelector(".note").innerHTML=`${esc(M.material_sugerido||"")}${M.material_sugerido?" · ":""}Tracejado: cota estimada, medir antes de usinar.${(M.medidas_faltantes||[]).length?" Faltam: "+M.medidas_faltantes.map(esc).join("; "):""}`;
    el.querySelector(".params").addEventListener("change",e=>{const i=e.target.dataset.i;if(i==null)return;const v=e.target.value.trim();M.parametros[+i].valor=/^-?\d+([.,]\d+)?$/.test(v)?+v.replace(",","."):v;M.parametros[+i].origem="medido";e.target.classList.remove("est");draw()});
    el.addEventListener("click",e=>{const k=e.target.dataset.x;if(!k)return;if(el._e)return;const base=(M.nome||"peca").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\W+/g,"_").toLowerCase().slice(0,40);
      withCad(M,el._f,()=>{if(k==="scad")saveBlob(base+".scad",toSCAD());if(k==="py")saveBlob(base+"_cadquery.py",toCQ());if(k==="dxf")saveBlob(base+".dxf",toDXF(),"application/dxf");if(k==="svg")saveBlob(base+".svg",cadSVG(true),"image/svg+xml")})});
    setTimeout(draw,30);return el}};
const fmtH=h=>h>=1e4?(h/1e3).toFixed(0)+" mil h":Math.round(h).toLocaleString("pt-BR")+" h";
const brDate=s=>{const d=parseDate(s);return d?d.toLocaleDateString("pt-BR"):"—"};

/* ======================= FERRAMENTAS DA IA ======================= */
const TOOLS=[
 {name:"buscar_base",description:"Busca no arquivo técnico da planta (manuais, desenhos, padrões, relatórios, OMs e notas importadas) e no histórico de eventos. Use sempre que o usuário citar equipamento, peça, fornecedor, número de desenho ou documento. Retorna trechos com o caminho do arquivo.",input_schema:{type:"object",properties:{consulta:{type:"string",description:"palavras-chave em português"},limite:{type:"integer"}},required:["consulta"]}},
 {name:"ler_arquivo_base",description:"Abre um arquivo da base da planta (pelo caminho que buscar_base devolveu) e lê o texto original: passe 'procurar' para trazer os trechos com esses termos, ou 'inicio' para ler em sequência.",input_schema:{type:"object",properties:{caminho:{type:"string"},procurar:{type:"string"},inicio:{type:"integer"}},required:["caminho"]}},
 {name:"historico_equipamento",description:"Lista os eventos registrados (falhas, trocas, inspeções, medições, lições) de um equipamento ou posição, em ordem cronológica, e calcula os intervalos entre falhas e trocas.",input_schema:{type:"object",properties:{equipamento:{type:"string",description:"nome, tag ou palavras que identificam a posição"}},required:["equipamento"]}},
 {name:"catalogo_componentes",description:"Consulta a base de referência de 173 tipos de componente (vida característica, forma de Weibull, modos de falha, intervalo P-F, técnicas de detecção). Use para escolher a chave 'tipo' antes de prever_falha.",input_schema:{type:"object",properties:{busca:{type:"string"}},required:["busca"]}},
 {name:"prever_falha",description:"Roda o motor de confiabilidade (Weibull bayesiano com Monte Carlo) e mostra ao usuário um cartão com P10/P50/P90, risco e curva de confiabilidade. Inclua todo histórico conhecido. Pode receber modelos dos especialistas do enxame.",input_schema:{type:"object",properties:{nome:{type:"string"},tipo:{type:"string",description:"chave do catálogo"},horas_dia:{type:"number"},carga_pct:{type:"number"},temperatura_c:{type:"number"},poeira:{type:"integer",description:"0 a 3"},umidade:{type:"integer",description:"0 a 3"},corrosao:{type:"integer",description:"0 a 3"},regime:{type:"string",enum:["corretiva","preventiva","preditiva"]},condicao:{type:"string",enum:["boa","atencao","alerta","critica","desconhecida"]},instalado_em:{type:"string",description:"AAAA-MM-DD da instalação ou última troca"},horas_desde_troca:{type:"number"},falhas:{type:"array",items:{type:"string"},description:"datas AAAA-MM-DD de falhas e trocas corretivas"},trocas_preventivas:{type:"array",items:{type:"string"}},vidas_h:{type:"array",items:{type:"number"}},vidas_interrompidas_h:{type:"array",items:{type:"number"}},modelos_especialistas:{type:"array",items:{type:"object",properties:{nome:{type:"string"},beta:{type:"number"},eta_h:{type:"number"},peso:{type:"number"}}}},vida_remanescente_h:{type:"object",properties:{nome:{type:"string"},p10:{type:"number"},p50:{type:"number"},p90:{type:"number"},peso:{type:"number"}}}},required:["tipo"]}},
 {name:"consultar_enxame",description:"Convoca o enxame de especialistas em paralelo (FMEA e mecanismos, estatístico, física de falha, preditiva, pesquisa multilíngue) e depois um crítico. Use em casos importantes ou ambíguos antes de prever_falha; os resultados trazem parâmetros para alimentar o motor.",input_schema:{type:"object",properties:{caso:{type:"string",description:"descrição completa do caso: equipamento, operação, histórico, sintomas, medições"}},required:["caso"]}},
 {name:"registrar_evento",description:"Grava na base da planta um evento datado que o usuário relatou (falha, troca, inspeção, medição, sintoma). Use sem pedir permissão quando o relato for claro e diga em uma linha o que gravou.",input_schema:{type:"object",properties:{equipamento:{type:"string"},data:{type:"string"},tipo_evento:{type:"string",enum:["falha","troca_corretiva","troca_preventiva","reparo","inspecao","medicao","sintoma","outro"]},componente:{type:"string"},modo:{type:"string"},texto:{type:"string"}},required:["equipamento","data","tipo_evento","texto"]}},
 {name:"registrar_retorno",description:"Grava um retorno de campo que treina o sistema: o que realmente falhou, o modo, a causa e a lição. Use quando o usuário contar o desfecho real ou disser que a previsão errou.",input_schema:{type:"object",properties:{equipamento:{type:"string"},data:{type:"string"},desfecho:{type:"string",enum:["falhou","defeito_em_inspecao","trocado_sem_defeito","operando"]},tipo_real:{type:"string",description:"chave do catálogo do que falhou de fato"},modo:{type:"string"},causa:{type:"string"},avaliacao_previsao:{type:"string",enum:["acertou","modo_errado","componente_errado","cedo_demais","tarde_demais","sem_previsao"]},licao:{type:"string",description:"regra curta e reutilizável, com sinais precoces"},horas_ate_falha:{type:"number",description:"horas de operação desde a instalação ou última troca até o desfecho, se souber"},regime:{type:"string",description:"condições de uso: carga, temperatura, ambiente"}},required:["equipamento","desfecho","licao"]}},
 {name:"conhecimento_global",description:"Consulta a rede Prognos: lições, modos de falha, causas e vidas reais registradas por usuários de todas as empresas e setores do mundo, sem identificação de empresa. Use em toda previsão e diagnóstico para comparar com a experiência de outras plantas. Com tipo_componente, traz também a distribuição de vidas (P10/P50/P90) da rede.",input_schema:{type:"object",properties:{consulta:{type:"string"},tipo_componente:{type:"string",description:"chave do catálogo, ex.: rolamento_esferas"}},required:["consulta"]}},
 {name:"ler_anexo",description:"Lê mais texto de um anexo grande (por posição de caractere) ou procura um termo dentro dele.",input_schema:{type:"object",properties:{anexo:{type:"string"},inicio:{type:"integer"},tamanho:{type:"integer"},procurar:{type:"string"}},required:["anexo"]}},
 {name:"analisar_alarmes",description:"Analisa uma tabela anexada de alarmes e eventos (ISA-18.2 / EEMUA 191) e mostra um cartão. Opcionalmente informe nomes de colunas.",input_schema:{type:"object",properties:{anexo:{type:"string"},colunas:{type:"object",properties:{time:{type:"string"},tag:{type:"string"},state:{type:"string"},desc:{type:"string"},oper:{type:"string"}}}},required:["anexo"]}},
 {name:"analisar_malha",description:"Analisa uma tendência anexada de malha de controle (PV, SP, saída, modo) e mostra um cartão com desempenho, oscilação, saturação e desgaste da válvula. Retorna também uma amostra da série para você diagnosticar sintonia e agarramento.",input_schema:{type:"object",properties:{anexo:{type:"string"},pv:{type:"string"},sp:{type:"string"},saida:{type:"string"},modo:{type:"string"},faixa:{type:"number"}},required:["anexo"]}},
 {name:"revisar_clp",description:"Lê programas de CLP anexados (Rockwell, Siemens, CODESYS/PLCopen, ST, AWL, Mitsubishi), aplica regras automáticas e mostra um cartão. Retorna o código para você revisar em profundidade e propor correções no mesmo dialeto.",input_schema:{type:"object",properties:{anexos:{type:"array",items:{type:"string"}}},required:["anexos"]}},
 {name:"simular_clp",description:"Lê o programa do CLP e abre um simulador 3D: executa o ciclo de varredura, mostra entradas, saídas, temporizadores, a lógica energizada e o processo em 3D reagindo (motores, esteiras, cilindros, válvulas, tanques). Leitura direta de ladder Rockwell (L5X ou texto), texto estruturado IEC/SCL/CODESYS/TwinCAT, AWL/STL, IL e Mitsubishi. Para qualquer outro fabricante ou linguagem gráfica, traduza você o programa para texto estruturado IEC fiel ao original (mesmos nomes de tags, mesmos tempos) e passe em codigo_st. Monte a cena a partir do manual e dos nomes das tags, ligando cada objeto às tags; sensores de fim de curso, nível e presença são movidos pela física.",input_schema:{type:"object",properties:{nome:{type:"string"},anexos:{type:"array",items:{type:"string"}},arquivos_base:{type:"array",items:{type:"string"},description:"caminhos de programas na base da planta"},codigo_st:{type:"string",description:"programa em texto estruturado IEC 61131-3 (tradução de outro dialeto ou lógica descrita pelo usuário)"},cena:{type:"object",properties:{objetos:{type:"array",items:{type:"object",properties:{tipo:{type:"string",enum:["motor","bomba","ventilador","esteira","cilindro","valvula","tanque","lampada","botao","sensor"]},nome:{type:"string"},tag:{type:"string",description:"tag que liga o objeto (saída) ou que o botão/sensor aciona (entrada)"},retentivo:{type:"boolean"},tag_avanca:{type:"string"},tag_recua:{type:"string"},tag_sensor_avancado:{type:"string"},tag_sensor_recuado:{type:"string"},tempo_s:{type:"number"},tag_enche:{type:"string"},tag_esvazia:{type:"string"},tag_nivel:{type:"string"},tag_nivel_alto:{type:"string"},tag_nivel_baixo:{type:"string"},nivel_inicial:{type:"number"},vazao_entrada_pct_s:{type:"number"},vazao_saida_pct_s:{type:"number"},tag_motor:{type:"string"},tag_sensor_peca:{type:"string"},comprimento:{type:"number"},intervalo_s:{type:"number"},tag_abre:{type:"string"},tag_retorno:{type:"string"},pos:{type:"array",items:{type:"number"},description:"[x,y,z] em metros"},rot:{type:"number"}},required:["tipo"]}}}}}}},
 {name:"gerar_cad",description:"Mostra ao usuário uma peça como modelo paramétrico editável (3D, desenho 2D com cotas, exportação OpenSCAD, CadQuery/STEP e DXF). Eixo Z principal, base em z=0, mm. Operações: revolucao{perfil:[[r,z],...]}, cilindro{d,h,x,y,z,eixo}, caixa{w,p,h,x,y,z}, furo{como cilindro}, furos_circulares{n,d,pcd,h,z,angulo0}, rasgo{como caixa}. Valores podem ser expressões com os nomes dos parâmetros.",input_schema:{type:"object",properties:{modelo:{type:"object",properties:{nome:{type:"string"},descricao:{type:"string"},material_sugerido:{type:"string"},parametros:{type:"array",items:{type:"object",properties:{nome:{type:"string"},valor:{type:"string",description:"número ou expressão, ex.: 80 ou D_ext/2"},descricao:{type:"string"},origem:{type:"string",enum:["medido","estimado"]}},required:["nome","valor"]}},features:{type:"array",items:{type:"object",properties:{op:{type:"string",enum:["revolucao","cilindro","caixa","furo","furos_circulares","rasgo"]},perfil:{type:"array",items:{type:"array",items:{type:"string"}},description:"pares [r,z] para revolucao"},d:{type:"string"},h:{type:"string"},w:{type:"string"},p:{type:"string"},x:{type:"string"},y:{type:"string"},z:{type:"string"},eixo:{type:"string",enum:["x","y","z"]},n:{type:"string"},pcd:{type:"string"},angulo0:{type:"string"}},required:["op"]}},tolerancias:{type:"array",items:{type:"object",properties:{cota:{type:"string"},ajuste:{type:"string"},motivo:{type:"string"}}}},medidas_faltantes:{type:"array",items:{type:"string"}},observacoes:{type:"string"}},required:["nome","parametros","features"]}},required:["modelo"]}}];
TOOLS.push(
 {name:"buscar_literatura",description:"Busca livros e artigos gratuitos e legais na internet: artigos científicos de acesso aberto (OpenAlex, que inclui SciELO; arXiv; DOAJ), livros em domínio público (Open Library / Internet Archive, Projeto Gutenberg) e a Wikipédia em português e inglês. Use para estudar um assunto, fundamentar uma explicação ou achar normas, métodos e dados de vida útil. Mostra um cartão com os resultados.",input_schema:{type:"object",properties:{consulta:{type:"string",description:"termos de busca; em inglês costuma trazer mais artigos técnicos"},tipo:{type:"string",enum:["todos","artigos","livros","enciclopedia"]},limite:{type:"integer"}},required:["consulta"]}},
 {name:"ler_literatura",description:"Lê o texto de um artigo, livro ou página encontrado por buscar_literatura (PDF, HTML ou texto), por partes. Use procurar para ir direto ao trecho que interessa.",input_schema:{type:"object",properties:{url:{type:"string"},inicio:{type:"integer"},tamanho:{type:"integer"},procurar:{type:"string"}},required:["url"]}},
 {name:"guardar_na_base",description:"Guarda o texto de um livro ou artigo online na base da planta, para virar conhecimento permanente do Prognos. Use quando o material for útil de novo ou quando o usuário pedir.",input_schema:{type:"object",properties:{url:{type:"string"},titulo:{type:"string"},autores:{type:"string"},ano:{type:"string"},fonte:{type:"string"}},required:["url","titulo"]}});
TOOLS[TOOLS.length-1].cache_control={type:"ephemeral"};
const TOOL_LABEL={simular_clp:"Montando a simulação da lógica",conhecimento_global:"Consultando a rede Prognos",buscar_base:"Buscando na base da planta",ler_arquivo_base:"Abrindo o documento da planta",historico_equipamento:"Lendo o histórico do equipamento",catalogo_componentes:"Consultando o catálogo de componentes",prever_falha:"Rodando o motor de confiabilidade",consultar_enxame:"Convocando o enxame de especialistas",registrar_evento:"Gravando o evento",registrar_retorno:"Gravando o retorno de campo",ler_anexo:"Lendo o anexo",analisar_alarmes:"Analisando alarmes",analisar_malha:"Analisando a malha",revisar_clp:"Revisando o programa do CLP",gerar_cad:"Montando o modelo da peça",buscar_literatura:"Buscando livros e artigos abertos",ler_literatura:"Lendo a fonte",guardar_na_base:"Guardando na base da planta"};
const orQuery=q=>String(q||"").toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}_-]+/u).filter(w=>w.length>=3&&!/^(que|com|para|por|dos|das|uma|uns|nos|nas|sem|mais|como|qual|quais|onde|quando|este|esta|isso|esse|essa|meu|minha)$/.test(w)).slice(0,12).join(" or ");
const SPECS=[
 {k:"fmea",n:"FMEA e mecanismos",p:`Liste os modos de falha mais prováveis, com mecanismo físico, causa raiz, efeito, notas S/O/D e beta típico. JSON: {"modos":[{"modo":"","mecanismo":"","causa":"","S":0,"O":0,"D":0,"beta_tipico":0}],"modo_dominante":"","resumo":"","confianca":0.0}`},
 {k:"estatistico",n:"Estatístico",p:`Proponha uma Weibull da vida nas condições informadas, em horas de operação, com base em OREDA, NPRD, ISO 14224, IEEE 493 e no histórico. Não invente números de tabela. JSON: {"beta":0,"eta_h":0,"fontes":[""],"resumo":"","confianca":0.0}`},
 {k:"fisica",n:"Física de falha",p:`Estime quanto carga, temperatura, contaminação, umidade, corrosão e regime alteram a vida (ISO 281, Arrhenius, Miner, Archard). JSON: {"fator_vida":0.0,"mecanismo_dominante":"","calculos":"","resumo":"","confianca":0.0}`},
 {k:"preditiva",n:"Preditiva",p:`Interprete sintomas e medições (ISO 20816, BPFO/BPFI, óleo ISO 4406, termografia, MCSA, ultrassom). Estime posição na curva P-F e vida remanescente em horas; sem medições, rul_h null. JSON: {"indice_saude":0.0,"posicao_pf":"","rul_h":{"p10":0,"p50":0,"p90":0},"resumo":"","confianca":0.0}`},
 {k:"pesquisa",n:"Pesquisa multilíngue",p:`Reúna o que a literatura técnica em português, inglês, alemão, espanhol, francês, chinês, japonês e russo sabe sobre vida e falhas deste componente e modelo. Você não acessa a internet: seja explícito sobre incerteza e não invente referências. JSON: {"achados":[{"idioma":"","achado":""}],"vida_tipica_h":{"p10":0,"p50":0,"p90":0},"consultas":[""],"resumo":"","confianca":0.0}`}];
async function runTool(name,input,ui){
  if(name==="buscar_base"){const q=orQuery(input.consulta);if(!q)return {resultado:"consulta vazia"};const lim=Math.min(15,+input.limite||8);
    const [loc,nuv]=await Promise.all([baseBuscar(input.consulta,lim).catch(()=>[]),rpc("buscar",{q,limite:lim}).catch(()=>[])]);const rows=[...loc,...nuv];
    ui.card("fontes",{consulta:input.consulta,itens:rows.slice(0,25)});return {encontrados:rows.length,itens:rows.slice(0,30).map(r=>({origem:r.origem,arquivo:r.caminho,pagina:r.pagina,data:r.data,tipo:r.tipo_evento,equipamento:r.equipamento,texto:r.texto}))}}
  if(name==="ler_arquivo_base"){const r=await baseLerArquivo(input.caminho,{procurar:input.procurar,inicio:+input.inicio||0});ui.step(`Lido: ${input.caminho}`);return r}
  if(name==="historico_equipamento"){const q=String(input.equipamento||"").replace(/[^\p{L}\p{N}\s_-]/gu," ").trim().split(/\s+/).filter(w=>w.length>=2).join(" ");
    const rows=await sb(`eventos?select=data,tipo_evento,equipamento,componente,modo,texto,fonte&tsv=wfts(portuguese).${encodeURIComponent(q)}&order=data.asc.nullslast&limit=400`);
    const ft=rows.filter(e=>e.data&&/falha|troca/.test(e.tipo_evento||"")),iv=[];for(let i=1;i<ft.length;i++)iv.push((parseDate(ft[i].data)-parseDate(ft[i-1].data))/DAY);
    const d={equipamento:input.equipamento,total:rows.length,falhas_trocas:ft.length,intervalo_medio_dias:iv.length?Math.round(iv.reduce((a,b)=>a+b,0)/iv.length):null,eventos:rows.slice(-120)};ui.card("historico",d);
    return {...d,intervalos_dias:iv.map(Math.round),eventos:rows.slice(-150)}}
  if(name==="catalogo_componentes"){const w=String(input.busca||"").toLowerCase().split(/\s+/).filter(Boolean);const hits=RAW.filter(r=>w.some(x=>(r[0]+" "+r[1]+" "+r[2]+" "+r[7]).toLowerCase().includes(x))).slice(0,15);
    return {resultados:(hits.length?hits:RAW.filter(r=>r[2]==="Genéricos")).map(r=>({tipo:r[0],nome:r[1],setor:r[2],beta:r[3],eta_h:r[4],modos:r[7],pf_h:r[8],deteccao:r[9]}))}}
  if(name==="prever_falha"){const d=lifeModel(input);ui.card("previsao",d);const {curve,...rest}=d;return rest}
  if(name==="consultar_enxame"){const ag=[...SPECS.map(s=>({k:s.k,n:s.n})),{k:"critico",n:"Crítico"}];const el=ui.card("enxame",{agentes:ag});const set=(k,t)=>{const x=el?.querySelector(`[data-ag="${k}"] span`);if(x)x.textContent=t};
    const kb=await rpc("buscar",{q:orQuery(input.caso),limite:5}).catch(()=>[]);const base=kb.length?"\nCONHECIMENTO DA PLANTA:\n"+kb.slice(0,12).map(r=>`- ${r.origem==="evento"?(r.data||"")+" "+(r.tipo_evento||""):r.caminho}: ${String(r.texto).slice(0,300)}`).join("\n"):"";
    const res={};await Promise.all(SPECS.map(async s=>{set(s.k,"analisando…");try{const t=await iaOnce(`Você é o especialista "${s.n}" de um enxame de engenharia de confiabilidade industrial. ${s.p}\nResponda só o JSON.\n\nCASO:\n${input.caso}${base}`,{tier:"default",maxTokens:2500});res[s.k]=parseJSON(t)||{resumo:t.slice(0,600)};set(s.k,"concluído")}catch(e){res[s.k]={erro:errText(e)};set(s.k,"erro")}}));
    set("critico","analisando…");try{const t=await iaOnce(`Você é o CRÍTICO de um enxame de confiabilidade. Aponte contradições, otimismo, dados fracos e confusão entre horas de calendário e de operação, e dê um peso de 0 a 1,5 para cada especialista. JSON: {"pesos":{"fmea":1,"estatistico":1,"fisica":1,"preditiva":1,"pesquisa":1},"contradicoes":[""],"lacunas":[""],"comentario":""}\n\nCASO:\n${input.caso}\n\nESPECIALISTAS:\n${JSON.stringify(res).slice(0,14000)}`,{tier:"default",maxTokens:1500});res.critico=parseJSON(t)||{comentario:t.slice(0,600)};set("critico","concluído")}catch(e){res.critico={erro:errText(e)};set("critico","erro")}
    return res}
  if(name==="registrar_evento"){const d=parseDate(input.data);const row={data:d?iso(d):null,tipo_evento:input.tipo_evento,equipamento:input.equipamento,componente:input.componente||null,modo:input.modo||null,texto:input.texto,fonte:"conversa",chave:`conv|${input.equipamento}|${d?iso(d):""}|${input.tipo_evento}|${String(input.texto).slice(0,40)}`.toLowerCase()};
    await sb("eventos?on_conflict=unidade,chave",{method:"POST",body:[row],headers:{Prefer:"resolution=ignore-duplicates,return=minimal"}});ui.step(`Evento gravado: ${row.data?brDate(row.data)+" · ":""}${row.tipo_evento} · ${row.equipamento}`);return {gravado:true}}
  if(name==="conhecimento_global"){const q=orQuery(input.consulta).replace(/ or /g," or ");
    const [itens,vida]=await Promise.all([q?sb(`conhecimento_global?select=tipo_componente,modo,mecanismo,causa,licao,setor,regime,desfecho,vida_h,criado_em&tsv=wfts(portuguese).${encodeURIComponent(q)}&order=criado_em.desc&limit=25`).catch(()=>[]):[],
      input.tipo_componente?rpc("vida_global",{tipo:input.tipo_componente}).catch(()=>null):null]);
    ui.step(`Rede Prognos: ${itens.length} experiência(s) de outras plantas${vida?.falhas?` · ${vida.falhas} vidas registradas`:""}`);return {experiencias:itens,vida_na_rede:vida}}
  if(name==="registrar_retorno"){const d=parseDate(input.data)||new Date();const txt=`LIÇÃO (${input.desfecho}${input.avaliacao_previsao?", previsão: "+input.avaliacao_previsao:""}): ${input.licao}${input.modo?" | modo: "+input.modo:""}${input.causa?" | causa: "+input.causa:""}`;
    await sb("eventos?on_conflict=unidade,chave",{method:"POST",body:[{data:iso(d),tipo_evento:input.desfecho==="falhou"?"falha":input.desfecho==="defeito_em_inspecao"?"troca_corretiva":input.desfecho==="trocado_sem_defeito"?"troca_preventiva":"licao",equipamento:input.equipamento,componente:input.tipo_real?(LIB[input.tipo_real]?.n||input.tipo_real):null,modo:input.modo||null,texto:txt,fonte:"retorno de campo",chave:`ret|${input.equipamento}|${iso(d)}|${String(input.licao).slice(0,40)}`.toLowerCase()}],headers:{Prefer:"resolution=ignore-duplicates,return=minimal"}});
    await sb("eventos?on_conflict=unidade,chave",{method:"POST",body:[{data:iso(d),tipo_evento:"licao",equipamento:input.equipamento,texto:txt,fonte:"retorno de campo",chave:`lic|${input.equipamento}|${iso(d)}|${String(input.licao).slice(0,40)}`.toLowerCase()}],headers:{Prefer:"resolution=ignore-duplicates,return=minimal"}});
    ui.step("Retorno de campo gravado. As próximas previsões deste equipamento já o consideram.");compartilharNaRede(input).then(ok=>ok&&ui.step("Lição compartilhada com a rede Prognos, sem identificar a empresa.")).catch(()=>{});return {gravado:true}}
  if(name==="buscar_literatura"){const r=await bib({acao:"buscar",consulta:input.consulta,tipo:input.tipo||"todos",limite:input.limite||5});ui.card("biblioteca",{consulta:input.consulta,itens:r.itens.slice(0,24)});
    return {encontrados:r.itens.length,falhas:r.falhas,itens:r.itens.slice(0,24).map(i=>({...i,resumo:String(i.resumo||"").slice(0,600)}))}}
  if(name==="ler_literatura"){const t=await lerOnline(input.url);if(input.procurar){const re=new RegExp(reEsc(input.procurar),"gi"),hits=[];let m;while((m=re.exec(t))&&hits.length<20)hits.push({pos:m.index,trecho:t.slice(Math.max(0,m.index-400),m.index+800)});return {total:t.length,ocorrencias:hits.length,trechos:hits}}
    const i=Math.max(0,+input.inicio||0),n=Math.min(30000,+input.tamanho||15000);return {total:t.length,inicio:i,fim:Math.min(t.length,i+n),texto:t.slice(i,i+n)}}
  if(name==="guardar_na_base"){const t=await lerOnline(input.url);if(t.length<200)throw new Error("texto curto demais para guardar");const ts=chunkText(t,400);
    const [arq]=await sb("arquivos?on_conflict=unidade,caminho",{method:"POST",body:[{caminho:input.url,nome:input.titulo,ext:"online",pasta:input.fonte||"Biblioteca online",categoria:"Biblioteca online",status:"lido",caracteres:t.length,trechos:ts.length,resumo:[input.autores,input.ano].filter(Boolean).join(" · ")||null,processado_em:new Date().toISOString()}],headers:{Prefer:"resolution=merge-duplicates,return=representation"}});
    await sb(`trechos?arquivo_id=eq.${arq.id}`,{method:"DELETE"});for(let i=0;i<ts.length;i+=200)await sb("trechos",{method:"POST",body:ts.slice(i,i+200).map((x,k)=>({arquivo_id:arq.id,ordem:i+k,texto:x})),headers:{Prefer:"return=minimal"}});
    ui.step(`Guardado na base: ${input.titulo} (${ts.length} trechos)`);refreshKB();return {guardado:true,trechos:ts.length}}
  const A=k=>{const a=ANX[String(k||"").toUpperCase()];if(!a)throw new Error(`o anexo ${k} não está carregado nesta sessão; peça ao usuário para anexar de novo`);return a};
  if(name==="ler_anexo"){const a=A(input.anexo);let t=a.texto||"";if(a.rows&&!t)t=a.rows.map(r=>r.join(" | ")).join("\n");if(a.rows)t=a.rows.map(r=>r.map(c=>c instanceof Date?iso(c):String(c??"")).join(" | ")).join("\n");
    if(input.procurar){const re=new RegExp(reEsc(input.procurar),"gi"),hits=[];let m;while((m=re.exec(t))&&hits.length<30)hits.push(t.slice(Math.max(0,m.index-300),m.index+500));return {ocorrencias:hits.length,trechos:hits}}
    const i=Math.max(0,+input.inicio||0),n=Math.min(40000,+input.tamanho||20000);return {inicio:i,fim:Math.min(t.length,i+n),total:t.length,texto:t.slice(i,i+n)}}
  if(name==="analisar_alarmes"){const a=A(input.anexo);if(!a.rows)throw new Error("o anexo não é uma tabela");const d=alarmStats(a.rows,input.colunas);ui.card("alarmes",d);return d}
  if(name==="analisar_malha"){const a=A(input.anexo);if(!a.rows)throw new Error("o anexo não é uma tabela");const d=loopStats(a.rows,input);ui.card("malha",d);const {serie,...rest}=d;return rest}
  if(name==="revisar_clp"){const fs=(input.anexos||[]).map(k=>{const a=A(k);return {name:a.nome,text:a.texto}});const d=plcAnalyzeFiles(fs);const {trecho_codigo,...c}=d;ui.card("clp",c);return d}
  if(name==="simular_clp"){const fontes=(input.anexos||[]).map(k=>{const a=A(k);return {name:a.nome,text:String(a.texto||"").slice(0,600000)}});for(const c of input.arquivos_base||[]){const tx=await textoDoArquivo(c).catch(()=>null);if(tx)fontes.push({name:c.split("/").pop(),text:tx.slice(0,600000)})}if(input.codigo_st)fontes.push({name:"traducao.st",text:input.codigo_st});
    if(!fontes.length)return {erro:"Sem programa: anexe o arquivo do CLP ou passe codigo_st"};const P=montarPrograma(fontes),R=simResumo(P);
    if(!P.unidades.length)return {erro:"Não consegui ler este formato diretamente.",avisos:R.avisos,dica:"Traduza o programa para texto estruturado IEC 61131-3 mantendo nomes de tags e tempos e chame simular_clp de novo com codigo_st."};
    ui.card("sim",{nome:input.nome||fontes[0].name,fontes,cena:input.cena||null});return {ok:true,...R,dica:R.erros.length?"Há blocos com erro de leitura; se forem importantes, traduza-os para ST e chame de novo com codigo_st.":undefined}}
  if(name==="gerar_cad"){const M=cadPrepare(JSON.parse(JSON.stringify(input.modelo||{})));const {err}=cadResolve(M);if(err)return {erro:err,dica:"corrija parâmetros ou operações e chame de novo"};ui.card("cad",{modelo:M});return {ok:true,parametros:M.parametros.length,operacoes:M.features.length}}
  throw new Error("ferramenta desconhecida")}

/* ======================= CONVERSAS ======================= */
let UID=null,CONV=null,LIST=[],busy=false,ctl=null,lastProv=null;
const newConv=()=>({id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),titulo:"Nova conversa",criado:new Date().toISOString(),ui:[],api:[]});
const convCol=()=>`data/users/${UID}/conversas`;
async function listConvs(){try{LIST=(await sb(`docs?select=doc_id,data->>titulo,data->>atualizado&collection=eq.${encodeURIComponent(convCol())}&order=atualizado_em.desc&limit=80`)).map(r=>({id:r.doc_id,titulo:r.titulo||"Conversa",atualizado:r.atualizado}))}catch(e){LIST=[]}renderSide()}
function compactApi(api){return api.map(m=>({role:m.role,content:typeof m.content==="string"?m.content:m.content.map(b=>b.type==="image"?{type:"text",text:"[imagem enviada antes nesta conversa]"}:b.type==="tool_result"?{...b,content:typeof b.content==="string"?b.content.slice(0,6000):b.content}:b)}))}
async function saveConv(){if(!CONV||!UID||!CONV.ui.length)return;const data={titulo:CONV.titulo,criado:CONV.criado,atualizado:new Date().toISOString(),ui:CONV.ui.slice(-200),api:compactApi(CONV.api).slice(-120)};
  try{await sb("docs?on_conflict=path",{method:"POST",body:[{path:convCol()+"/"+CONV.id,collection:convCol(),doc_id:CONV.id,data,atualizado_em:new Date().toISOString()}],headers:{Prefer:"resolution=merge-duplicates,return=minimal"}});
    if(!LIST.find(c=>c.id===CONV.id))LIST.unshift({id:CONV.id,titulo:CONV.titulo});else LIST.find(c=>c.id===CONV.id).titulo=CONV.titulo;renderSide()}catch(e){console.warn(e)}}
async function openConv(id){if(busy)return;try{const r=await sb(`docs?select=data&path=eq.${encodeURIComponent(convCol()+"/"+id)}`);if(!r.length)return;CONV={id,...r[0].data};CONV.ui=CONV.ui||[];CONV.api=CONV.api||[];renderThread();renderSide();closeSide()}catch(e){toastErr("Não consegui abrir a conversa.")}}
async function delConv(id){try{await sb(`docs?path=eq.${encodeURIComponent(convCol()+"/"+id)}`,{method:"DELETE"});LIST=LIST.filter(c=>c.id!==id);if(CONV?.id===id){CONV=newConv();renderThread()}renderSide()}catch(e){toastErr("Não consegui apagar.")}}
function renderSide(){const el=$("convs");el.innerHTML=`<h6>Conversas</h6>`+(LIST.length?LIST.map(c=>`<button class="cv" data-id="${esc(c.id)}" aria-current="${CONV?.id===c.id}"><span>${esc(c.titulo)}</span><i data-del="${esc(c.id)}" title="Apagar">apagar</i></button>`).join(""):`<p class="kb" style="padding:0 10px">As conversas aparecem aqui.</p>`);$("title").textContent=CONV?.titulo||"Nova conversa"}
$("convs").onclick=e=>{const d=e.target.dataset.del;if(d){e.stopPropagation();if(e.target.textContent==="confirmar"){delConv(d)}else{e.target.textContent="confirmar";setTimeout(()=>{e.target.textContent="apagar"},3000)}return}const b=e.target.closest(".cv");if(b)openConv(b.dataset.id)};

/* ======================= RENDERIZAÇÃO ======================= */
const SUGS=[["Prever a falha de um componente","Conte o equipamento, o uso e o histórico"],["Analisar exportação de alarmes","Anexe o CSV ou Excel do banco de alarmes"],["Revisar um programa de CLP","Anexe L5X, XML do TIA, SCL, ST ou AWL"],["Transformar foto de peça em CAD","Anexe fotos e diga as medidas que tirou"]];
function renderThread(){const th=$("thread");th.innerHTML="";$("title").textContent=CONV.titulo;
  if(!CONV.ui.length){th.innerHTML=`<div class="empty">${onbHTML()}<h2>Como está a planta hoje?</h2><p>Descreva o que está acontecendo, pergunte sobre um equipamento ou anexe OMs, relatórios, fotos, vídeos, tendências e programas.</p><div class="sugs">${SUGS.map(([a,b])=>`<button class="sug" data-s="${esc(a)}">${esc(a)}<small>${esc(b)}</small></button>`).join("")}</div></div>`;
    ligaOnb();th.querySelector(".sugs").onclick=e=>{const b=e.target.closest(".sug");if(b){$("inp").value=b.dataset.s+": ";$("inp").focus();grow()}};return}
  const col=document.createElement("div");col.className="col";th.append(col);CONV.ui.forEach(m=>col.append(renderMsg(m)));th.scrollTop=1e9}
function renderMsg(m){const w=document.createElement("div");w.className="msg "+(m.role==="user"?"u":"a");
  if(m.role==="user"){w.innerHTML=`<div>${m.files?.length?`<div class="files">${m.files.map(f=>`<span class="chip"><span>${esc(f)}</span></span>`).join("")}</div>`:""}<div class="bub">${esc(m.text||"")}</div></div>`;return w}
  (m.parts||[]).forEach(p=>{if(p.t==="text"){const d=document.createElement("div");d.className="md";d.innerHTML=md(p.v);w.append(d)}else if(p.t==="step"){const d=document.createElement("div");d.className="step";d.textContent=p.v;w.append(d)}else if(p.t==="card"&&CARDS[p.k]){try{w.append(CARDS[p.k](p.v))}catch(e){}}else if(p.t==="err"){const d=document.createElement("div");d.className="err";d.textContent=p.v;w.append(d)}});if(m.prov){const d=document.createElement("div");d.className="prov";d.textContent=`${m.prov.provedor} · ${m.prov.modelo}`;w.append(d)}return w}
function toastErr(t){const col=$("thread").querySelector(".col")||$("thread");const d=document.createElement("div");d.className="err";d.textContent=t;col.append(d)}

/* ======================= PROMPT DO SISTEMA ======================= */
function systemPrompt(){return [{type:"text",text:`Você é o PROGNOS, copiloto de manutenção e operação industrial da Black and White ("Technology Ahead of Time"). Hoje é ${iso(new Date())}. Fale em português do Brasil.

Quem você é: especialista sênior em manutenção mecânica, elétrica, instrumentação e automação, engenharia de confiabilidade (Weibull, FMEA, RCM, curva P-F), manutenção preditiva (vibração ISO 20816, óleo ISO 4406, termografia, ultrassom, MCSA, descargas parciais), controle de processos e programação de CLP de todos os fabricantes, para qualquer setor: siderurgia, mineração, papel e celulose, óleo e gás, alimentos, cimento, energia, química, naval, aeroespacial e automotivo.

Como conversar:
- Converse de forma natural e ampla. Perceba quem fala (operador, mantenedor, técnico de preditiva, engenheiro, gestor) pelo jeito de escrever e ajuste a linguagem.
- Segurança em primeiro lugar: se houver risco, diga antes de tudo (bloqueio e etiquetagem, NR-10, NR-12, NR-35, permissão de trabalho, EPI).
- Resolva primeiro, pergunte depois. Na manutenção quase nunca há todos os dados do equipamento: não trave a resposta esperando por eles. Busque na base da planta, no histórico, na rede Prognos e na literatura; o que faltar, assuma valores típicos para o tipo de equipamento e o setor, diga em uma linha quais suposições fez e entregue a análise completa com a faixa de incerteza.
- Não abra a conversa com perguntas. No máximo uma pergunta, no fim da resposta, e só se o dado mudar a decisão (por exemplo, uma medição que confirmaria ou descartaria o modo de falha). Nunca peça um dado que você pode buscar com as ferramentas.
- Nunca invente dados, normas, números de tabela ou referências. Diga quando não sabe.
- Toda previsão é probabilística (P10, P50, P90). Nunca prometa a data exata.
- Você só recomenda; não altera processo nem CLP. Mudança de lógica ou sintonia sempre com plano de teste.

Como usar as ferramentas:
- Sempre que o usuário citar equipamento, peça, fornecedor, desenho ou documento, use buscar_base e historico_equipamento antes de concluir. A base da planta é a pasta do usuário, mapeada no computador dele: buscar_base acha os arquivos pelo mapa e traz trechos; para ler mais de um documento, use ler_arquivo_base. Cite o caminho do arquivo e a página. Se a base ainda não estiver conectada, sugira conectar a pasta no começo da conversa.
- Para prever: escolha o tipo com catalogo_componentes, reúna histórico (base + conversa), consulte conhecimento_global (a experiência de outras plantas do mundo, de todas as empresas) e chame prever_falha. Em casos importantes ou incertos, chame consultar_enxame antes e passe os parâmetros dos especialistas para prever_falha (modelos_especialistas com beta/eta_h e peso pela confiança, vida_remanescente_h da preditiva).
- Quando o usuário relatar um evento datado, grave com registrar_evento sem pedir licença e diga em uma linha o que gravou. Quando contar o desfecho real ou disser que a previsão errou, use registrar_retorno (com horas_ate_falha e regime se souber): é assim que o sistema aprende, e a lição, sem identificação, passa a valer para todas as plantas da rede Prognos.
- Anexos chegam como [Anexo A1 ...]. Tabelas de alarmes: analisar_alarmes. Tendências: analisar_malha (e diagnostique sintonia e agarramento pela amostra). Programas: revisar_clp (e revise o código em profundidade, com correções no mesmo dialeto); para mostrar como a lógica funciona, ou quando o usuário pedir simulação, use simular_clp com uma cena 3D montada a partir do manual e das tags (para fabricantes e linguagens que o leitor não entende direto, traduza para texto estruturado em codigo_st). Você lê qualquer linguagem de CLP: ladder, FBD, SFC, ST, IL, AWL, de qualquer fabricante. Fotos de peça: gerar_cad, usando as medidas do usuário como verdade e marcando o resto como estimado. Use ler_anexo para documentos longos.
- Para ensinar ou fundamentar (o usuário quer entender um conceito, estudar um tema, conferir uma norma, um método ou dados de vida útil), use buscar_literatura e leia com ler_literatura os trechos relevantes. Explique de forma didática e técnica: o conceito em linguagem simples, como funciona, a fórmula ou o critério, um exemplo numérico, como aplicar na planta, e cite as fontes com título e link. Só use material de acesso aberto. Se o material for útil de novo, ofereça guardar_na_base.
- Os cartões já mostram os números ao usuário; no texto, interprete e recomende em vez de repetir tudo.

Formato: direto, frases curtas, listas só quando ajudam. Termine com o próximo passo prático quando houver um.`,cache_control:{type:"ephemeral"}}]}

/* ======================= ENVIO E LAÇO DO AGENTE ======================= */
async function send(){if(busy){ctl?.abort();return}const text=$("inp").value.trim();if(!text&&!pending.length)return;
  const files=pending.slice();pending=[];renderAtt();$("inp").value="";grow();
  if(!CONV.ui.length){CONV.titulo=(text||files[0]?.nome||"Conversa").slice(0,60)}
  const umsg={role:"user",text,files:files.map(f=>f.nome)};CONV.ui.push(umsg);if(CONV.ui.length===1)renderThread();else $("thread").querySelector(".col").append(renderMsg(umsg));
  const content=[];let budget=60000;const imgs=[];
  for(const a of files){content.push({type:"text",text:anxDescr(a,Math.max(4000,Math.floor(budget/Math.max(1,files.length))))});budget-=12000;a.imgs.forEach(b=>imgs.push([a,b]))}
  for(const [a,b] of imgs.slice(0,12))content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:await blobB64(b)}});
  content.push({type:"text",text:text||"(sem texto: analise os anexos)"});CONV.api.push({role:"user",content});
  const amsg={role:"assistant",parts:[]};CONV.ui.push(amsg);const wrap=document.createElement("div");wrap.className="msg a";$("thread").querySelector(".col").append(wrap);
  let curText=null,curEl=null;const scroll=()=>{const th=$("thread");if(th.scrollHeight-th.scrollTop-th.clientHeight<240)th.scrollTop=1e9};
  const ui={card:(k,v)=>{amsg.parts.push({t:"card",k,v});const el=CARDS[k](v);wrap.append(el);curEl=null;scroll();return el},step:t=>{amsg.parts.push({t:"step",v:t});const d=document.createElement("div");d.className="step";d.textContent=t;wrap.append(d);curEl=null;scroll()}};
  busy=true;setBusy(true);ctl=new AbortController();
  try{for(let turn=0;turn<12;turn++){curText={t:"text",v:""};curEl=document.createElement("div");curEl.className="md";wrap.append(curEl);const myEl=curEl,myPart=curText;let shown=false;
      const res=await iaStream({tier:$("tier").value,system:systemPrompt(),tools:TOOLS,max_tokens:8000,messages:CONV.api},{signal:ctl.signal,onText:t=>{myPart.v=t;myEl.innerHTML=md(t);if(!shown){amsg.parts.push(myPart);shown=true}scroll()}});
      if(!shown&&!myPart.v)myEl.remove();if(res.prov?.provedor){amsg.prov=res.prov;lastProv=res.prov}
      CONV.api.push({role:"assistant",content:res.content.length?res.content:[{type:"text",text:"(sem resposta)"}]});
      const calls=res.content.filter(b=>b.type==="tool_use");if(res.stop!=="tool_use"||!calls.length)break;
      const results=[];for(const c of calls){const st=document.createElement("div");st.className="step run";st.textContent=(TOOL_LABEL[c.name]||c.name)+"…";wrap.append(st);scroll();
        try{const out=await runTool(c.name,c.input||{},ui);results.push({type:"tool_result",tool_use_id:c.id,content:JSON.stringify(out).slice(0,60000)});st.classList.remove("run");st.textContent=TOOL_LABEL[c.name]||c.name}
        catch(e){results.push({type:"tool_result",tool_use_id:c.id,is_error:true,content:String(e.message||e).slice(0,1000)});st.classList.remove("run");st.textContent=(TOOL_LABEL[c.name]||c.name)+": "+(e.message||"falhou").slice(0,120)}}
      CONV.api.push({role:"user",content:results})}}
  catch(e){if(e.name==="AbortError"){amsg.parts.push({t:"step",v:"Interrompido"});const d=document.createElement("div");d.className="step";d.textContent="Interrompido";wrap.append(d)}
    else{const t=errText(e);amsg.parts.push({t:"err",v:t});const d=document.createElement("div");d.className="err";d.textContent=t;wrap.append(d);if(e.code==="session_expired")logout(true)}
    const last=CONV.api[CONV.api.length-1];if(last?.role==="assistant"&&last.content.some(b=>b.type==="tool_use"))CONV.api.pop();if(CONV.api[CONV.api.length-1]?.role==="user")CONV.api.push({role:"assistant",content:[{type:"text",text:"(resposta interrompida)"}]})}
  if(amsg.prov){const d=document.createElement("div");d.className="prov";d.textContent=`${amsg.prov.provedor} · ${amsg.prov.modelo}`;wrap.append(d)}
  busy=false;setBusy(false);saveConv();refreshKB()}
function setBusy(b){const s=$("send");s.innerHTML=b?`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>`:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;s.setAttribute("aria-label",b?"Parar":"Enviar")}

/* ======================= COMPOSITOR ======================= */
function grow(){const t=$("inp");t.style.height="auto";t.style.height=Math.min(220,t.scrollHeight)+"px"}
function renderAtt(){const el=$("att");el.hidden=!pending.length;el.innerHTML=pending.map((a,i)=>`<span class="chip" title="${esc(a.info||"")}"><span>${esc(a.id)} · ${esc(a.nome)}</span><button data-r="${i}" aria-label="Remover anexo">×</button></span>`).join("")}
$("att").onclick=e=>{const i=e.target.dataset.r;if(i!=null){pending.splice(+i,1);renderAtt()}};
async function addFiles(list){const arr=[...list];if(!arr.length)return;const ph=document.createElement("span");ph.className="chip";ph.textContent=`Lendo ${arr.length} arquivo(s)…`;$("att").hidden=false;$("att").append(ph);
  for(const f of arr){pending.push(await readAttachment(f))}renderAtt()}
$("inp").addEventListener("input",grow);$("inp").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
$("inp").addEventListener("paste",e=>{const fs=[...(e.clipboardData?.files||[])];if(fs.length){e.preventDefault();addFiles(fs)}});
$("send").onclick=send;$("clip").onclick=()=>$("files").click();$("files").onchange=e=>{addFiles(e.target.files);e.target.value=""};$("cam").onchange=e=>{addFiles(e.target.files);e.target.value=""};
["dragover","dragenter"].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();$("box").classList.add("over")}));
["dragleave","drop"].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();if(ev==="drop"||!e.relatedTarget)$("box").classList.remove("over")}));
document.addEventListener("drop",e=>{if(e.dataTransfer?.files?.length)addFiles(e.dataTransfer.files)});
$("newc").onclick=()=>{if(busy)return;CONV=newConv();renderThread();renderSide();closeSide();$("inp").focus()};
$("menuBtn").onclick=()=>$("side").classList.toggle("open");function closeSide(){$("side").classList.remove("open")}
$("logout").onclick=()=>logout(false);
$("themeBtn").onclick=()=>{const r=document.documentElement,cur=r.dataset.theme||"dark",nx=cur==="dark"?"light":"dark";r.dataset.theme=nx;store.set("prognos.theme",nx)};
{const t=store.get("prognos.theme");if(t)document.documentElement.dataset.theme=t}
try{const t=store.get("prognos.tier");if(t)$("tier").value=t}catch(e){}$("tier").onchange=()=>store.set("prognos.tier",$("tier").value);

/* ======================= BASE E LOGIN ======================= */
const fmtN=n=>(+n||0).toLocaleString("pt-BR"),fmtGB=b=>b>=1e9?(b/1e9).toFixed(1).replace(".",",")+" GB":Math.max(1,Math.round(b/1e6))+" MB";
function quandoFoi(t){if(!t)return"";const m=Math.round((Date.now()-t)/60000);return m<1?"agora":m<60?`há ${m} min`:m<1440?`há ${Math.round(m/60)} h`:`há ${Math.round(m/1440)} dias`}
function baseResumo(){const P=BASE.prog,I=BASE.info;
  if(BASE.rodando){const pct=P.total?Math.min(100,Math.round(P.feitos/P.total*100)):0;return {estado:"rodando",pct,txt:P.fase==="Mapeando a pasta"?`Mapeando a pasta · ${fmtN(P.total)} arquivos encontrados`:P.fase==="Lendo os arquivos"?`Lendo ${fmtN(P.feitos)} de ${fmtN(P.total)} arquivos novos ou alterados`:P.fase}}
  if(P.fase==="Recebendo o mapa da unidade")return {estado:"rodando",pct:50,txt:"Recebendo o mapa da base da unidade"};
  if(!I||!I.arquivos)return {estado:"vazia",txt:"Base da planta não conectada"};
  const txt=`Base${PERFIL?" de "+PERFIL.unidade_nome:""}: ${fmtN(I.arquivos)} arquivos · ${fmtGB(I.bytes)} · atualizada ${quandoFoi(I.atualizado)}`;
  if(!BASE.dir&&!I.semPasta)return {estado:"semoriginais",txt};
  return {estado:"ok",txt}}
function renderBase(){const r=baseResumo(),el=$("kbStat");if(!el)return;
  el.innerHTML=`<div class="basebar"><div class="lin"><span>${esc(r.txt)}</span></div>${r.estado==="rodando"?`<div class="prog"><i style="width:${r.pct}%"></i></div><div class="lin"><button class="link" data-b="pausar">Pausar</button></div>`:
    `<div class="lin">${r.estado==="vazia"?`<button class="link" data-b="pasta">Conectar pasta</button>`:r.estado==="semoriginais"?`<button class="link" data-b="reconectar" title="Opcional: permite abrir os documentos originais">Conectar pasta</button>`:`<button class="link" data-b="atualizar">Atualizar</button><button class="link" data-b="pasta">Outra pasta</button>`}</div>`}</div>`;
  const o=$("onb");if(o)o.outerHTML=onbHTML();ligaOnb()}
function acaoBase(b){if(b==="pasta")baseEscolherPasta();else if(b==="reconectar")baseReconectar();else if(b==="atualizar")baseAtualizar();else if(b==="pausar")basePausar()}
function onbHTML(){const r=baseResumo(),P=BASE.prog;
  if(r.estado==="ok"||r.estado==="semoriginais")return `<div id="onb" hidden></div>`;
  if(r.estado==="rodando")return `<div class="onb" id="onb"><p class="st">Base da planta · ${esc(P.fase)}</p><h3>O Prognos está aprendendo a sua planta</h3>
    <div class="num"><div><b>${fmtN(P.feitos)}</b><small>de ${fmtN(P.total)} arquivos</small></div><div><b>${fmtGB(P.bytes)}</b><small>na pasta</small></div><div><b>${fmtN(P.eventos)}</b><small>eventos do SAP</small></div></div>
    <div class="prog"><i style="width:${r.pct}%"></i></div><p style="margin:12px 0 0">Você já pode conversar. Pode fechar a página: na próxima visita ele continua de onde parou e só lê o que mudou.</p></div>`;
  return `<div class="onb" id="onb"><p class="st">Primeiro passo</p><h3>Conecte a base da sua planta</h3>
    <p>Escolha a pasta com o arquivo técnico${PERFIL?" da unidade "+esc(PERFIL.unidade_nome):""}: manuais, relatórios, OMs e notas do SAP, planilhas, desenhos, fotos e programas. Pode ser grande, com centenas de gigabytes. Basta uma pessoa da unidade fazer isso: os colegas recebem o mapa pronto.</p>
    <ul><li>O Prognos lê tudo no seu computador e cria um mapa da pasta em <b>_prognos</b>. Os documentos não são enviados para a internet; só o mapa, visível apenas para a sua unidade.</li>
    <li>Quando você pergunta, ele usa o mapa para ir direto aos documentos certos.</li>
    <li>Ordens e notas do SAP viram histórico de falhas e alimentam as previsões.</li></ul>
    <div class="acts"><button class="big" data-b="pasta">Escolher pasta</button><span class="kb">${BASE.suporte?"Leva de minutos a algumas horas, conforme o tamanho.":"Use o Chrome ou o Edge do computador para a melhor experiência."}</span></div></div>`}
function ligaOnb(){document.querySelectorAll("#onb [data-b],#kbStat [data-b]").forEach(b=>b.onclick=()=>acaoBase(b.dataset.b))}
async function refreshKB(){renderBase()}
let signup=false,recovery=false;
const APP_URL=location.origin+location.pathname;
async function getUser(access){const r=await fetch(`${SB_URL}/auth/v1/user`,{headers:{apikey:SB_KEY,Authorization:"Bearer "+access}});return r.ok?r.json():null}
/* volta do link do e-mail (confirmação ou nova senha): a sessão vem no endereço */
async function lerRetornoEmail(){const h=new URLSearchParams(location.hash.slice(1));if(!h.size)return"";history.replaceState(null,"",APP_URL);
  if(h.get("error")||h.get("error_code"))return h.get("error_code")==="otp_expired"?"Este link já foi usado ou expirou. Se você já confirmou o e-mail, é só entrar com sua senha.":"Não foi possível validar o link: "+(h.get("error_description")||h.get("error")).replace(/\+/g," ");
  if(h.get("access_token")){const j={access_token:h.get("access_token"),refresh_token:h.get("refresh_token"),expires_in:+h.get("expires_in")||3600};j.user=await getUser(j.access_token);setSess(j);
    if(h.get("type")==="recovery"){recovery=true;return"recovery"}return"E-mail confirmado. Bem-vindo ao Prognos."}return""}
function showLogin(msg){$("login").hidden=false;$("lmsg").textContent=msg||"";$("lemail").focus()}
let PERFIL=null,perfilModo=false;
const pfCampos=["lnome","lempresa","lunidade"];
function mostraPerfil(on){pfCampos.forEach(id=>{$(id).hidden=!on;$(id).required=on&&id!=="lnome"})}
$("lswap").onclick=()=>{signup=!signup;$("lt").textContent=signup?"Criar conta":"Entrar";$("lgo").textContent=signup?"Criar conta":"Entrar";$("lswap").textContent=signup?"Já tenho conta. Entrar":"Primeiro acesso? Criar conta";$("lpass").autocomplete=signup?"new-password":"current-password";mostraPerfil(signup)};
/* empresa e unidade: pedidas no cadastro; quem já tem conta completa aqui */
function pedirPerfil(msg){perfilModo=true;showLogin(msg||"");$("lt").textContent=PERFIL?"Trocar de unidade":"Complete seu cadastro";$("lgo").textContent="Salvar";mostraPerfil(true);
  ["lemail","lpass"].forEach(id=>{$(id).hidden=true;$(id).required=false});$("lswap").hidden=true;$("lreset").hidden=true;
  const m=SESS?.user?.user_metadata||{};$("lnome").value=PERFIL?.nome||m.nome||"";$("lempresa").value=PERFIL?.empresa||m.empresa||"";$("lunidade").value=PERFIL?.unidade_nome||m.unidade||"";
  $("lunidades").innerHTML=(PERFIL?.unidades||[]).map(u=>`<option value="${esc(u)}">`).join("");$("lempresa").readOnly=!!PERFIL?.compartilhada;$("lunidade").focus()}
function sairPerfil(){perfilModo=false;mostraPerfil(signup);["lemail","lpass"].forEach(id=>{$(id).hidden=false;$(id).required=true});$("lswap").hidden=false;$("lreset").hidden=false;$("lempresa").readOnly=false}
async function salvarPerfil(empresa,unidade,nome){PERFIL=await rpc("definir_organizacao",{empresa,unidade,nome:nome||null});return PERFIL}
function mostraOrg(){$("whoOrg").textContent=PERFIL?`${PERFIL.empresa} · ${PERFIL.unidade_nome}`:""}
$("trocaUni").onclick=()=>pedirPerfil("A base da planta é compartilhada por todos da mesma unidade.");
$("lform").onsubmit=async e=>{e.preventDefault();const email=$("lemail").value.trim(),password=$("lpass").value;$("lgo").disabled=true;$("lmsg").textContent=perfilModo?"Salvando…":signup?"Criando conta…":"Entrando…";
  if(perfilModo){try{const ant=PERFIL?.unidade;await salvarPerfil($("lempresa").value.trim(),$("lunidade").value.trim(),$("lnome").value.trim());sairPerfil();if(ant&&ant!==PERFIL.unidade)await baseTrocouUnidade();await boot()}catch(err){$("lmsg").textContent=String(err.message).replace(/^.*"message":"([^"]+)".*$/,"$1")}$("lgo").disabled=false;return}
  if(recovery){try{const t=await token();const r=await fetch(`${SB_URL}/auth/v1/user`,{method:"PUT",headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({password})});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).msg||"erro "+r.status);recovery=false;$("lemail").hidden=false;$("lemail").required=true;await boot()}catch(err){$("lmsg").textContent=err.message}$("lgo").disabled=false;return}
  try{if(signup){const j=await authCall(`signup?redirect_to=${encodeURIComponent(APP_URL)}`,{email,password,data:{nome:$("lnome").value.trim(),empresa:$("lempresa").value.trim(),unidade:$("lunidade").value.trim()}});if(j.access_token){setSess(j);await boot()}else{$("lmsg").textContent="Conta criada. Abra o e-mail de confirmação e depois entre aqui.";signup=true;$("lswap").click()}}
    else{setSess(await authCall("token?grant_type=password",{email,password}));await boot()}}
  catch(err){$("lmsg").textContent=/confirm/i.test(err.message)?"Confirme seu e-mail pelo link que enviamos e tente de novo.":/invalid/i.test(err.message)?"E-mail ou senha incorretos.":err.message}
  $("lgo").disabled=false};
$("lreset").onclick=async()=>{const email=$("lemail").value.trim();if(!email){$("lmsg").textContent="Digite seu e-mail acima e clique de novo em Esqueci a senha.";$("lemail").focus();return}
  try{await authCall(`recover?redirect_to=${encodeURIComponent(APP_URL)}`,{email});$("lmsg").textContent="Enviamos um link para criar uma nova senha. Abra o e-mail."}catch(err){$("lmsg").textContent=err.message}};
async function boot(){if(!SESS){showLogin();return}try{await token()}catch(e){return}UID=SESS.user?.id;$("whoMail").textContent=SESS.user?.email||"";
  let ok=false;try{ok=await rpc("sou_membro")}catch(e){}if(ok!==true){showLogin("Não foi possível liberar o acesso desta conta. Fale com o suporte Black and White.");return}
  try{PERFIL=await rpc("meu_perfil")}catch(e){PERFIL=null}
  if(!PERFIL){const m=SESS.user?.user_metadata||{};if(m.empresa&&m.unidade){try{await salvarPerfil(m.empresa,m.unidade,m.nome)}catch(e){}}if(!PERFIL){pedirPerfil("Informe a empresa e a unidade onde você trabalha. A base da planta é compartilhada com os colegas da mesma unidade.");return}}
  mostraOrg();admIniciar();$("login").hidden=true;CONV=newConv();renderThread();await listConvs();if(!BASE.ouvintes.size){BASE.ouvintes.add(renderBase);baseIniciar()}renderBase();$("inp").focus()}
(async()=>{const r=await lerRetornoEmail();
  if(r==="recovery"){showLogin("Digite sua nova senha.");$("lt").textContent="Nova senha";$("lgo").textContent="Salvar senha";$("lemail").hidden=true;$("lemail").required=false;$("lswap").hidden=true;$("lpass").autocomplete="new-password";$("lpass").focus();return}
  await boot();if(r&&!$("login").hidden&&!$("lmsg").textContent)$("lmsg").textContent=r;else if(r&&$("login").hidden===false)$("lmsg").textContent=r+" "+$("lmsg").textContent})();

/* ======================= ADMINISTRAÇÃO ======================= */
let PAPEL=null;
async function admIniciar(){try{PAPEL=await rpc("meu_papel")}catch(e){PAPEL=null}const ok=PAPEL&&(PAPEL.master||(PAPEL.unidades||[]).length);$("admLin").hidden=!ok;
  if(ok)$("admLin").querySelector("span").textContent=PAPEL.master?"Administração · master":"Administração · "+PAPEL.unidades.join(", ")}
const dt=t=>t?new Date(t).toLocaleDateString("pt-BR"):"—";
async function admCarregar(){const busca=$("admBusca").value.trim();$("admMsg").textContent="Carregando…";
  try{const [res,us]=await Promise.all([rpc("admin_resumo"),rpc("admin_usuarios",{busca:busca||null})]);
    const K=PAPEL.master?[["usuarios","Usuários"],["confirmados","Confirmados"],["ativos_7d","Ativos 7 dias"],["empresas","Empresas"],["unidades","Unidades"],["ia_hoje","Mensagens de IA hoje"],["eventos","Eventos de falha"],["rede","Lições na rede"],["bloqueados","Bloqueados"]]:[["usuarios","Usuários da unidade"],["ia_hoje","Mensagens de IA hoje"],["eventos","Eventos de falha"]];
    $("admK").innerHTML=K.map(([k,n])=>`<div><b>${fmtN(res?.[k])}</b><small>${n}</small></div>`).join("");
    $("admRows").innerHTML=(us||[]).map(u=>`<tr><td><b>${esc(u.nome||"—")}</b><div class="p">${esc(u.email)}${u.confirmado?"":" · não confirmado"}</div></td>
      <td>${esc(u.empresa||"—")}${u.unidade?" · "+esc(u.unidade):""}${u.dominio?"":`<div class="p">e-mail pessoal: base não compartilhada</div>`}</td>
      <td class="n">${dt(u.criado_em)}</td><td class="n">${dt(u.ultimo_acesso)}</td><td class="n">${fmtN(u.uso_hoje)} / ${fmtN(u.uso_30d)}</td>
      <td>${u.papel?`<span class="tag">${esc(u.papel)}</span>`:""}${u.bloqueado?`<span class="tag bl">bloqueado</span>`:""}${!u.papel&&!u.bloqueado?`<span class="tag">ativo</span>`:""}</td>
      <td>${u.papel==="master"||u.usuario===UID?"":`<button class="btn" data-a="${u.bloqueado?"desbloquear":"bloquear"}" data-u="${u.usuario}">${u.bloqueado?"Desbloquear":"Bloquear"}</button>`}
        ${PAPEL.master&&u.papel!=="master"&&u.unidade_id?`<button class="btn" data-a="${u.papel?"tiraradm":"daradm"}" data-u="${u.usuario}">${u.papel?"Remover admin":"Tornar admin da unidade"}</button>`:""}</td></tr>`).join("")||`<tr><td colspan="7">Nenhum usuário encontrado.</td></tr>`;
    $("admMsg").textContent=`${fmtN(us.length)} usuário(s)`}catch(e){$("admMsg").textContent="Erro: "+String(e.message).slice(0,160)}}
$("admBtn").onclick=()=>{$("adm").hidden=false;admCarregar()};
$("admFechar").onclick=()=>{$("adm").hidden=true};
$("adm").onclick=e=>{if(e.target.id==="adm")$("adm").hidden=true};
let admT=null;$("admBusca").oninput=()=>{clearTimeout(admT);admT=setTimeout(admCarregar,350)};
$("admRows").onclick=async e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,u=b.dataset.u;b.disabled=true;
  try{if(a==="bloquear"){const m=prompt("Motivo do bloqueio (opcional):","");if(m===null){b.disabled=false;return}await rpc("admin_bloquear",{alvo:u,bloquear:true,motivo:m||null})}
    else if(a==="desbloquear")await rpc("admin_bloquear",{alvo:u,bloquear:false});
    else await rpc("admin_definir_admin_unidade",{alvo:u,ativo:a==="daradm"});await admCarregar()}catch(err){$("admMsg").textContent="Erro: "+String(err.message).replace(/^.*"message":"([^"]+)".*$/,"$1").slice(0,160);b.disabled=false}};
