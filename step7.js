/* Prognos · leitor de projeto Siemens STEP 7 (fontes AWL/SCL dentro do .zip do projeto)
   Devolve blocos reais (OB/FB/FC/DB/UDT), quem chama quem e o código das redes — nada é inventado. */
const S7={cache:new Map()};
function s7Dividir(txt){const blocos=new Map();const partes=txt.split(/^(?=(?:ORGANIZATION_BLOCK|FUNCTION_BLOCK|FUNCTION|DATA_BLOCK|TYPE)\s)/m);
  for(const b of partes){const m=/^(ORGANIZATION_BLOCK|FUNCTION_BLOCK|FUNCTION|DATA_BLOCK|TYPE)\s+"?([^"\r\n:]+?)"?\s*(?::.*)?\r?\n/.exec(b);if(!m)continue;
    const kind={ORGANIZATION_BLOCK:"OB",FUNCTION_BLOCK:"FB",FUNCTION:"FC",DATA_BLOCK:"DB",TYPE:"UDT"}[m[1]],nome=m[2].trim();
    const ti=/^TITLE\s*=\s*(.*)$/m.exec(b);const au=/^AUTHOR\s*:\s*(.*)$/m.exec(b);
    blocos.set(nome,{nome,kind,titulo:(ti?.[1]||"").replace(/^'|'$/g,"").trim(),autor:(au?.[1]||"").trim(),texto:b,redes:(b.match(/^NETWORK/gm)||[]).length,chama:[...new Set([...b.matchAll(/^\s*(?:CALL|UC|CC)\s+"?([\w ]+?)"?\s*[\(;\r\n]/gm)].map(x=>x[1].trim()))]})}
  return blocos}
async function s7Projeto(file){const chave=file.name+"|"+file.size+"|"+file.lastModified;if(S7.cache.has(chave))return S7.cache.get(chave);
  await need("zip");const z=await JSZip.loadAsync(await file.arrayBuffer());
  const fontes=Object.keys(z.files).filter(n=>!z.files[n].dir&&/s7asrcom\/.*\.(awl|scl)$/i.test(n)).map(n=>({n,t:z.files[n].date,tam:z.files[n]._data?.uncompressedSize||0}));
  if(!fontes.length)throw new Error("não achei fontes AWL/SCL (pasta s7asrcom) neste ZIP; no SIMATIC Manager gere as fontes dos blocos (Arquivo › Gerar fonte) e compacte de novo");
  const lidos=[];for(const f of fontes){const t=new TextDecoder("latin1").decode(await z.file(f.n).async("arraybuffer"));lidos.push({...f,bl:s7Dividir(t)})}
  const fbs=l=>[...l.bl.values()].filter(b=>b.kind==="FB"||b.kind==="OB").length;
  const principal=[...lidos].sort((a,b)=>fbs(b)-fbs(a)||(b.t-a.t))[0];
  const todos=new Map();for(const l of lidos)for(const [k,v] of l.bl)if(!todos.has(k)||l===principal)todos.set(k,{...v,fonte:l.n});
  const p={principal,fontes:lidos.map(l=>({arquivo:l.n,data:l.t?l.t.toISOString().slice(0,10):"?",blocos:l.bl.size})),blocos:todos,
    tudoNaoFonte:Object.keys(z.files).filter(n=>/\.(mcp|wbd|s7p|s7s)$/i.test(n)||/SYMLIST\.DBF$/i.test(n)).slice(0,6),
    ultimaAlteracao:Object.values(z.files).reduce((m,f)=>f.date&&f.date>m?f.date:m,new Date(0))};
  S7.cache.set(chave,p);return p}
async function s7Consulta(file,{bloco,procurar}){const p=await s7Projeto(file);const out={fonte_usada:p.principal.n,fontes_no_zip:p.fontes,
  aviso:`o código-fonte (AWL/SCL) tem data de ${p.principal.t?p.principal.t.toISOString().slice(0,10):"?"}, enquanto o projeto foi alterado por último em ${p.ultimaAlteracao.toISOString().slice(0,10)}: blocos editados depois podem não estar nesta fonte`};
  const lista=[...p.blocos.values()];
  if(bloco){const re=new RegExp(String(bloco).replace(/[.*+?^${}()|[\]\\]/g,m=>m==="*"?".*":"\\"+m),"i");const achados=lista.filter(b=>re.test(b.nome)).slice(0,4);
    out.blocos=achados.map(b=>{const cab=b.texto.split(/^BEGIN/m)[0],corpo=b.texto.slice(cab.length);const chamadoPor=lista.filter(o=>o.chama.includes(b.nome)).map(o=>o.nome).slice(0,15);
      return {nome:b.nome,tipo:b.kind,titulo:b.titulo,autor:b.autor,redes:b.redes,chama:b.chama,chamado_por:chamadoPor,declaracao:cab.replace(/\t/g," ").replace(/\n\s*\n/g,"\n").slice(0,3500),codigo:corpo.replace(/[ \t]+/g," ").slice(0,9000),cortado:corpo.length>9000}});
    if(!achados.length)out.erro="nenhum bloco com esse nome";return out}
  if(procurar){const re=new RegExp(String(procurar).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i");const r=[];for(const b of lista){const ls=b.texto.split(/\r?\n/);const m=[];ls.forEach((l,i)=>{if(re.test(l)&&m.length<4)m.push(l.trim().slice(0,140))});if(m.length)r.push({bloco:b.nome,tipo:b.kind,trechos:m});if(r.length>=30)break}out.ocorrencias=r;return out}
  const c={};lista.forEach(b=>c[b.kind]=(c[b.kind]||0)+1);out.contagem=c;out.redes_total=lista.reduce((s,b)=>s+b.redes,0);
  out.ob=lista.filter(b=>b.kind==="OB").map(b=>b.nome);out.fb_fc=lista.filter(b=>b.kind==="FB"||b.kind==="FC").map(b=>b.nome+(b.titulo&&!/^AUTHOR|^VERSION/.test(b.titulo)?" ("+b.titulo.slice(0,40)+")":"")).slice(0,300);
  out.db=lista.filter(b=>b.kind==="DB").map(b=>b.nome).slice(0,120);out.dica="use bloco=NOME para ler o código real de um bloco; procurar=TEXTO para achar onde uma tag, tipo ou instrução aparece";return out}
