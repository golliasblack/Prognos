/* Prognos · Black and White — LEITURA PROFUNDA DA BASE
   Abre o conteúdo dos arquivos que a primeira passada só conhecia pelo nome:
   - DWG (AutoCAD): textos, carimbo, blocos, atributos, cotas e camadas (LibreDWG em WebAssembly);
   - DWF/DWFx: textos das folhas;
   - PDF digitalizado, TIF, JPG, PNG, BMP: OCR em português e inglês (Tesseract), tudo no computador do usuário.
   É lenta (OCR leva segundos por página), roda em segundo plano, pode ser pausada e continua de onde parou. */

/* ---------- DWG */
let DWGW=null,dwgSeq=0;const dwgPend=new Map();
function dwgWorker(){if(DWGW)return DWGW;DWGW=new Worker("vendor/dwg-worker.js",{type:"module"});
  DWGW.onmessage=e=>{const p=dwgPend.get(e.data.id);if(p){dwgPend.delete(e.data.id);clearTimeout(p.t);e.data.ok?p.res(e.data.texto):p.rej(new Error(e.data.erro))}};
  DWGW.onerror=e=>{for(const [,p] of dwgPend){clearTimeout(p.t);p.rej(new Error(e.message||"falha no leitor DWG"))}dwgPend.clear();DWGW?.terminate();DWGW=null};return DWGW}
function dwgTexto(ab,modo){return new Promise((res,rej)=>{const id=++dwgSeq,w=dwgWorker();const t=setTimeout(()=>{dwgPend.delete(id);DWGW?.terminate();DWGW=null;rej(new Error("DWG demorou demais"))},90000);
  dwgPend.set(id,{res,rej,t});w.postMessage({id,buf:ab,modo},[ab])})}
async function dwgGeo(file){const ab=await file.arrayBuffer(),cab=new TextDecoder("latin1").decode(new Uint8Array(ab,0,6));if(!/^AC10(1[89]|2\d|3\d)$/.test(cab))throw new Error("DWG "+(DWG_VERSAO[cab]||cab)+" é antigo demais para ler as cotas; salve como DWG 2004+ ou DXF");return JSON.parse(await dwgTexto(ab,"geo"))}
/* versões antigas (R2000 e anteriores, AC1015-) travam o LibreDWG em WebAssembly; nelas o texto não é compactado, então a varredura binária lê bem */
const DWG_VERSAO={AC1009:"R12",AC1012:"R13",AC1014:"R14",AC1015:"R2000",AC1018:"R2004",AC1021:"R2007",AC1024:"R2010",AC1027:"R2013",AC1032:"R2018"};
async function lerDWG(file){const ab=await file.arrayBuffer(),cab=new TextDecoder("latin1").decode(new Uint8Array(ab,0,6)),ver=DWG_VERSAO[cab]||cab;
  if(!/^AC10(1[89]|2\d|3\d)$/.test(cab)){const t=textoBinario(ab).split(" ").filter(w=>!/^(AcDb|ACDB|ACAD_|AcDim|AcAx|ObjectDBX|Autodesk|ARX|DiDe)/i.test(w)).join(" ");return {k:t.length>80?"desenho":"cad",texto:(`Versão DWG: ${ver}\nTextos: `+t).slice(0,100000),nota:"DWG "+ver+" lido por varredura"}}
  const copia=ab.slice(0);
  try{return {k:"desenho",texto:await dwgTexto(ab)}}catch(e){const t=textoBinario(copia);return {k:t.length>80?"desenho":"cad",texto:t.slice(0,100000),nota:"DWG lido parcialmente"}}}
/* ---------- DWF / DWFx */
async function lerDWF(file){await need("zip");const z=await JSZip.loadAsync(await file.arrayBuffer());let t="";
  for(const n of Object.keys(z.files)){if(z.files[n].dir)continue;if(/\.(xml|fpage|fdseq|fdoc|dsd|txt)$/i.test(n)){const x=await z.file(n).async("string");t+=" "+[...x.matchAll(/UnicodeString="([^"]+)"/g)].map(m=>m[1]).join(" ")+" "+x.replace(/<[^>]+>/g," ")}
    else if(/\.w2d$/i.test(n)){const b=await z.file(n).async("arraybuffer");t+=" "+textoBinario(b)}if(t.length>200000)break}
  return {k:"desenho",texto:t.replace(/\s+/g," ").trim()}}

/* ---------- OCR */
let OCR=null;
async function ocrWorker(){if(OCR)return OCR;await loadScript("vendor/tesseract/tesseract.min.js");const base=new URL("vendor/tesseract/",location.href).href;
  OCR=await Tesseract.createWorker(["por","eng"],1,{workerPath:base+"worker.min.js",corePath:base,langPath:base+"lang",workerBlobURL:false,gzip:true,logger:()=>{}});return OCR}
async function ocrCanvas(cv){const w=await ocrWorker();const r=await w.recognize(cv);const d=r.data||{};return {texto:(d.text||"").replace(/\s+/g," ").trim(),conf:d.confidence||0}}
function canvasDe(img,max=3500){const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c}
async function imagemParaCanvas(file,ext){
  if(/^tiff?$/.test(ext)){await loadScript("vendor/pako.min.js");await loadScript("vendor/utif.js");const ab=await file.arrayBuffer(),ifds=UTIF.decode(ab);if(!ifds.length)throw new Error("TIF vazio");UTIF.decodeImage(ab,ifds[0]);
    const rgba=UTIF.toRGBA8(ifds[0]),W=ifds[0].width,H=ifds[0].height,c=document.createElement("canvas");c.width=W;c.height=H;c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer),W,H),0,0);return {cv:canvasDe(c),paginas:ifds.length}}
  const bmp=await createImageBitmap(file);const cv=canvasDe(bmp);bmp.close?.();return {cv,paginas:1}}
async function lerImagemOCR(file,ext){const {cv,paginas}=await imagemParaCanvas(file,ext);const r=await ocrCanvas(cv);return {k:r.texto.length>20&&r.conf>45?"desenho":"imagem",texto:r.conf>45?r.texto:"",pg:paginas,conf:r.conf}}
async function lerPdfOCR(file,maxPag=4){await need("pdf");const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;let t="";const n=Math.min(pdf.numPages,maxPag);
  for(let p=1;p<=n;p++){const pg=await pdf.getPage(p),vp0=pg.getViewport({scale:1}),esc=Math.min(3,3500/Math.max(vp0.width,vp0.height)),vp=pg.getViewport({scale:esc}),cv=document.createElement("canvas");cv.width=vp.width;cv.height=vp.height;
    await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;const r=await ocrCanvas(cv);if(r.conf>40)t+=`\n[p.${p}] ${r.texto}`;pg.cleanup()}
  await pdf.destroy();return {k:t.length>20?"texto":"digitalizado",texto:t,pg:n}}

/* ---------- áudio e vídeo: duração, resolução, etiquetas e, no vídeo, OCR de quadros (placas, telas, IHM) */
function midiaMeta(file,video){return new Promise(res=>{const el=document.createElement(video?"video":"audio"),url=URL.createObjectURL(file);let fim=false;
  const sai=v=>{if(fim)return;fim=true;clearTimeout(t);res(v)};const t=setTimeout(()=>sai({el,url,ok:false}),12000);el.preload="metadata";el.muted=true;
  el.onloadedmetadata=()=>sai({el,url,ok:true});el.onerror=()=>sai({el,url,ok:false});el.src=url})}
const quadroEm=(el,t)=>new Promise(res=>{const to=setTimeout(()=>res(null),8000);el.onseeked=()=>{clearTimeout(to);const k=Math.min(1,1600/Math.max(el.videoWidth,el.videoHeight)),c=document.createElement("canvas");c.width=Math.round(el.videoWidth*k);c.height=Math.round(el.videoHeight*k);c.getContext("2d").drawImage(el,0,0,c.width,c.height);res(c)};el.currentTime=t});
async function lerMidia(file,ext,video){const partes=[];const cab=await file.slice(0,Math.min(file.size,512e3)).arrayBuffer();
  const tags=(textoBinario(cab)+" "+textoUTF16(cab)).split(" ").filter(w=>w.length>2&&!/^(Lavf|LAME|Xing|Info|isom|mp4|avc|mdat|moov|ftyp|free|uuid)/i.test(w)).slice(0,60).join(" ");
  const m=await midiaMeta(file,video);try{if(m.ok){const d=m.el.duration;if(isFinite(d))partes.push("Duração "+(d>=60?Math.floor(d/60)+" min "+Math.round(d%60)+" s":Math.round(d)+" s"));
      if(video&&m.el.videoWidth){partes.push(`Vídeo ${m.el.videoWidth}x${m.el.videoHeight}`);const ts=isFinite(d)&&d>4?[d*.1,d*.5,d*.9]:[0.5];let ocr="";
        for(const t of ts){const c=await quadroEm(m.el,t);if(!c)continue;const r=await ocrCanvas(c);if(r.conf>55&&r.texto.length>8)ocr+=` [${Math.round(t)} s] `+r.texto}if(ocr)partes.push("Textos no vídeo:"+ocr)}}}
  finally{URL.revokeObjectURL(m.url);m.el.removeAttribute("src");m.el.load?.()}
  if(tags.length>8)partes.push("Etiquetas: "+tags);return {k:video?"video":"audio",texto:partes.join("\n"),nota:video?undefined:"áudio indexado por etiquetas e duração (sem transcrição)"}}

/* ---------- a passada profunda */
const PROF={rodando:false,parar:false,feitos:0,total:0,fase:"",inicio:0,erros:0};
/* entra na passada profunda tudo que a primeira leitura só conheceu pelo nome, inclusive formatos que o Prognos passou a ler depois */
const NOVOS_TEXTO=/^(odt|ott|odp|docm|dotx|pptm|ppsx|pps|svg|conf|yaml|yml|bat|cmd|ps1|vbs|sh|py|js|sql|reg|nfo|tex|srt|vtt|xaml|plcopen|tsproj|ap\d+|s7p|acd|mer|apa|xlsb|ots)$/;
const precisaProfunda=d=>!d.pf&&((d.k==="cad"&&/^(dwg|dwf|dwfx)$/.test(d.e))||d.k==="digitalizado"||(d.k==="imagem"&&/^(tiff?|jpe?g|png|bmp|gif|webp)$/.test(d.e))
  ||d.k==="video"||d.k==="audio"||d.k==="outro"||d.k==="programa"||(d.k==="zip"&&!/^zip$/.test(d.e))||NOVOS_TEXTO.test(d.e)||(d.e==="zip"&&!/\n\[/.test(d.r||"")&&!d.zl));
const prioridade=d=>/^(dwg|dwf|dwfx)$/.test(d.e)?0:d.k==="digitalizado"?1:/^tiff?$/.test(d.e)?2:d.k==="imagem"?3:d.k==="video"?5:4;
async function baseProfunda(){if(PROF.rodando||!BASE.dir)return;if(!(await permissao(BASE.dir,true))){BASE.dir=null;avisa();return}
  PROF.rodando=true;PROF.parar=false;PROF.erros=0;PROF.inicio=Date.now();avisa();
  try{const raiz=BASE.pasta;const fila=[];const d=await idb();
    await new Promise((res,rej)=>{const r=d.transaction("docs").objectStore("docs").openCursor(IDBKeyRange.bound(raiz+"/",raiz+"/￿"));r.onsuccess=()=>{const c=r.result;if(!c)return res();const v=c.value;if(precisaProfunda(v))fila.push({p:v.p,e:v.e,k:v.k});c.continue()};r.onerror=()=>rej(r.error)});
    fila.sort((a,b)=>prioridade(a)-prioridade(b));PROF.total=fila.length;PROF.feitos=0;avisa();const lote=[];let ult=Date.now(),mudou=0;
    for(const item of fila){if(PROF.parar)break;PROF.fase=/^(dwg|dwf|dwfx)$/.test(item.e)?"Lendo desenhos CAD":item.k==="digitalizado"?"Lendo PDFs digitalizados (OCR)":item.k==="imagem"?"Lendo imagens e TIF (OCR)":item.k==="video"?"Lendo vídeos (quadros com OCR)":"Abrindo pacotes, programas e outros formatos";
      try{const [doc]=await docsGet([item.p]);const f=await abrirArquivo(item.p);let x;
        if(f.size>150e6)x={k:doc.k,texto:"",nota:"grande demais"};else if(item.e==="dwg")x=await lerDWG(f);else if(/^dwfx?$/.test(item.e))x=await lerDWF(f);else if(item.k==="digitalizado")x=await lerPdfOCR(f);else if(item.k==="imagem")x=await lerImagemOCR(f,item.e);
        else if(item.k==="video"||item.k==="audio")x=await lerMidia(f,item.e,item.k==="video");else{const y=await extrairTexto(f,item.e);x={k:y.k==="outro"?doc.k:y.k,texto:y.texto||"",nota:y.nota};if(item.e==="zip")doc.zl=1}
        const limpo=(x.texto||"").replace(/\[p\.\d+\]/g," ").replace(/\s+/g," ").trim();const nomeT=termosDe(item.p.replace(/[\/_]/g," "),24);
        Object.assign(doc,{pf:1,k:limpo?x.k:doc.k,r:limpo?limpo.slice(0,420):doc.r,t:[...new Set([...nomeT,...termosDe(limpo,Math.min(220,40+Math.round(limpo.length/2500)))])]});if(x.nota)doc.x=x.nota;if(limpo)mudou++;lote.push(doc)}
      catch(e){PROF.erros++;const [doc]=await docsGet([item.p]).catch(()=>[null]);if(doc){doc.pf=1;doc.x="leitura profunda falhou: "+String(e.message||e).slice(0,60);lote.push(doc)}}
      PROF.feitos++;if(lote.length>=25||Date.now()-ult>5000){await docsPut(lote.splice(0));ult=Date.now();avisa()}
      if(PROF.feitos%1500===0){await salvarIndice();await publicarMapa(raiz).catch(()=>{})}
      await new Promise(r=>setTimeout(r,0))}
    await docsPut(lote);if(mudou){await salvarIndice();await gravaRaiz(raiz,{atualizado:Date.now()});await publicarMapa(raiz).catch(()=>{})}
    PROF.fase=PROF.parar?"Leitura profunda pausada":"Leitura profunda concluída"}
  catch(e){PROF.fase="Erro na leitura profunda: "+(e.message||e)}
  PROF.rodando=false;avisa()}
async function contarPendentesProfunda(){if(!BASE.pasta)return 0;const d=await idb();let n=0;await new Promise(res=>{const r=d.transaction("docs").objectStore("docs").openCursor(IDBKeyRange.bound(BASE.pasta+"/",BASE.pasta+"/￿"));r.onsuccess=()=>{const c=r.result;if(!c)return res();if(precisaProfunda(c.value))n++;c.continue()};r.onerror=()=>res()});return n}
