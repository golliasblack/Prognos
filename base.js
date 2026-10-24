/* Prognos · Black and White — BASE DA PLANTA LOCAL
   O usuário escolhe a pasta do arquivo técnico. O Prognos lê tudo no próprio computador e monta um MAPA:
   para cada arquivo guarda o caminho, o tipo, um resumo curto e as palavras-chave.
   Ele não copia os documentos.
   - O mapa fica no navegador (IndexedDB) e também num arquivo dentro da pasta: _prognos/indice.json.gz.
     Assim ele pode ser reaproveitado em outro computador.
   - Na hora de responder, o Prognos acha os arquivos pelo mapa e abre só os originais certos, direto da pasta,
     para tirar o trecho exato.
   - Só os eventos de manutenção (datas de falha, troca, inspeção) vão para a nuvem. Eles são pequenos e
     alimentam as previsões.
   Funciona no Chrome e no Edge do computador. Nos outros navegadores a pasta precisa ser escolhida a cada visita. */

const BASE={db:null,dir:null,pasta:"",rodando:false,parar:false,suporte:"showDirectoryPicker" in window,
  prog:{fase:"",total:0,feitos:0,lidos:0,bytes:0,eventos:0,erros:0,inicio:0},info:null,ouvintes:new Set(),cache:new Map()};
const STOPW=new Set("que com para por dos das uma uns nos nas sem mais como qual quais onde quando este esta isso esse essa meu minha the and for with from that this sao nao sim ser foi pelo pela entre sobre apos ate tem ter seu sua seus suas aos pagina page de da do em no na os as um ao se ou ja foi sera deve pode cada todo toda todos todas outro outra mesmo muito".split(" "));
const normB=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function termosDe(t,max){const c=new Map();for(const w of normB(t).match(/[a-z0-9](?:[a-z0-9_\-\/.]*[a-z0-9])?/g)||[]){
  if(w.length<3||w.length>40||STOPW.has(w)||/^\d{1,3}$/.test(w)||/^\d+[.,]\d+$/.test(w))continue;const p=/\d/.test(w)&&/[a-z]/.test(w)?3:1;c.set(w,(c.get(w)||0)+p)}
  return [...c.entries()].sort((a,b)=>b[1]-a[1]).slice(0,max).map(x=>x[0])}
function avisa(){for(const f of BASE.ouvintes)try{f()}catch(e){}}

/* ---------- armazenamento no navegador */
function idb(){return BASE.db||(BASE.db=new Promise((res,rej)=>{const r=indexedDB.open("prognos-base",1);
  r.onupgradeneeded=()=>{const d=r.result;const s=d.createObjectStore("docs",{keyPath:"p"});s.createIndex("t","t",{multiEntry:true});d.createObjectStore("kv")};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
const reqP=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const fimTx=t=>new Promise((res,rej)=>{t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)});
async function kvGet(k){const d=await idb();return reqP(d.transaction("kv").objectStore("kv").get(k))}
async function kvSet(k,v){const d=await idb();const t=d.transaction("kv","readwrite");t.objectStore("kv").put(v,k);return fimTx(t)}
async function docsPut(arr){if(!arr.length)return;const d=await idb();const t=d.transaction("docs","readwrite"),s=t.objectStore("docs");arr.forEach(x=>s.put(x));return fimTx(t)}
async function docsDel(keys){if(!keys.length)return;const d=await idb();const t=d.transaction("docs","readwrite"),s=t.objectStore("docs");keys.forEach(k=>s.delete(k));return fimTx(t)}
async function docsClear(){const d=await idb();const t=d.transaction("docs","readwrite");t.objectStore("docs").clear();return fimTx(t)}
async function docsCount(){const d=await idb();return reqP(d.transaction("docs").objectStore("docs").count())}
async function docsAll(){const d=await idb();return reqP(d.transaction("docs").objectStore("docs").getAll())}
async function docsGet(keys){const d=await idb();const s=d.transaction("docs").objectStore("docs");return Promise.all(keys.map(k=>reqP(s.get(k))))}
async function chavesPorTermo(t){const d=await idb();return reqP(d.transaction("docs").objectStore("docs").index("t").getAllKeys(t))}

/* ---------- tipos de arquivo */
const TIPO_EXT={texto:/^(pdf|docx|doc|pptx|ppt|txt|rtf|md|xml|html?|json|log|eml|msg|l5x|l5k|scl|st|awl|stl|exp|iec|prg|udt|ini|cfg)$/,
  tabela:/^(xlsx|xlsm|xls|ods|csv|tsv)$/,imagem:/^(jpe?g|png|tiff?|bmp|gif|webp|heic)$/,video:/^(mp4|avi|mov|mkv|wmv|m4v|3gp)$/,
  cad:/^(dwg|dxf|dgn|step|stp|igs|iges|sldprt|sldasm|slddrw|ipt|iam|idw|prt|asm|catpart|catproduct|x_t|sat|stl|3dm|rvt|ifc)$/,zip:/^(zip)$/};
const tipoDe=ext=>Object.keys(TIPO_EXT).find(k=>TIPO_EXT[k].test(ext))||"outro";
const textoBinario=ab=>{const t=new TextDecoder("latin1").decode(ab);return (t.match(/[A-Za-zÀ-ÿ0-9 ,.;:()\/%°ºª\-]{6,}/g)||[]).filter(s=>/[A-Za-zÀ-ÿ]{3}/.test(s)).join(" ")};

async function extrairTexto(file,ext){
  const tipo=tipoDe(ext),out={k:tipo,texto:"",pg:0,linhas:null};
  if(["imagem","video","cad","outro"].includes(tipo))return out;
  const cap=ext==="pdf"?120e6:60e6;if(file.size>cap){out.nota="grande demais para ler; indexado pelo nome";return out}
  const ab=await file.arrayBuffer();
  if(ext==="pdf"){await need("pdf");const pdf=await pdfjsLib.getDocument({data:ab,isEvalSupported:false}).promise;out.pg=pdf.numPages;const n=Math.min(pdf.numPages,400);let t="";
    for(let p=1;p<=n;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();t+=`\n[p.${p}] `+tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("");pg.cleanup()}
    await pdf.destroy();out.texto=t;if(t.replace(/\s|\[p\.\d+\]/g,"").length<60*Math.min(n,3)){out.k="digitalizado";out.texto=""}return out}
  if(ext==="docx"){await need("docx");out.texto=(await mammoth.extractRawText({arrayBuffer:ab})).value;return out}
  if(ext==="pptx"){await need("zip");const z=await JSZip.loadAsync(ab);const fs=Object.keys(z.files).filter(f=>/ppt\/slides\/slide\d+\.xml$/.test(f)).sort((x,y)=>+x.match(/(\d+)\.xml/)[1]-+y.match(/(\d+)\.xml/)[1]);
    for(const f of fs){const x=await z.file(f).async("string");out.texto+=`\n[slide ${f.match(/(\d+)\.xml/)[1]}] `+(x.match(/<a:t>[^<]*<\/a:t>/g)||[]).map(s=>s.replace(/<\/?a:t>/g,"")).join(" ")}return out}
  if(tipo==="tabela"){const linhas=[];if(/^(csv|tsv)$/.test(ext))linhas.push(...splitCSV(decodeText(ab)));
    else{await need("xlsx");const wb=XLSX.read(ab,{type:"array",cellDates:true});for(const nm of wb.SheetNames.slice(0,12)){const r=XLSX.utils.sheet_to_json(wb.Sheets[nm],{header:1,raw:true,defval:""});out.texto+=`\n[aba ${nm}]\n`;linhas.push(...r);if(linhas.length>200000)break}}
    out.linhas=linhas;out.texto+=linhas.slice(0,3000).map(r=>r.map(c=>c instanceof Date?iso(c):String(c??"")).join(" | ")).join("\n");return out}
  if(ext==="zip"){await need("zip");const z=await JSZip.loadAsync(ab);out.texto="Conteúdo do ZIP: "+Object.keys(z.files).slice(0,500).join(" ");return out}
  if(/^(doc|ppt|msg)$/.test(ext)){out.texto=textoBinario(ab);return out}
  let t=decodeText(ab);if(/^(html?|xml|eml)$/.test(ext))t=t.replace(/<(script|style)[\s\S]*?<\/\1>/gi," ").replace(/<[^>]+>/g," ");
  if(ext==="rtf")t=t.replace(/\\[a-z]+-?\d* ?|[{}]/g," ");out.texto=t;return out}

/* ---------- exportações SAP e históricos em planilha viram eventos */
const TIPO_EVENTO=[["troca_preventiva",/preventiv/i],["troca_corretiva",/troc|substitu/i],["falha",/quebr|falh|travad|romp|queim|desarm|curto|parad[ao] n|emerg/i],
  ["inspecao",/inspe|rota|verifica/i],["medicao",/medi[cç]|mm\/s|termograf|an[aá]lise de [oó]leo/i],["reparo",/repar|solda|recupera|ajust/i]];
const celB=v=>v instanceof Date?iso(v):String(v??"").trim();
function eventosDeTabela(linhas,nome){if(!linhas||linhas.length<2)return [];const hi=headerRow(linhas),cab=(linhas[hi]||[]).map(c=>normB(celB(c)));
  const col=(...ps)=>{for(const p of ps)for(let j=0;j<cab.length;j++)if(p.test(cab[j]))return j;return -1};
  const cd=col(/data|date|inicio|criad|fim|conclus/),cn=col(/^nota|n.?\s*nota|notifica/),co=col(/^ordem|n.?\s*ordem|\bom\b|order/),ce=col(/equipament|equip|local de inst|loc\.? ?inst|tag|ativo|func.*loc/);
  const ctx=cab.map((h,j)=>/descri|texto|text|observ|sintoma|problema|causa|acao|servico|relato|breve/.test(h)?j:-1).filter(j=>j>=0),ctp=col(/tipo de nota|tipo de ordem|^tipo|tp\.? ?nota|tp\.? ?ordem|categoria/);
  if(cd<0||(cn<0&&co<0&&ce<0)||!ctx.length)return [];
  const evs=[];for(const r of linhas.slice(hi+1)){const d=parseDate(r[cd]);if(!d)continue;const txt=ctx.map(j=>celB(r[j])).filter(Boolean).join(" / ").slice(0,500);if(!txt)continue;
    const base=(ctp>=0?celB(r[ctp])+" ":"")+txt,tipo=(TIPO_EVENTO.find(([,p])=>p.test(base))||["outro"])[0],nota=cn>=0?celB(r[cn]):"",ordem=co>=0?celB(r[co]):"",eq=ce>=0?celB(r[ce]):"";
    evs.push({data:iso(d),tipo_evento:tipo,equipamento:eq.slice(0,200)||null,texto:txt,fonte:"SAP: "+nome,nota_sap:nota||null,ordem_sap:ordem||null,chave:`sap|${nota||ordem}|${iso(d)}|${txt.slice(0,40)}`.toLowerCase()})}
  return evs}
async function enviarEventos(evs){for(let i=0;i<evs.length;i+=300)await sb("eventos?on_conflict=unidade,chave",{method:"POST",body:evs.slice(i,i+300),headers:{Prefer:"resolution=ignore-duplicates,return=minimal"}})}

/* ---------- pasta */
async function* andarPasta(dir,pre=""){for await(const [nome,h] of dir.entries()){if(/^(\.|~\$|_prognos$|\$recycle|system volume|thumbs\.db$|desktop\.ini$)/i.test(nome))continue;
  const p=pre?pre+"/"+nome:nome;if(h.kind==="directory")yield* andarPasta(h,p);else yield [p,h]}}
async function permissao(dir,pedir){const o={mode:"readwrite"};if(await dir.queryPermission(o)==="granted")return true;if(!pedir)return false;return (await dir.requestPermission(o))==="granted"}
/* o caminho no mapa começa pelo nome da pasta raiz: "1 - Arquivo Tecnico/Laminador/manual.pdf" */
const raizDe=p=>p.split("/")[0];
async function abrirArquivo(caminho){if(!BASE.dir||raizDe(caminho)!==BASE.pasta)throw new Error("pasta não conectada neste computador");
  let d=BASE.dir;const ps=caminho.split("/").slice(1);for(const p of ps.slice(0,-1))d=await d.getDirectoryHandle(p);return (await d.getFileHandle(ps.at(-1))).getFile()}
const slugB=s=>normB(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"pasta";

/* ---------- raízes (pastas) que compõem a base da unidade */
async function raizes(){return (await kvGet("raizes"))||{}}
async function gravaRaiz(nome,dados){const r=await raizes();r[nome]={...(r[nome]||{}),...dados};await kvSet("raizes",r);BASE.info=resumoRaizes(r);return r}
function resumoRaizes(r){const v=Object.values(r);if(!v.length)return null;return {arquivos:v.reduce((s,x)=>s+(x.arquivos||0),0),bytes:v.reduce((s,x)=>s+(x.bytes||0),0),atualizado:Math.max(...v.map(x=>x.atualizado||0)),pastas:Object.keys(r),semPasta:v.every(x=>x.semPasta)}}

async function baseIniciar(){try{BASE.info=resumoRaizes(await raizes());const dir=await kvGet("pasta");if(dir){BASE.pasta=dir.name;if(await permissao(dir,false))BASE.dir=dir}}catch(e){}avisa();
  await baseSincronizar().catch(e=>console.warn("mapa da unidade:",e));
  if(BASE.dir)baseAtualizar({silencioso:true})}
async function baseTrocouUnidade(){BASE.parar=true;await docsClear();await kvSet("raizes",{});BASE.info=null;BASE.cache.clear();avisa()}
async function baseEscolherPasta(){
  if(!BASE.suporte){const inp=document.createElement("input");inp.type="file";inp.webkitdirectory=true;inp.multiple=true;inp.onchange=()=>baseIndexarLista([...inp.files]);inp.click();return}
  let dir;try{dir=await window.showDirectoryPicker({id:"prognos-base",mode:"readwrite"})}catch(e){return}
  BASE.dir=dir;BASE.pasta=dir.name;await kvSet("pasta",dir);
  const r=await raizes();if(!r[dir.name])await importarIndice();
  baseAtualizar()}
async function baseReconectar(){const dir=await kvGet("pasta");if(!dir)return baseEscolherPasta();if(await permissao(dir,true)){BASE.dir=dir;BASE.pasta=dir.name;avisa();baseAtualizar()}}
function basePausar(){BASE.parar=true}
async function docsDaRaiz(raiz){return (await docsAll()).filter(d=>raizDe(d.p)===raiz)}

/* ---------- arquivo de índice dentro da pasta */
async function salvarIndice(){if(!BASE.dir)return;try{const docs=await docsDaRaiz(BASE.pasta);const json=JSON.stringify({versao:2,pasta:BASE.pasta,gerado:new Date().toISOString(),docs});
  const dp=await BASE.dir.getDirectoryHandle("_prognos",{create:true}),fh=await dp.getFileHandle("indice.json.gz",{create:true}),w=await fh.createWritable();
  await new Blob([json]).stream().pipeThrough(new CompressionStream("gzip")).pipeTo(w)}catch(e){console.warn("índice na pasta:",e)}}
async function importarIndice(){try{const dp=await BASE.dir.getDirectoryHandle("_prognos"),f=await (await dp.getFileHandle("indice.json.gz")).getFile();
  const txt=await new Response(f.stream().pipeThrough(new DecompressionStream("gzip"))).text(),j=JSON.parse(txt);
  const docs=j.versao>=2?j.docs:j.docs.map(d=>({...d,p:BASE.pasta+"/"+d.p}));
  for(let i=0;i<docs.length;i+=2000)await docsPut(docs.slice(i,i+2000));return true}catch(e){return false}}

/* ---------- mapa da unidade na nuvem: quem conecta a pasta publica; os colegas recebem pronto */
const PARTE=4000;
async function stg(metodo,caminho,corpo,tipo){const t=await token();const r=await fetch(`${SB_URL}/storage/v1/object/${caminho}`,{method:metodo,headers:{apikey:SB_KEY,Authorization:"Bearer "+t,...(tipo?{"Content-Type":tipo,"x-upsert":"true"}:{})},body:corpo});if(!r.ok)throw new Error(`armazenamento ${r.status}`);return r}
const gz=async txt=>new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream("gzip"))).blob();
const ungz=async blob=>new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).text();
async function publicarMapa(raiz){if(typeof PERFIL==="undefined"||!PERFIL?.unidade)return;const docs=await docsDaRaiz(raiz),pre=`mapas/${PERFIL.unidade}/${slugB(raiz)}`;
  const partes=Math.ceil(docs.length/PARTE);for(let i=0;i<partes;i++)await stg("POST",`${pre}/parte-${String(i).padStart(4,"0")}.json.gz`,await gz(JSON.stringify(docs.slice(i*PARTE,(i+1)*PARTE))),"application/gzip");
  const r=(await raizes())[raiz]||{};const man={pasta:raiz,arquivos:docs.length,bytes:r.bytes||0,atualizado:Date.now(),partes,por:PERFIL.nome||SESS?.user?.email||""};
  await stg("POST",`${pre}/manifesto.json`,JSON.stringify(man),"application/json");await gravaRaiz(raiz,{atualizado:man.atualizado,publicado:man.atualizado})}
async function baseSincronizar(){if(typeof PERFIL==="undefined"||!PERFIL?.unidade)return;const t=await token();
  const r=await fetch(`${SB_URL}/storage/v1/object/list/mapas`,{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({prefix:`${PERFIL.unidade}/`,limit:200})});
  if(!r.ok)return;const pastas=(await r.json()).filter(x=>!x.id).map(x=>x.name);const loc=await raizes();
  for(const sl of pastas){let man;try{man=await (await stg("GET",`authenticated/mapas/${PERFIL.unidade}/${sl}/manifesto.json`)).json()}catch(e){continue}
    const meu=loc[man.pasta];if(meu&&(meu.atualizado||0)>=man.atualizado)continue;if(BASE.rodando&&man.pasta===BASE.pasta)continue;
    BASE.prog.fase="Recebendo o mapa da unidade";avisa();const novos=[];
    for(let i=0;i<man.partes;i++){const b=await (await stg("GET",`authenticated/mapas/${PERFIL.unidade}/${sl}/parte-${String(i).padStart(4,"0")}.json.gz`)).blob();novos.push(...JSON.parse(await ungz(b)))}
    const velhos=(await docsDaRaiz(man.pasta)).map(d=>d.p),manter=new Set(novos.map(d=>d.p));await docsDel(velhos.filter(p=>!manter.has(p)));
    for(let i=0;i<novos.length;i+=2000)await docsPut(novos.slice(i,i+2000));
    await gravaRaiz(man.pasta,{arquivos:man.arquivos,bytes:man.bytes,atualizado:man.atualizado,por:man.por,remoto:true})}
  BASE.prog.fase="";avisa()}

/* ---------- indexação incremental */
async function indexarUm(p,file,ext){const reg={p,n:file.name,e:ext,s:file.size,m:file.lastModified,k:tipoDe(ext),t:[],r:"",pg:0,ev:0};
  const nomeT=termosDe(p.replace(/[\/_]/g," "),24);
  try{const x=await extrairTexto(file,ext);reg.k=x.k;reg.pg=x.pg;if(x.nota)reg.x=x.nota;
    const limpo=x.texto.replace(/\[p\.\d+\]|\[slide \d+\]|\[aba [^\]]*\]/g," ").replace(/\s+/g," ").trim();
    reg.r=limpo.slice(0,420);reg.t=[...new Set([...nomeT,...termosDe(limpo,Math.min(220,40+Math.round(limpo.length/2500)))])];
    if(x.linhas){const evs=eventosDeTabela(x.linhas,file.name);if(evs.length){await enviarEventos(evs);reg.ev=evs.length;BASE.prog.eventos+=evs.length}}
    BASE.prog.lidos+=limpo?1:0}
  catch(e){reg.t=nomeT;reg.x="não consegui ler: "+String(e.message||e).slice(0,80);BASE.prog.erros++}
  if(!reg.t.length)reg.t=nomeT;return reg}

async function baseAtualizar({silencioso}={}){if(BASE.rodando||!BASE.dir)return;if(!(await permissao(BASE.dir,!silencioso))){BASE.dir=null;avisa();return}
  BASE.rodando=true;BASE.parar=false;const P=BASE.prog,raiz=BASE.pasta;Object.assign(P,{fase:"Mapeando a pasta",total:0,feitos:0,lidos:0,bytes:0,eventos:0,erros:0,inicio:Date.now()});avisa();
  let mudou=false;
  try{const conhecidos=new Map((await docsDaRaiz(raiz)).map(d=>[d.p,d]));const fila=[],vistos=new Set();let tot=0,bytes=0;
    for await(const [rel,h] of andarPasta(BASE.dir)){if(BASE.parar)break;const p=raiz+"/"+rel,f=await h.getFile();vistos.add(p);tot++;bytes+=f.size;const k=conhecidos.get(p);
      if(!k||k.s!==f.size||k.m!==f.lastModified)fila.push([p,h]);if(tot%500===0){P.total=tot;P.bytes=bytes;avisa();await new Promise(r=>setTimeout(r,0))}}
    if(!BASE.parar){const sumiram=[...conhecidos.keys()].filter(p=>!vistos.has(p));if(sumiram.length){mudou=true;await docsDel(sumiram)}}
    P.total=fila.length;P.bytes=bytes;P.fase=fila.length?"Lendo os arquivos":"Base em dia";avisa();
    const lote=[];let ult=Date.now();if(fila.length)mudou=true;
    for(const [p,h] of fila){if(BASE.parar)break;const f=await h.getFile(),ext=(f.name.split(".").pop()||"").toLowerCase();
      lote.push(await indexarUm(p,f,ext));P.feitos++;
      if(lote.length>=40||Date.now()-ult>4000){await docsPut(lote.splice(0));ult=Date.now();avisa()}
      if(P.feitos%800===0)await salvarIndice()}
    await docsPut(lote);
    await gravaRaiz(raiz,{arquivos:(await docsDaRaiz(raiz)).length,bytes,atualizado:mudou?Date.now():((await raizes())[raiz]?.atualizado||Date.now()),completo:!BASE.parar,remoto:false});
    if(mudou||!(await raizes())[raiz]?.publicado){await salvarIndice();P.fase="Compartilhando o mapa com a unidade";avisa();await publicarMapa(raiz).catch(e=>console.warn("publicar mapa:",e))}
    P.fase=BASE.parar?"Pausado":"Base em dia"}
  catch(e){P.fase="Erro: "+(e.message||e);console.error(e)}
  BASE.rodando=false;BASE.parar=false;avisa()}

/* navegadores sem acesso a pasta: lê a lista escolhida (não reabre os originais depois) */
async function baseIndexarLista(files){if(BASE.rodando||!files.length)return;BASE.rodando=true;BASE.parar=false;const raiz=(files[0].webkitRelativePath||"").split("/")[0]||"pasta";
  const P=BASE.prog;Object.assign(P,{fase:"Lendo os arquivos",total:files.length,feitos:0,lidos:0,bytes:files.reduce((s,f)=>s+f.size,0),eventos:0,erros:0,inicio:Date.now()});avisa();
  const lote=[];for(const f of files){if(BASE.parar)break;const p=f.webkitRelativePath||raiz+"/"+f.name;lote.push(await indexarUm(p,f,(f.name.split(".").pop()||"").toLowerCase()));P.feitos++;if(lote.length>=40){await docsPut(lote.splice(0));avisa()}}
  await docsPut(lote);await gravaRaiz(raiz,{arquivos:(await docsDaRaiz(raiz)).length,bytes:P.bytes,atualizado:Date.now(),completo:!BASE.parar,semPasta:true});
  await publicarMapa(raiz).catch(e=>console.warn("publicar mapa:",e));P.fase="Base em dia";BASE.rodando=false;avisa()}

/* ---------- busca pelo mapa + leitura dos originais */
async function textoDoArquivo(p){if(BASE.cache.has(p))return BASE.cache.get(p);if(!BASE.dir||raizDe(p)!==BASE.pasta)return null;
  const f=await abrirArquivo(p),x=await extrairTexto(f,(f.name.split(".").pop()||"").toLowerCase());BASE.cache.set(p,x.texto);if(BASE.cache.size>8)BASE.cache.delete(BASE.cache.keys().next().value);return x.texto}
function trechosCom(texto,ts,n=3,larg=700){const low=normB(texto),hits=[];for(const t of ts){let i=low.indexOf(t),c=0;while(i>=0&&c<40){hits.push(i);i=low.indexOf(t,i+t.length);c++}}
  hits.sort((a,b)=>a-b);const jan=[];for(const h of hits){const ini=Math.max(0,h-larg/3);if(jan.length&&ini<jan.at(-1).fim)continue;const pedaco=low.slice(ini,ini+larg);jan.push({ini,h,fim:ini+larg,score:ts.filter(t=>pedaco.includes(t)).length})}
  return jan.sort((a,b)=>b.score-a.score).slice(0,n).map(j=>{const k=texto.lastIndexOf("[p.",j.h),pg=k>=0?parseInt(texto.slice(k+3,k+9)):NaN;return {pagina:isNaN(pg)?null:pg,texto:texto.slice(j.ini,j.fim).replace(/\s+/g," ").trim()}})}
async function baseBuscar(consulta,limite=8){if(!(await docsCount().catch(()=>0)))return [];
  const ts=[...new Set(termosDe(consulta,12))];if(!ts.length)return [];const pont=new Map();
  for(const t of ts){const ks=await chavesPorTermo(t);for(const k of ks)pont.set(k,(pont.get(k)||0)+1)}
  const cand=[...pont.entries()].sort((a,b)=>b[1]-a[1]).slice(0,60);const docs=(await docsGet(cand.map(c=>c[0]))).filter(Boolean);
  for(const d of docs){const nm=normB(d.p);d._s=pont.get(d.p)*2+ts.filter(t=>nm.includes(t)).length*3}
  docs.sort((a,b)=>b._s-a._s);const out=[];
  for(const d of docs.slice(0,limite)){let tre=[];if(BASE.dir&&raizDe(d.p)===BASE.pasta&&!["imagem","video","cad","outro","digitalizado"].includes(d.k)){try{const tx=await textoDoArquivo(d.p);if(tx)tre=trechosCom(tx,ts,2)}catch(e){}}
    if(tre.length)tre.forEach(x=>out.push({origem:"arquivo",caminho:d.p,nome:d.n,pagina:x.pagina,texto:x.texto,tipo:d.k}));
    else out.push({origem:"arquivo",caminho:d.p,nome:d.n,pagina:null,texto:d.r||`(${d.k}: só pelo nome)`,tipo:d.k})}
  return out}
async function baseLerArquivo(caminho,{procurar,inicio=0,tamanho=12000}={}){const tx=await textoDoArquivo(caminho);if(tx==null){const [d]=await docsGet([caminho]);return {erro:"O original está na pasta da unidade, que não está conectada neste computador. Use o resumo do mapa ou peça ao usuário para conectar a pasta.",resumo:d?.r||null}}
  if(procurar){const tr=trechosCom(tx,termosDe(procurar,8),5,1500);return {caminho,total:tx.length,trechos:tr}}
  return {caminho,total:tx.length,inicio,texto:tx.slice(inicio,inicio+tamanho),continua:inicio+tamanho<tx.length}}
