/* Prognos · Black and White — LEITOR UNIVERSAL DE CLP E SIMULADOR 3D DA LÓGICA
   Lê o programa do CLP, executa o ciclo de varredura no navegador e mostra o processo em 3D reagindo à lógica.
   - Leitura direta:
     · Ladder Rockwell (L5X / texto neutro: XIC, XIO, OTE, OTL, OTU, TON, TOF, RTO, CTU, CTD, RES, comparações, MOV, CPT...).
     · Texto estruturado IEC 61131-3 / Siemens SCL / CODESYS / TwinCAT (IF, CASE, FOR, WHILE, TON, TOF, TP, CTU, CTD, R_TRIG...).
     · Lista de instruções Siemens AWL/STL, IEC IL e Mitsubishi (LD/AND/OR/OUT/SET/RST, temporizadores e contadores).
   - Qualquer outro dialeto ou fabricante (Omron, Schneider, ABB, GE, WEG, Delta, Ladder gráfico do TIA...):
     a IA traduz o programa para texto estruturado equivalente e o simulador executa.
   Tempos internos em milissegundos. */

/* ======================= TAGS ======================= */
const SIM_FB={TON:1,TOF:1,TP:1,CTU:1,CTD:1,CTUD:1,R_TRIG:1,F_TRIG:1,SR:1,RS:1,TIMER:1,COUNTER:1,IEC_TIMER:1};
function novoEstado(){return {v:new Map(),tipo:new Map(),io:new Map(),desc:new Map(),lidos:new Set(),escritos:new Set(),t:0}}
const nk=s=>String(s).replace(/^["#]+|"+$/g,"").replace(/"\./g,".").replace(/^%/,"%").trim().toUpperCase();
function fbNovo(tipo){tipo=String(tipo||"").toUpperCase();
  if(tipo==="TIMER")return {_fb:"TIMER",PRE:0,ACC:0,EN:false,TT:false,DN:false};
  if(tipo==="COUNTER")return {_fb:"COUNTER",PRE:0,ACC:0,CU:false,CD:false,DN:false,OV:false,UN:false};
  if(/^(TON|TOF|TP|IEC_TIMER)$/.test(tipo))return {_fb:tipo==="IEC_TIMER"?"TON":tipo,IN:false,PT:0,Q:false,ET:0,_m:false};
  if(/^(CTU|CTD|CTUD)$/.test(tipo))return {_fb:tipo,CU:false,CD:false,R:false,LD:false,PV:0,CV:0,Q:false,QU:false,QD:false,_mu:false,_md:false};
  if(/^(R_TRIG|F_TRIG)$/.test(tipo))return {_fb:tipo,CLK:false,Q:false,M:false};
  if(/^(SR|RS)$/.test(tipo))return {_fb:tipo,S1:false,S:false,R:false,R1:false,Q1:false};
  return null}
function declara(E,nome,tipo,{io,ini,desc}={}){const k=nk(nome);tipo=String(tipo||"BOOL").toUpperCase().replace(/^IEC_TIMER$/,"TON");
  if(!E.tipo.has(k))E.tipo.set(k,tipo);if(io&&!E.io.has(k))E.io.set(k,io);if(desc&&!E.desc.has(k))E.desc.set(k,desc);
  if(!E.v.has(k)){const fb=SIM_FB[tipo]?fbNovo(tipo):null;E.v.set(k,fb||(ini!=null?ini:/BOOL/.test(tipo)?false:0))}return k}
const ATOM=/^%?[IQMEAXYV][XBWD]?\d+\.\d+$/;
const partes=k=>ATOM.test(k)?[k]:k.split(".");
function getV(E,nome){const k=nk(nome);const p=partes(k);let o=E.v.get(p[0]);
  if(o===undefined){const st=k.match(/^(.+)\.(\d+)$/);if(st&&E.v.has(st[1]))return !!(Math.trunc(+E.v.get(st[1]))>>+st[2]&1);E.v.set(p[0],p.length>1&&/^(Q|DN|EN|TT|ET|ACC|PRE|CV|PV|CU|CD)$/.test(p[1])?fbNovo(/^(DN|EN|TT|ACC|PRE)$/.test(p[1])?"TIMER":/^(CV|PV|CU|CD)$/.test(p[1])?"CTU":"TON"):false);o=E.v.get(p[0])}
  E.lidos.add(p[0]);for(const q of p.slice(1)){if(o&&typeof o==="object")o=o[q];else{const bit=+q;return !isNaN(bit)?!!(Math.trunc(+o)>>bit&1):undefined}}return o}
function setV(E,nome,val){const k=nk(nome),p=partes(k);E.escritos.add(p[0]);if(p.length===1){const t=E.tipo.get(k);if(t==="BOOL"||(t==null&&typeof val==="boolean"))val=!!val;else if(/INT|WORD|DINT|BYTE/.test(t||""))val=Math.trunc(+val||0);E.v.set(k,val);return}
  let o=E.v.get(p[0]);if(o==null||typeof o!=="object"){if(!isNaN(+p[1])&&p.length===2){let w=Math.trunc(+o||0);w=val?w|(1<<+p[1]):w&~(1<<+p[1]);E.v.set(p[0],w);return}o={};E.v.set(p[0],o)}
  for(const q of p.slice(1,-1)){if(o[q]==null||typeof o[q]!=="object")o[q]={};o=o[q]}o[p.at(-1)]=val}

/* ======================= BLOCOS IEC (TON, TOF, TP, CTU...) ======================= */
function execFB(fb,dt){switch(fb._fb){
  case"TON":if(fb.IN){fb.ET=Math.min(fb.PT,fb.ET+dt);fb.Q=fb.ET>=fb.PT}else{fb.ET=0;fb.Q=false}break;
  case"TOF":if(fb.IN){fb.Q=true;fb.ET=0}else if(fb.Q){fb.ET=Math.min(fb.PT,fb.ET+dt);if(fb.ET>=fb.PT)fb.Q=false}break;
  case"TP":if(fb.IN&&!fb._m&&!fb.Q){fb.Q=true;fb.ET=0}if(fb.Q){fb.ET=Math.min(fb.PT,fb.ET+dt);if(fb.ET>=fb.PT)fb.Q=false}else if(!fb.IN)fb.ET=0;fb._m=fb.IN;break;
  case"CTU":case"CTD":case"CTUD":if(fb.R)fb.CV=0;else if(fb.LD)fb.CV=fb.PV;else{if(fb.CU&&!fb._mu&&fb._fb!=="CTD")fb.CV++;if(fb.CD&&!fb._md&&fb._fb!=="CTU")fb.CV--}
    fb._mu=fb.CU;fb._md=fb.CD;fb.QU=fb.CV>=fb.PV;fb.QD=fb.CV<=0;fb.Q=fb._fb==="CTD"?fb.QD:fb.QU;break;
  case"R_TRIG":fb.Q=fb.CLK&&!fb.M;fb.M=fb.CLK;break;
  case"F_TRIG":fb.Q=!fb.CLK&&fb.M;fb.M=fb.CLK;break;
  case"SR":fb.Q1=fb.S1||(fb.Q1&&!fb.R);break;
  case"RS":fb.Q1=!fb.R1&&(fb.S||fb.Q1);break}}

/* ======================= TEXTO ESTRUTURADO (ST / SCL) ======================= */
const ST_KW=new Set("IF THEN ELSIF ELSE END_IF CASE OF END_CASE FOR TO BY DO END_FOR WHILE END_WHILE REPEAT UNTIL END_REPEAT RETURN EXIT AND OR XOR NOT MOD TRUE FALSE".split(" "));
function tempoMs(s){s=s.replace(/^(T|TIME|LT|LTIME|S5T)#/i,"").replace(/_/g,"");let ms=0,m;const re=/(\d+(?:\.\d+)?)(ms|d|h|m|s)/gi;while((m=re.exec(s)))ms+=+m[1]*{d:864e5,h:36e5,m:6e4,s:1e3,ms:1}[m[2].toLowerCase()];return ms}
function stLex(src){const t=[];let i=0;const s=src;
  while(i<s.length){const c=s[i];
    if(/\s/.test(c)){i++;continue}
    if(s.startsWith("(*",i)){const j=s.indexOf("*)",i+2);i=j<0?s.length:j+2;continue}
    if(s.startsWith("//",i)){const j=s.indexOf("\n",i);i=j<0?s.length:j;continue}
    if(s.startsWith("/*",i)){const j=s.indexOf("*/",i+2);i=j<0?s.length:j+2;continue}
    let m=s.slice(i).match(/^(?:L?T|L?TIME|S5T)#[\d_.a-z]+/i);if(m){t.push({k:"n",v:tempoMs(m[0])});i+=m[0].length;continue}
    m=s.slice(i).match(/^(\d+)#([0-9a-f_]+)/i);if(m){t.push({k:"n",v:parseInt(m[2].replace(/_/g,""),+m[1])});i+=m[0].length;continue}
    m=s.slice(i).match(/^\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?/i);if(m){t.push({k:"n",v:+m[0].replace(/_/g,"")});i+=m[0].length;continue}
    m=s.slice(i).match(/^'[^']*'/);if(m){t.push({k:"s",v:m[0].slice(1,-1)});i+=m[0].length;continue}
    m=s.slice(i).match(/^(?:"[^"]+"|#?[A-Za-z_][\w]*|%[IQMDTCixqmdbw]+[\d.]+)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_]\w*|\d+)|\s*\[[^\]]+\])*/);
    if(m){const raw=m[0].replace(/\s+/g,""),up=raw.toUpperCase();if(ST_KW.has(up))t.push({k:"kw",v:up});else t.push({k:"id",v:raw});i+=m[0].length;continue}
    m=s.slice(i).match(/^(:=|=>|<=|>=|<>|\*\*|[-+*\/()=<>,;:&\[\]])/);if(m){t.push({k:"op",v:m[0]});i+=m[0].length;continue}
    i++}return t}
function stParse(src){const T=stLex(src);let p=0;const pk=(o=0)=>T[p+o]||{k:"eof"},is=(k,v)=>{const x=pk();return x.k===k&&(v==null||x.v===v)},eat=(k,v)=>{if(!is(k,v))throw new Error(`esperado ${v||k}, achei ${pk().v??"fim"}`);return T[p++]},opt=(k,v)=>is(k,v)?T[p++]:null;
  const FIM=new Set(["END_IF","ELSIF","ELSE","END_CASE","END_FOR","END_WHILE","UNTIL","END_REPEAT"]);
  function bloco(){const out=[];while(pk().k!=="eof"&&!(pk().k==="kw"&&FIM.has(pk().v))){if(caseLabel())break;const s=stmt();if(s)out.push(s)}return out}
  function caseLabel(){if(!caseDepth)return false;let j=p;while(T[j]&&(T[j].k==="n"||(T[j].k==="op"&&/[,.-]/.test(T[j].v))||(T[j].k==="id"&&T[j+1]?.v===":")))j++;return j>p&&T[j]?.k==="op"&&T[j].v===":"&&T[j+1]?.v!=="="}
  let caseDepth=0;
  function stmt(){if(opt("op",";"))return null;const x=pk();
    if(x.k==="kw"&&x.v==="IF"){p++;const ramos=[];let c=expr();eat("kw","THEN");ramos.push([c,bloco()]);let senao=null;
      while(opt("kw","ELSIF")){c=expr();eat("kw","THEN");ramos.push([c,bloco()])}if(opt("kw","ELSE"))senao=bloco();eat("kw","END_IF");opt("op",";");return {t:"if",ramos,senao}}
    if(x.k==="kw"&&x.v==="CASE"){p++;const e=expr();eat("kw","OF");caseDepth++;const casos=[];let senao=null;
      while(!is("kw","END_CASE")&&!is("kw","ELSE")&&pk().k!=="eof"){const rot=[];do{const a=expr();if(opt("op",".")){opt("op",".");rot.push([a,expr()])}else rot.push([a,a])}while(opt("op",","));eat("op",":");casos.push([rot,bloco()])}
      if(opt("kw","ELSE"))senao=bloco();caseDepth--;eat("kw","END_CASE");opt("op",";");return {t:"case",e,casos,senao}}
    if(x.k==="kw"&&x.v==="FOR"){p++;const v=eat("id").v;eat("op",":=");const a=expr();eat("kw","TO");const b=expr();const by=opt("kw","BY")?expr():{t:"n",v:1};eat("kw","DO");const c=bloco();eat("kw","END_FOR");opt("op",";");return {t:"for",v,a,b,by,c}}
    if(x.k==="kw"&&x.v==="WHILE"){p++;const e=expr();eat("kw","DO");const c=bloco();eat("kw","END_WHILE");opt("op",";");return {t:"while",e,c}}
    if(x.k==="kw"&&x.v==="REPEAT"){p++;const c=bloco();eat("kw","UNTIL");const e=expr();eat("kw","END_REPEAT");opt("op",";");return {t:"repeat",e,c}}
    if(x.k==="kw"&&(x.v==="RETURN"||x.v==="EXIT")){p++;opt("op",";");return {t:x.v.toLowerCase()}}
    if(x.k==="id"){p++;const nome=x.v;
      if(opt("op",":=")){const e=expr();opt("op",";");return {t:"set",nome,e}}
      if(opt("op","(")){const args=[];if(!is("op",")"))do{if(pk().k==="id"&&(T[p+1]?.v===":="||T[p+1]?.v==="=>")){const n=eat("id").v,o=T[p++].v;args.push({n,o,e:o===":="?expr():{t:"id",v:eat("id").v}})}else args.push({e:expr()})}while(opt("op",","));eat("op",")");opt("op",";");return {t:"call",nome,args}}
      if(opt("op",":")){return null}}
    p++;return null}
  const BIN=[["OR"],["XOR"],["AND","&"],["=","<>"],["<",">","<=",">="],["+","-"],["*","/","MOD"],["**"]];
  function expr(n=0){if(n>=BIN.length)return un();let a=expr(n+1);for(;;){const x=pk();if((x.k==="kw"||x.k==="op")&&BIN[n].includes(x.v)){p++;a={t:"bin",o:x.v==="&"?"AND":x.v,a,b:expr(n+1)}}else return a}}
  function un(){if(opt("kw","NOT"))return {t:"not",a:un()};if(opt("op","-"))return {t:"neg",a:un()};if(opt("op","+"))return un();return prim()}
  function prim(){const x=pk();if(x.k==="n"){p++;return {t:"n",v:x.v}}if(x.k==="s"){p++;return {t:"n",v:x.v}}
    if(x.k==="kw"&&(x.v==="TRUE"||x.v==="FALSE")){p++;return {t:"n",v:x.v==="TRUE"}}
    if(opt("op","(")){const e=expr();eat("op",")");return e}
    if(x.k==="id"){p++;if(opt("op","(")){const args=[];if(!is("op",")"))do{if(pk().k==="id"&&T[p+1]?.v===":="){p+=2;args.push(expr())}else args.push(expr())}while(opt("op",","));eat("op",")");return {t:"fn",f:x.v.toUpperCase(),args}}return {t:"id",v:x.v}}
    throw new Error(`não entendi "${x.v??"fim"}"`)}
  return bloco()}
const ST_FN={ABS:Math.abs,SQRT:Math.sqrt,MIN:Math.min,MAX:Math.max,LIMIT:(a,b,c)=>Math.min(Math.max(b,a),c),SEL:(g,a,b)=>g?b:a,TRUNC:Math.trunc,ROUND:Math.round,LN:Math.log,LOG:Math.log10,EXP:Math.exp,SIN:Math.sin,COS:Math.cos,TAN:Math.tan,MUX:(k,...a)=>a[k]};
function stEval(e,E){switch(e.t){case"n":return e.v;case"id":return getV(E,e.v)??0;case"not":return !stEval(e.a,E);case"neg":return -stEval(e.a,E);
  case"fn":{const a=e.args.map(x=>stEval(x,E));if(ST_FN[e.f])return ST_FN[e.f](...a);if(/_TO_/.test(e.f)){const d=e.f.split("_TO_")[1];return /BOOL/.test(d)?!!a[0]:/REAL|LREAL/.test(d)?+a[0]:/INT|WORD|DWORD|BYTE|DINT|UINT|UDINT/.test(d)?Math.trunc(+a[0]):a[0]}return a[0]??0}
  case"bin":{const a=stEval(e.a,E);if(e.o==="AND"&&typeof a==="boolean"&&!a)return false;if(e.o==="OR"&&typeof a==="boolean"&&a)return true;const b=stEval(e.b,E);
    switch(e.o){case"AND":return typeof a==="boolean"?!!b:a&b;case"OR":return typeof a==="boolean"?!!b:a|b;case"XOR":return typeof a==="boolean"?a!==!!b:a^b;case"=":return a==b;case"<>":return a!=b;case"<":return a<b;case">":return a>b;case"<=":return a<=b;case">=":return a>=b;
      case"+":return a+b;case"-":return a-b;case"*":return a*b;case"/":return b?a/b:0;case"MOD":return b?a%b:0;case"**":return a**b}}}return 0}
const PARAM_IN={IN:"IN",PT:"PT",CU:"CU",CD:"CD",R:"R",RESET:"R",LD:"LD",LOAD:"LD",PV:"PV",CLK:"CLK",S1:"S1",S:"S",R1:"R1"};
function stExec(lst,E,dt,ctx={n:0}){for(const s of lst){if(++ctx.n>20000)throw new Error("laço infinito");if(ctx.sair)return;switch(s.t){
  case"set":setV(E,s.nome,stEval(s.e,E));break;
  case"if":{let ok=false;for(const [c,b] of s.ramos)if(stEval(c,E)){stExec(b,E,dt,ctx);ok=true;break}if(!ok&&s.senao)stExec(s.senao,E,dt,ctx);break}
  case"case":{const v=stEval(s.e,E);let ok=false;for(const [rot,b] of s.casos)if(rot.some(([a,z])=>v>=stEval(a,E)&&v<=stEval(z,E))){stExec(b,E,dt,ctx);ok=true;break}if(!ok&&s.senao)stExec(s.senao,E,dt,ctx);break}
  case"for":{const by=stEval(s.by,E)||1;for(setV(E,s.v,stEval(s.a,E));by>0?getV(E,s.v)<=stEval(s.b,E):getV(E,s.v)>=stEval(s.b,E);setV(E,s.v,getV(E,s.v)+by)){stExec(s.c,E,dt,ctx);if(ctx.sair==="exit"){ctx.sair=null;break}if(++ctx.n>20000)break}break}
  case"while":while(stEval(s.e,E)){stExec(s.c,E,dt,ctx);if(ctx.sair==="exit"){ctx.sair=null;break}if(++ctx.n>20000)break}break;
  case"repeat":do{stExec(s.c,E,dt,ctx);if(ctx.sair==="exit"){ctx.sair=null;break}}while(!stEval(s.e,E)&&++ctx.n<20000);break;
  case"exit":ctx.sair="exit";return;case"return":ctx.sair="return";return;
  case"call":{const k=nk(s.nome);let fb=E.v.get(k);if(!fb||typeof fb!=="object"||!fb._fb){const tipo=E.tipo.get(k);fb=fbNovo(SIM_FB[tipo]?tipo:/T(ON|IMER)?\d*$/i.test(k)?"TON":"TON");E.v.set(k,fb)}E.escritos.add(k);
    for(const a of s.args)if(a.o!=="=>"&&a.n){const pn=PARAM_IN[a.n.toUpperCase()]||a.n.toUpperCase();fb[pn]=stEval(a.e,E)}
    execFB(fb,dt);for(const a of s.args)if(a.o==="=>")setV(E,a.e.v,fb[a.n.toUpperCase()]);break}}}}
function stDeclaracoes(src,E){const re=/\b(VAR(?:_INPUT|_OUTPUT|_IN_OUT|_GLOBAL|_TEMP|_STAT)?)\b([\s\S]*?)\bEND_VAR\b/gi;let m;
  while((m=re.exec(src))){const io=/INPUT/i.test(m[1])?"entrada":/OUTPUT/i.test(m[1])?"saida":/GLOBAL/i.test(m[1])?null:"interna";
    for(const l of m[2].replace(/\(\*[\s\S]*?\*\)|\/\/.*$/gm,"").split(";")){const d=l.match(/^\s*([\w",\s#]+?)\s*(?:AT\s+%\S+\s*)?:\s*([\w.]+)(?:\s*:=\s*([^;]+))?/i);if(!d)continue;
      for(const n of d[1].split(",")){if(!n.trim())continue;let ini=null;if(d[3]!=null){try{ini=stEval(stParse("x:="+d[3]+";")[0].e,E)}catch(e){}}declara(E,n,d[2],{io,ini})}}}
  const at=/([\w"]+)\s+AT\s+(%[IQ]\S*)\s*:\s*(\w+)/gi;while((m=at.exec(src)))E.io.set(nk(m[1]),/^%I/i.test(m[2])?"entrada":"saida")}
function stCorpo(src){let s=src.replace(/\b(VAR(?:_\w+)?)\b[\s\S]*?\bEND_VAR\b/gi," ");
  s=s.replace(/^[\s\S]*?\bBEGIN\b/i,m=>/\b(ORGANIZATION_BLOCK|FUNCTION_BLOCK|FUNCTION|PROGRAM)\b/i.test(m)?" ":m);
  s=s.replace(/\b(PROGRAM|FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|DATA_BLOCK|TYPE)\b[^\n]*\n/gi," ").replace(/\bEND_(PROGRAM|FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|DATA_BLOCK|TYPE)\b/gi," ");
  s=s.replace(/^\s*\{[^}]*\}\s*$/gm," ").replace(/\bTITLE\s*=.*$/gim," ").replace(/\bVERSION\s*:.*$/gim," ");return s}

/* ======================= LADDER ROCKWELL (texto neutro) ======================= */
function rungParse(txt){let i=0;const s=txt.replace(/\s+/g," ").trim().replace(/;$/,"");
  function seq(){const out=[];while(i<s.length){const c=s[i];if(c===" "){i++;continue}if(c===","||c==="]")break;
      if(c==="["){i++;const ramos=[seq()];while(s[i]===","){i++;ramos.push(seq())}if(s[i]==="]")i++;out.push({br:ramos});continue}
      const m=s.slice(i).match(/^([A-Za-z_]\w*)\s*\(/);if(!m){i++;continue}i+=m[0].length;let d=1,j=i;while(j<s.length&&d){if(s[j]==="(")d++;else if(s[j]===")")d--;j++}
      const args=dividir(s.slice(i,j-1));i=j;out.push({op:m[1].toUpperCase(),args})}return out}
  return seq()}
function dividir(a){const out=[];let d=0,cur="";for(const c of a){if(c==="("||c==="[")d++;if(c===")"||c==="]")d--;if(c===","&&!d){out.push(cur.trim());cur=""}else cur+=c}if(cur.trim()||out.length)out.push(cur.trim());return out}
const RW_SAIDA=new Set(["OTE","OTL","OTU","TON","TOF","RTO","CTU","CTD","RES","MOV","ADD","SUB","MUL","DIV","CPT","CLR","OSR","OSF","ONS","COP","MVM","BTD","SQR"]);
function rwVal(E,a){if(a==null||a==="?")return 0;if(/^-?[\d.]+(e-?\d+)?$/i.test(a))return +a;if(/^(16|8|2)#/.test(a))return parseInt(a.split("#")[1],+a.split("#")[0]);return getV(E,a)??0}
function rwTimer(E,tag,pre){const k=nk(tag);let t=E.v.get(k);if(!t||typeof t!=="object"||t._fb!=="TIMER"){t=fbNovo("TIMER");E.v.set(k,t);E.tipo.set(k,"TIMER")}if(pre!=null&&pre!=="?"&&!isNaN(+pre)&&!t._pre){t.PRE=+pre;t._pre=1}E.escritos.add(k);return t}
function rwCounter(E,tag,pre){const k=nk(tag);let t=E.v.get(k);if(!t||typeof t!=="object"||t._fb!=="COUNTER"){t=fbNovo("COUNTER");E.v.set(k,t);E.tipo.set(k,"COUNTER")}if(pre!=null&&pre!=="?"&&!isNaN(+pre)&&!t._pre){t.PRE=+pre;t._pre=1}E.escritos.add(k);return t}
function rwInstr(x,c,E,dt){const a=x.args;switch(x.op){
  case"XIC":return c&&!!rwVal(E,a[0]);case"XIO":return c&&!rwVal(E,a[0]);
  case"OTE":setV(E,a[0],c);return c;case"OTL":if(c)setV(E,a[0],true);else E.escritos.add(nk(a[0]).split(".")[0]);return c;case"OTU":if(c)setV(E,a[0],false);else E.escritos.add(nk(a[0]).split(".")[0]);return c;
  case"ONS":{const m=!!rwVal(E,a[0]);setV(E,a[0],c);return c&&!m}
  case"OSR":case"OSF":{const m=!!rwVal(E,a[0]);setV(E,a[0],c);setV(E,a[1],x.op==="OSR"?c&&!m:!c&&m);return c}
  case"TON":{const t=rwTimer(E,a[0],a[1]);t.EN=c;if(c){t.ACC=Math.min(t.PRE,t.ACC+dt);t.DN=t.ACC>=t.PRE;t.TT=!t.DN}else{t.ACC=0;t.DN=false;t.TT=false}return c}
  case"TOF":{const t=rwTimer(E,a[0],a[1]);t.EN=c;if(c){t.ACC=0;t.DN=true;t.TT=false}else if(t.DN){t.ACC=Math.min(t.PRE,t.ACC+dt);t.TT=t.ACC<t.PRE;if(t.ACC>=t.PRE){t.DN=false;t.TT=false}}return c}
  case"RTO":{const t=rwTimer(E,a[0],a[1]);t.EN=c;if(c){t.ACC=Math.min(t.PRE,t.ACC+dt)}t.DN=t.ACC>=t.PRE;t.TT=c&&!t.DN;return c}
  case"CTU":case"CTD":{const t=rwCounter(E,a[0],a[1]);const f=x.op==="CTU"?"CU":"CD";if(c&&!t[f])t.ACC+=x.op==="CTU"?1:-1;t[f]=c;t.DN=t.ACC>=t.PRE;return c}
  case"RES":if(c){const k=nk(a[0]),o=E.v.get(k);if(o&&typeof o==="object"){o.ACC=0;o.DN=false;o.TT=false;o.EN=false;o.CV=0;o.ET=0;o.Q=false}else setV(E,a[0],0)}return c;
  case"EQU":return c&&rwVal(E,a[0])==rwVal(E,a[1]);case"NEQ":return c&&rwVal(E,a[0])!=rwVal(E,a[1]);case"GRT":return c&&rwVal(E,a[0])>rwVal(E,a[1]);case"GEQ":return c&&rwVal(E,a[0])>=rwVal(E,a[1]);
  case"LES":return c&&rwVal(E,a[0])<rwVal(E,a[1]);case"LEQ":return c&&rwVal(E,a[0])<=rwVal(E,a[1]);case"LIM":{const lo=rwVal(E,a[0]),v=rwVal(E,a[1]),hi=rwVal(E,a[2]);return c&&(lo<=hi?v>=lo&&v<=hi:v>=lo||v<=hi)}
  case"CMP":try{return c&&!!stEval(stParse("x:="+a[0]+";")[0].e,E)}catch(e){return false}
  case"MOV":if(c)setV(E,a[1],rwVal(E,a[0]));return c;case"CLR":if(c)setV(E,a[0],0);return c;
  case"ADD":if(c)setV(E,a[2],rwVal(E,a[0])+rwVal(E,a[1]));return c;case"SUB":if(c)setV(E,a[2],rwVal(E,a[0])-rwVal(E,a[1]));return c;
  case"MUL":if(c)setV(E,a[2],rwVal(E,a[0])*rwVal(E,a[1]));return c;case"DIV":if(c){const d=rwVal(E,a[1]);setV(E,a[2],d?rwVal(E,a[0])/d:0)}return c;
  case"CPT":if(c){try{setV(E,a[0],stEval(stParse("x:="+a[1]+";")[0].e,E))}catch(e){}}return c;
  case"AFI":return false;case"NOP":case"JSR":case"SBR":case"RET":case"JMP":case"LBL":case"MCR":return c;
  default:return c}}
function rwSeq(seq,c,E,dt){for(const el of seq){if(el.br){let out=false;for(const b of el.br)out=rwSeq(b,c,E,dt)||out;c=out}else c=rwInstr(el,c,E,dt)}return c}
function rwDeclaraOperandos(seq,E){for(const el of seq){if(el.br){el.br.forEach(b=>rwDeclaraOperandos(b,E));continue}
  const a=el.args;if(/^(XIC|XIO)$/.test(el.op)&&a[0]&&!/\./.test(a[0]))declara(E,a[0],"BOOL");
  if(/^(OTE|OTL|OTU)$/.test(el.op)&&a[0]&&!/\./.test(a[0]))declara(E,a[0],"BOOL");if(/^(TON|TOF|RTO)$/.test(el.op))rwTimer(E,a[0],a[1]);if(/^(CTU|CTD)$/.test(el.op))rwCounter(E,a[0],a[1])}}

/* ======================= LISTA DE INSTRUÇÕES (AWL/STL, IEC IL, Mitsubishi) ======================= */
function ilParse(txt,dialeto){const linhas=txt.split(/\r?\n/).map(l=>l.replace(/\/\/.*$|\(\*.*?\*\)|;.*$/g,"").trim()).filter(Boolean);
  return linhas.map(l=>{const m=l.match(/^(?:\w+:\s*)?([A-Za-z=()+\-*\/<>]+[A-Za-z]*)\s*(.*)$/);return m?{op:m[1].toUpperCase(),arg:m[2].trim()}:null}).filter(Boolean)}
function ilEndereco(a){a=a.replace(/\s+/g,"");if(/^[IQEAMTCZ]\d/i.test(a))a=a.toUpperCase().replace(/^E/,"I").replace(/^A(?=\d)/,"Q");return a}
function ilExec(prog,E,dt,dial){let rlo=true,primeiro=true,acc1=0,acc2=0;const pilha=[],mps=[],blocos=[];const LD=dial==="mitsubishi";
  const bit=a=>{const k=ilEndereco(a);const v=getV(E,k);if(v&&typeof v==="object")return !!(v.Q??v.DN);return !!v};
  const comb=(v,op)=>{if(primeiro){rlo=v;primeiro=false}else rlo=op==="O"?rlo||v:op==="X"?rlo!==v:rlo&&v};
  const s5t=a=>{const m=String(a).match(/S5T#\S+|T#\S+/i);return m?tempoMs(m[0]):+a||0};
  const tim=(a,tipo,pre)=>{const k=nk(ilEndereco(a));let t=E.v.get(k);if(!t||typeof t!=="object"){t=fbNovo(tipo);E.v.set(k,t)}if(pre!=null)t.PT=pre;E.escritos.add(k);return t};
  for(let i=0;i<prog.length;i++){const {op,arg}=prog[i];
    switch(op){
      case"NETWORK":case"END":case"BE":case"NOP":break;
      case"LD":if(LD){if(!primeiro)blocos.push(rlo);primeiro=true;comb(bit(arg),"U")}else{rlo=bit(arg);primeiro=false}break;
      case"LDI":case"LDN":if(LD){if(!primeiro)blocos.push(rlo);primeiro=true;comb(!bit(arg),"U")}else{rlo=!bit(arg);primeiro=false}break;
      case"U":case"A":case"AND":comb(bit(arg),"U");break;case"UN":case"AN":case"ANI":case"ANDN":comb(!bit(arg),"U");break;
      case"O":case"OR":if(!arg){break}comb(bit(arg),"O");break;case"ON":case"ORI":case"ORN":comb(!bit(arg),"O");break;
      case"X":case"XOR":comb(bit(arg),"X");break;case"XN":case"XORN":comb(!bit(arg),"X");break;
      case"U(":case"A(":case"AND(":pilha.push([rlo,primeiro,"U"]);primeiro=true;break;case"O(":case"OR(":pilha.push([rlo,primeiro,"O"]);primeiro=true;break;case"UN(":case"AN(":pilha.push([rlo,primeiro,"UN"]);primeiro=true;break;
      case")":{const [r,pr,o]=pilha.pop()||[true,true,"U"];const v=o==="UN"?!rlo:rlo;rlo=r;primeiro=pr;comb(v,o==="UN"?"U":o);break}
      case"ANB":rlo=(blocos.pop()??true)&&rlo;break;case"ORB":rlo=(blocos.pop()??false)||rlo;break;
      case"MPS":mps.push(rlo);break;case"MRD":rlo=mps.at(-1)??rlo;break;case"MPP":rlo=mps.pop()??rlo;break;
      case"NOT":rlo=!rlo;break;case"SET":if(!arg){rlo=true;break}if(rlo)setV(E,ilEndereco(arg),true);primeiro=true;break;case"CLR":rlo=false;break;
      case"=":case"ST":case"OUT":{const a=LD?arg.split(/\s+/):[arg];if(LD&&/^T\d/i.test(a[0])){const t=tim(a[0],"TON",(+String(a[1]||"K0").replace(/^K/i,""))*(+a[0].slice(1)>=200?10:100));t.IN=rlo;execFB(t,dt);break}
        if(LD&&/^C\d/i.test(a[0])){const k=nk(a[0]);let c=E.v.get(k);if(!c||typeof c!=="object"){c=fbNovo("CTU");E.v.set(k,c)}c.PV=+String(a[1]||"K0").replace(/^K/i,"");c.CU=rlo;execFB(c,dt);E.escritos.add(k);break}
        setV(E,ilEndereco(a[0]),rlo);if(!LD)primeiro=true;break}
      case"STN":setV(E,ilEndereco(arg),!rlo);primeiro=true;break;
      case"S":if(rlo)setV(E,ilEndereco(arg),true);else E.escritos.add(nk(ilEndereco(arg)));primeiro=true;break;
      case"R":case"RST":{const k=ilEndereco(arg),o=E.v.get(nk(k));if(rlo){if(o&&typeof o==="object"){o.ET=0;o.Q=false;o.CV=0;o.IN=false}else setV(E,k,false)}else E.escritos.add(nk(k));primeiro=true;break}
      case"PLS":case"PLF":{const k=nk(ilEndereco(arg)),mk="__"+k;const ant=!!E.v.get(mk);E.v.set(mk,rlo);setV(E,k,op==="PLS"?rlo&&!ant:!rlo&&ant);break}
      case"FP":case"FN":{const k=nk(ilEndereco(arg)),ant=!!E.v.get(k);E.v.set(k,rlo);rlo=op==="FP"?rlo&&!ant:!rlo&&ant;break}
      case"L":acc2=acc1;acc1=/^S5T#|^T#/i.test(arg)?s5t(arg):/^-?[\d.]+$/.test(arg)?+arg:/^[BWD]#/i.test(arg)?parseInt(arg.split("#")[2]??arg.split("#")[1],16):+(getV(E,ilEndereco(arg))??0);break;
      case"T":setV(E,ilEndereco(arg),acc1);break;
      case"SD":case"SE":case"SI":case"SS":case"SF":case"SA":{const t=tim(arg,op==="SF"||op==="SA"?"TOF":op==="SI"||op==="SE"?"TP":"TON",acc1);t.IN=rlo;execFB(t,dt);primeiro=true;break}
      case"ZV":case"ZR":{const k=nk(ilEndereco(arg));let c=E.v.get(k);if(!c||typeof c!=="object"){c=fbNovo("CTUD");c.PV=1e9;E.v.set(k,c)}c[op==="ZV"?"CU":"CD"]=rlo;execFB(c,dt);E.escritos.add(k);primeiro=true;break}
      case"==I":case"==R":case"==D":rlo=acc2==acc1;primeiro=false;break;case"<>I":case"<>R":case"<>D":rlo=acc2!=acc1;primeiro=false;break;case">I":case">R":case">D":rlo=acc2>acc1;primeiro=false;break;
      case"<I":case"<R":case"<D":rlo=acc2<acc1;primeiro=false;break;case">=I":case">=R":case">=D":rlo=acc2>=acc1;primeiro=false;break;case"<=I":case"<=R":case"<=D":rlo=acc2<=acc1;primeiro=false;break;
      case"+I":case"+R":case"+D":acc1=acc2+acc1;break;case"-I":case"-R":case"-D":acc1=acc2-acc1;break;case"*I":case"*R":case"*D":acc1=acc2*acc1;break;case"/I":case"/R":case"/D":acc1=acc1?acc2/acc1:0;break;
      default:break}}}

/* ======================= PROGRAMA ======================= */
function detectaDialeto(nome,t){const n=String(nome||"").toLowerCase();
  if(/<RSLogix5000Content/i.test(t))return "l5x";if(/\b(XIC|XIO|OTE|OTL|OTU)\s*\(/.test(t))return "ladder";
  if(/plcopen\.org\/xml\/tc6/i.test(t))return "plcopen";
  if(/^\s*(LD|LDI|OUT|ANI|ORI|ANB|ORB|MPS|MPP)\s+[XYMTCSD]\d/im.test(t))return "mitsubishi";
  if(/^\s*(U|UN|O|ON|A|AN)\s+["%A-Za-z]/m.test(t)&&/^\s*(=|S|R)\s+\S/m.test(t)&&!/:=/.test(t))return "awl";
  if(/^\s*(LD|LDN|ST|STN|ANDN|ORN)\s+\S/im.test(t)&&!/:=/.test(t))return "il";
  if(/:=|\bEND_IF\b|\bEND_VAR\b/i.test(t))return "st";return "desconhecido"}
function montarPrograma(fontes){const E=novoEstado(),unidades=[],avisos=[];
  for(const f of fontes){const t=String(f.text||f.texto||"");const d=detectaDialeto(f.name||f.nome,t);
    try{
      if(d==="l5x"){const doc=new DOMParser().parseFromString(t,"application/xml");
        [...doc.getElementsByTagName("Tag")].forEach(g=>{const n=g.getAttribute("Name"),dt=g.getAttribute("DataType")||"BOOL";const k=declara(E,n,dt==="TIMER"?"TIMER":dt==="COUNTER"?"COUNTER":dt,{desc:g.getElementsByTagName("Description")[0]?.textContent?.trim()});
          const pre=g.querySelector?.('DataValueMember[Name="PRE"]')?.getAttribute("Value");if(pre!=null){const o=E.v.get(k);if(o&&typeof o==="object"){o.PRE=+pre;o._pre=1}}});
        [...doc.getElementsByTagName("Routine")].forEach(r=>{const rn=r.getAttribute("Name"),ty=r.getAttribute("Type");
          if(ty==="RLL")[...r.getElementsByTagName("Rung")].forEach(g=>{const tx=(g.getElementsByTagName("Text")[0]?.textContent||"").trim();if(!tx)return;const seq=rungParse(tx);rwDeclaraOperandos(seq,E);
            unidades.push({tipo:"ladder",nome:`${rn} · rung ${g.getAttribute("Number")}`,texto:tx,comentario:(g.getElementsByTagName("Comment")[0]?.textContent||"").trim(),seq})});
          else if(ty==="ST"){const tx=[...r.getElementsByTagName("Line")].map(l=>l.textContent).join("\n");unidades.push({tipo:"st",nome:rn,texto:tx,ast:stParse(stCorpo(tx))})}
          else avisos.push(`Rotina ${rn} em ${ty}: precisa de tradução pela IA`)})}
      else if(d==="ladder"){t.split(/;\s*(?:\n|$)/).map(x=>x.trim()).filter(x=>/\(/.test(x)).forEach((tx,i)=>{const seq=rungParse(tx);rwDeclaraOperandos(seq,E);unidades.push({tipo:"ladder",nome:`rung ${i}`,texto:tx,seq})})}
      else if(d==="plcopen"){const doc=new DOMParser().parseFromString(t,"application/xml");
        [...doc.getElementsByTagName("variable")].forEach(v=>{const ty=v.getElementsByTagName("type")[0]?.firstElementChild;const tn=ty?.localName==="derived"?ty.getAttribute("name"):ty?.localName||"BOOL";const sec=v.parentElement?.localName||"";declara(E,v.getAttribute("name"),tn.toUpperCase(),{io:/input/i.test(sec)?"entrada":/output/i.test(sec)?"saida":null})});
        [...doc.getElementsByTagName("ST")].forEach((s,i)=>{const tx=s.textContent;unidades.push({tipo:"st",nome:`POU ${i+1}`,texto:tx,ast:stParse(tx)})});
        if(/<LD>|<FBD>|<SFC>/.test(t))avisos.push("Há redes gráficas (LD/FBD/SFC) no PLCopen: a IA traduz para texto estruturado")}
      else if(d==="mitsubishi"||d==="awl"||d==="il"){const redes=t.split(/^\s*(?:NETWORK|NETZWERK|Network)\b.*$/m);redes.forEach((r,i)=>{const prog=ilParse(r,d);if(prog.length)unidades.push({tipo:"il",dial:d,nome:`${d==="awl"?"Network":d==="mitsubishi"?"Bloco":"Rede"} ${i+(redes.length>1?0:1)}`,texto:r.trim(),prog})});stDeclaracoes(t,E)}
      else if(d==="st"){stDeclaracoes(t,E);unidades.push({tipo:"st",nome:f.name||f.nome||"programa",texto:t,ast:stParse(stCorpo(t))})}
      else avisos.push(`${f.name||f.nome||"arquivo"}: formato não reconhecido; a IA deve traduzir para texto estruturado`)}
    catch(e){avisos.push(`${f.name||f.nome}: ${e.message}`)}}
  const P={E,unidades,avisos,ciclo:0,ms:0};simCiclo(P,0,true);E.lidos.clear();E.escritos.clear();for(let i=0;i<2;i++)simCiclo(P,0,true);
  const INTERNA=/^(M\d|B3|N7|F8|AUX|TMP|TEMP|STEP|PASSO|ETAPA|SEQ|FLAG|MEM|D\d|DB\d)/i;
  for(const k of E.v.keys()){if(k.startsWith("__"))continue;const o=E.v.get(k);if(!E.io.has(k))E.io.set(k,o&&typeof o==="object"?"bloco":INTERNA.test(k)?"interna":E.escritos.has(k)?"saida":"entrada")}
  return P}
function simCiclo(P,dt,silencioso){const E=P.E;E.t+=dt;for(const u of P.unidades){try{
    if(u.tipo==="ladder")u.energ=rwSeq(u.seq,true,E,dt);else if(u.tipo==="st")stExec(u.ast,E,dt);else if(u.tipo==="il")ilExec(u.prog,E,dt,u.dial);u.erro=null}
  catch(e){u.erro=e.message;if(!silencioso)console.warn(u.nome,e)}}P.ciclo++;P.ms+=dt}
function simResumo(P){const E=P.E,io={entrada:[],saida:[],interna:[],bloco:[]};for(const [k,v] of E.v){if(k.startsWith("__"))continue;(io[E.io.get(k)]||io.interna).push(k)}
  return {unidades:P.unidades.length,linguagens:[...new Set(P.unidades.map(u=>u.tipo==="il"?u.dial:u.tipo))],entradas:io.entrada,saidas:io.saida,internas:io.interna.slice(0,80),blocos:io.bloco,avisos:P.avisos,erros:P.unidades.filter(u=>u.erro).map(u=>`${u.nome}: ${u.erro}`).slice(0,10)}}

/* ======================= CENA 3D LIGADA ÀS TAGS ======================= */
function cenaAutomatica(P){const r=simResumo(P),obj=[];let x=0;const tipoPor=n=>/BOMB|PUMP/i.test(n)?"bomba":/ESTEIRA|CONV|TRANSP/i.test(n)?"esteira":/MOT|MTR|MOTOR|M\d/i.test(n)?"motor":/VALV|VLV|XV|SOL/i.test(n)?"valvula":/CIL|CYL|AVAN|EXT/i.test(n)?"cilindro":/VENT|FAN/i.test(n)?"ventilador":"lampada";
  r.saidas.slice(0,16).forEach((n,i)=>{const tp=tipoPor(n);obj.push({tipo:tp,nome:n,tag:n,pos:[(i%4)*3-4.5,Math.floor(i/4)*3,0]})});
  r.entradas.slice(0,16).forEach((n,i)=>{obj.push({tipo:/SENS|FC|LS|PROX|NIVEL|LVL|S\d/i.test(n)?"sensor":"botao",nome:n,tag:n,retentivo:/SEL|CHAVE|SW|AUTO|MAN/i.test(n),pos:[(i%8)*1.4-5,-3.5,0]})});return {objetos:obj,auto:true}}
const COR_ON="#E8EAED",COR_OFF="#3A3E45",COR_ATIVO="#7CFFB2",COR_ALARME="#FF5D5D";
function simFisica(P,cena,dt){const E=P.E,b=t=>t?!!getV(E,t):false;
  for(const o of cena.objetos){const s=o._s||(o._s={pos:0,nivel:o.nivel_inicial??30,pecas:[],prox:0});
    if(o.tipo==="cilindro"){const vel=dt/((o.tempo_s||1.5)*1000),av=b(o.tag_avanca||o.tag);
      if(o.tag_recua){if(av&&!b(o.tag_recua))s.pos=Math.min(1,s.pos+vel);else if(b(o.tag_recua)&&!av)s.pos=Math.max(0,s.pos-vel)}else s.pos=av?Math.min(1,s.pos+vel):Math.max(0,s.pos-vel);
      if(o.tag_sensor_avancado)setV(E,o.tag_sensor_avancado,s.pos>=.98);if(o.tag_sensor_recuado)setV(E,o.tag_sensor_recuado,s.pos<=.02)}
    if(o.tipo==="tanque"){const ent=b(o.tag_enche)?(o.vazao_entrada_pct_s??8):0,sai=b(o.tag_esvazia)?(o.vazao_saida_pct_s??6):0;s.nivel=Math.max(0,Math.min(100,s.nivel+(ent-sai)*dt/1000));
      if(o.tag_nivel)setV(E,o.tag_nivel,Math.round(s.nivel*10)/10);if(o.tag_nivel_alto)setV(E,o.tag_nivel_alto,s.nivel>=(o.limite_alto??90));if(o.tag_nivel_baixo)setV(E,o.tag_nivel_baixo,s.nivel<=(o.limite_baixo??10))}
    if(o.tipo==="esteira"){const on=b(o.tag_motor||o.tag),L=o.comprimento||6;if(on){s.prox-=dt;if(s.prox<=0&&s.pecas.length<8){s.pecas.push(0);s.prox=(o.intervalo_s||4)*1000}s.pecas=s.pecas.map(p=>p+dt/1000*(o.velocidade_m_s||.8)).filter(p=>p<L)}
      if(o.tag_sensor_peca){const sp=(o.posicao_sensor??.7)*L;setV(E,o.tag_sensor_peca,s.pecas.some(p=>Math.abs(p-sp)<.25))}}
    if((o.tipo==="motor"||o.tipo==="bomba"||o.tipo==="ventilador")&&o.tag_retorno)setV(E,o.tag_retorno,b(o.tag))}}

async function simRender(el,P,cena,ui){await loadScript("vendor/three.min.js");const W=el.clientWidth||640,H=360;el.innerHTML="";
  let ren;try{ren=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){el.innerHTML=`<p class="note">Este navegador não liberou o 3D.</p>`;return null}
  ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(W,H);el.append(ren.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,W/H,.05,500);cam.up.set(0,0,1);sc.add(new THREE.HemisphereLight(0xffffff,0x303030,1));const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(4,-6,9);sc.add(dl);
  const grid=new THREE.GridHelper(40,40,0x555555,0x2a2a2a);grid.rotation.x=Math.PI/2;sc.add(grid);
  const M=(c,m=.4,r=.45)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),metalness:m,roughness:r}),aco=M("#9AA0A8",.7,.35),escuro=M("#2A2D33",.5,.6);
  const grupos=[];const rot=(txt)=>{const c=document.createElement("canvas");c.width=256;c.height=48;const g=c.getContext("2d");g.fillStyle="rgba(0,0,0,.55)";g.fillRect(0,0,256,48);g.fillStyle="#E8EAED";g.font="22px monospace";g.fillText(String(txt).slice(0,18),8,32);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));s.scale.set(2.4,.45,1);return s};
  for(const o of cena.objetos){const g=new THREE.Group();const [x=0,y=0,z=0]=o.pos||[];g.position.set(x,y,z);if(o.rot)g.rotation.z=(o.rot||0)*Math.PI/180;const k=o.escala||1;g.scale.set(k,k,k);const v={o,g};
    if(o.tipo==="motor"||o.tipo==="bomba"||o.tipo==="ventilador"){const corpo=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,1.1,32),M(COR_OFF));corpo.rotation.z=Math.PI/2;corpo.position.z=.6;g.add(corpo);
      const eixo=new THREE.Group();eixo.position.set(.75,0,.6);const e=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.5,12),aco);e.rotation.z=Math.PI/2;eixo.add(e);const pa=new THREE.Mesh(new THREE.BoxGeometry(.06,.7,.12),aco);pa.position.x=.2;eixo.add(pa);g.add(eixo);
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.3,.9,.12),escuro);base.position.z=.06;g.add(base);v.corpo=corpo;v.gira=eixo}
    else if(o.tipo==="cilindro"){const cam_=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.4,24),aco);cam_.rotation.z=Math.PI/2;cam_.position.set(0,0,.4);g.add(cam_);
      const haste=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.2,16),M("#D8DBDF",.8,.2));haste.rotation.z=Math.PI/2;haste.position.set(.7,0,.4);g.add(haste);const ponta=new THREE.Mesh(new THREE.BoxGeometry(.18,.4,.4),M(COR_OFF));ponta.position.set(1.3,0,.4);g.add(ponta);v.haste=haste;v.ponta=ponta}
    else if(o.tipo==="tanque"){const casco=new THREE.Mesh(new THREE.CylinderGeometry(1,1,2.6,40,1,true),new THREE.MeshStandardMaterial({color:0x9aa0a8,transparent:true,opacity:.25,side:THREE.DoubleSide}));casco.rotation.x=Math.PI/2;casco.position.z=1.3;g.add(casco);
      const liq=new THREE.Mesh(new THREE.CylinderGeometry(.96,.96,1,40),M("#4FA3FF",.1,.3));liq.rotation.x=Math.PI/2;g.add(liq);v.liq=liq}
    else if(o.tipo==="esteira"){const L=o.comprimento||6;const banda=new THREE.Mesh(new THREE.BoxGeometry(L,.9,.12),escuro);banda.position.set(L/2,0,.6);g.add(banda);
      for(let i=0;i<=L;i+=1){const p=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.6),aco);p.position.set(i,.4,.3);g.add(p);const q=p.clone();q.position.y=-.4;g.add(q)}
      if(o.tag_sensor_peca){const s=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.3),M(COR_OFF));s.position.set((o.posicao_sensor??.7)*L,.55,.85);g.add(s);v.sens=s}v.pecas=[];v.L=L}
    else if(o.tipo==="valvula"){const corpo=new THREE.Mesh(new THREE.SphereGeometry(.3,24,16),aco);corpo.position.z=.5;g.add(corpo);const tubo=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.6,16),aco);tubo.rotation.z=Math.PI/2;tubo.position.z=.5;g.add(tubo);
      const vol=new THREE.Mesh(new THREE.BoxGeometry(.5,.08,.08),M(COR_OFF));vol.position.z=.95;g.add(vol);v.vol=vol}
    else if(o.tipo==="botao"||o.tipo==="sensor"){const b=new THREE.Mesh(o.tipo==="botao"?new THREE.CylinderGeometry(.22,.22,.18,24):new THREE.BoxGeometry(.25,.25,.4),M(COR_OFF));if(o.tipo==="botao")b.rotation.x=Math.PI/2;b.position.z=.2;b.userData.clicavel=o;g.add(b);v.b=b}
    else{const l=new THREE.Mesh(new THREE.SphereGeometry(.28,24,16),M(COR_OFF,.1,.3));l.position.z=.5;g.add(l);const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.4,8),escuro);p.rotation.x=Math.PI/2;p.position.z=.2;g.add(p);v.lamp=l}
    const r=rot(o.nome||o.tag||o.tipo);r.position.set(0,0,o.tipo==="tanque"?3:1.6);g.add(r);sc.add(g);grupos.push(v)}
  /* órbita */
  const box=new THREE.Box3();grupos.forEach(v=>box.expandByObject(v.g));const cen=box.getCenter(new THREE.Vector3()),R=Math.max(4,box.getSize(new THREE.Vector3()).length()*.6);let th=-.9,ph=.95,dist=R*1.25;const alvo=cen.clone();
  const poe=()=>{cam.position.set(alvo.x+dist*Math.sin(ph)*Math.cos(th),alvo.y+dist*Math.sin(ph)*Math.sin(th),alvo.z+dist*Math.cos(ph));cam.lookAt(alvo)};poe();
  let arr=null;const cv=ren.domElement;cv.style.touchAction="none";cv.style.cursor="grab";
  cv.onpointerdown=e=>{arr={x:e.clientX,y:e.clientY,b:e.button,moveu:false};cv.setPointerCapture(e.pointerId)};
  cv.onpointermove=e=>{if(!arr)return;const dx=e.clientX-arr.x,dy=e.clientY-arr.y;if(Math.abs(dx)+Math.abs(dy)>3)arr.moveu=true;arr.x=e.clientX;arr.y=e.clientY;
    if(arr.b===2||e.shiftKey){const f=dist/700;alvo.x+=(-dx*Math.sin(th))*f;alvo.y+=(dx*Math.cos(th))*f;alvo.z+=dy*f}else{th-=dx*.008;ph=Math.min(1.5,Math.max(.1,ph-dy*.008))}poe()};
  cv.onpointerup=e=>{const clique=arr&&!arr.moveu;arr=null;if(!clique)return;const r=cv.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);const rc=new THREE.Raycaster();rc.setFromCamera(m,cam);
    const hit=rc.intersectObjects(sc.children,true).find(h=>h.object.userData.clicavel);if(hit){const o=hit.object.userData.clicavel;ui.alternar(o.tag,o.retentivo||o.tipo==="sensor")}};
  cv.oncontextmenu=e=>e.preventDefault();cv.onwheel=e=>{e.preventDefault();dist=Math.max(1,Math.min(200,dist*(e.deltaY>0?1.1:.9)));poe()};
  const corDe=(mesh,on,alarme)=>mesh.material.color.set(on?(alarme?COR_ALARME:COR_ATIVO):COR_OFF);
  function quadro(dt){const E=P.E,b=t=>t?!!getV(E,t):false;
    for(const v of grupos){const o=v.o,s=o._s||{};
      if(v.gira){const on=b(o.tag);corDe(v.corpo,on);if(on)v.gira.rotation.x+=dt*.012}
      if(v.haste){const k=s.pos||0;v.haste.position.x=.1+k*.9;v.ponta.position.x=.75+k*.9;corDe(v.ponta,b(o.tag_avanca||o.tag))}
      if(v.liq){const h=Math.max(.01,(s.nivel??0)/100*2.5);v.liq.scale.y=h;v.liq.position.z=h/2+.03;v.liq.material.color.set((s.nivel??0)>=(o.limite_alto??90)?"#FF8A5D":"#4FA3FF")}
      if(v.pecas){while(v.pecas.length<(s.pecas||[]).length){const p=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,.35),M("#C9A46A",.1,.7));v.g.add(p);v.pecas.push(p)}
        v.pecas.forEach((m,i)=>{const pos=(s.pecas||[])[i];m.visible=pos!=null;if(pos!=null)m.position.set(pos,0,.85)});if(v.sens)corDe(v.sens,b(o.tag_sensor_peca))}
      if(v.vol){const on=b(o.tag_abre||o.tag);v.vol.rotation.z=on?Math.PI/2:0;corDe(v.vol,on)}
      if(v.b)corDe(v.b,b(o.tag));if(v.lamp)corDe(v.lamp,b(o.tag),/ALARM|FALHA|FAULT|ERRO|EMERG/i.test(o.tag||""))}
    ren.render(sc,cam)}
  quadro(0);return {quadro,destruir:()=>{ren.dispose();el.innerHTML=""}}}

/* ======================= CARTÃO DA SIMULAÇÃO ======================= */
function simCard(d){const P=montarPrograma(d.fontes||[]);const cena=d.cena?.objetos?.length?JSON.parse(JSON.stringify(d.cena)):cenaAutomatica(P);const R=simResumo(P);
  const el=card("Simulação da lógica · "+(d.nome||"CLP"),`<div class="sim3d"></div><div class="simg"><div><small>Entradas · clique para acionar</small><div class="simIn"></div></div><div><small>Saídas</small><div class="simOut"></div></div><div><small>Temporizadores, contadores e valores</small><div class="simVal"></div></div></div><div class="simLog scroll"></div><p class="note simNota"></p>`,
    `<button class="btn fill" data-s="play">Pausar</button><button class="btn" data-s="passo">Passo</button><select class="btn" data-s="vel"><option value="1">1×</option><option value="5">5×</option><option value="20">20×</option></select><button class="btn" data-s="reset">Reiniciar</button>`);
  const E=P.E,ret=k=>/SEL|CHAVE|SW|AUTO|MAN|NIVEL|LVL|SENS|FC|LS|PROX|PRES|FIM|POS|HAB|ENABLE|^I\d|^X\d|^E\d/i.test(k);
  const fisicas=new Set(cena.objetos.flatMap(o=>[o.tag_sensor_avancado,o.tag_sensor_recuado,o.tag_nivel,o.tag_nivel_alto,o.tag_nivel_baixo,o.tag_sensor_peca,o.tag_retorno].filter(Boolean).map(nk)));
  const entradas=R.entradas.filter(k=>!fisicas.has(k));
  el.querySelector(".simIn").innerHTML=entradas.map(k=>{const v=E.v.get(k);return typeof v==="number"?`<label class="io">${esc(k)} <input type="number" data-n="${esc(k)}" value="${v}" style="width:70px"></label>`:`<span class="io" data-t="${esc(k)}" data-r="${ret(k)?1:0}" title="${ret(k)?"liga/desliga":"segure para acionar"}">${esc(k)}</span>`}).join("")||`<span class="kb">Sem entradas livres: os sensores são movidos pela física da cena.</span>`;
  el.querySelector(".simNota").textContent=[`${R.unidades} bloco(s) de lógica em ${R.linguagens.join(", ")||"—"}.`,cena.auto?"Cena montada automaticamente pelos nomes das tags.":"",fisicas.size?`Sensores movidos pela física: ${[...fisicas].join(", ")}.`:"",...R.avisos].filter(Boolean).join(" ");
  const ui={alternar:(t,r)=>{if(r)setV(E,t,!getV(E,t));else{setV(E,t,true);setTimeout(()=>setV(E,t,false),400)}}};
  el.querySelector(".simIn").addEventListener("pointerdown",e=>{const b=e.target.closest("[data-t]");if(!b)return;if(b.dataset.r==="1")setV(E,b.dataset.t,!getV(E,b.dataset.t));else{setV(E,b.dataset.t,true);const solta=()=>{setV(E,b.dataset.t,false);removeEventListener("pointerup",solta)};addEventListener("pointerup",solta)}});
  el.querySelector(".simIn").addEventListener("input",e=>{const n=e.target.dataset.n;if(n)setV(E,n,+e.target.value)});
  let rodando=true,vel=1,v3=null,ult=performance.now(),acum=0;
  const ciclo=()=>{simFisica(P,cena,50);simCiclo(P,50)};
  const painel=()=>{el.querySelectorAll(".simIn [data-t]").forEach(b=>b.classList.toggle("on",!!getV(E,b.dataset.t)));
    el.querySelector(".simOut").innerHTML=R.saidas.map(k=>`<span class="io ${getV(E,k)?"on":""}${/ALARM|FALHA|FAULT|EMERG/i.test(k)&&getV(E,k)?" al":""}">${esc(k)}</span>`).join("")||"—";
    const vals=[];for(const [k,o] of E.v){if(k.startsWith("__"))continue;if(o&&typeof o==="object"){if(o._fb==="TIMER")vals.push(`${k} ${(o.ACC/1000).toFixed(1)}/${(o.PRE/1000).toFixed(1)} s${o.DN?" ✓":""}`);else if(o._fb==="COUNTER")vals.push(`${k} ${o.ACC}/${o.PRE}${o.DN?" ✓":""}`);else if(/^T/.test(o._fb))vals.push(`${k} ${(o.ET/1000).toFixed(1)}/${(o.PT/1000).toFixed(1)} s${o.Q?" ✓":""}`);else if(/^CT/.test(o._fb))vals.push(`${k} ${o.CV}/${o.PV}`)}else if(typeof o==="number"&&E.io.get(k)!=="entrada")vals.push(`${k} = ${Math.round(o*100)/100}`)}
    el.querySelector(".simVal").innerHTML=vals.slice(0,40).map(v=>`<span class="io">${esc(v)}</span>`).join("")||"—";
    el.querySelector(".simLog").innerHTML=P.unidades.slice(0,200).map(u=>`<div class="rung ${u.energ?"on":""}${u.erro?" al":""}"><b>${esc(u.nome)}</b> ${esc((u.comentario?u.comentario+" · ":"")+u.texto.replace(/\s+/g," ").slice(0,160))}${u.erro?" · erro: "+esc(u.erro):""}</div>`).join("")};
  function laco(t){if(!document.body.contains(el)){v3?.destruir();return}const dt=Math.min(200,t-ult);ult=t;if(rodando){acum+=dt*vel;let n=0;while(acum>=50&&n<400){ciclo();acum-=50;n++}}v3?.quadro(dt);if(!(P.ciclo%4))painel();requestAnimationFrame(laco)}
  el.querySelector(".acts").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;const s=b.dataset.s;
    if(s==="play"){rodando=!rodando;b.textContent=rodando?"Pausar":"Rodar"}else if(s==="passo"){rodando=false;el.querySelector('[data-s="play"]').textContent="Rodar";ciclo();painel()}
    else if(s==="reset"){const N=simCard(d);el.replaceWith(N)}});
  el.querySelector('[data-s="vel"]').onchange=e=>{vel=+e.target.value};
  setTimeout(async()=>{v3=await simRender(el.querySelector(".sim3d"),P,cena,ui).catch(()=>null);painel();requestAnimationFrame(t=>{ult=t;laco(t)})},30);
  return el}
