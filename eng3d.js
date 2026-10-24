/* Prognos · Black and White — ENGENHARIA EM 3D
   1) modelo_3d: a IA monta peças, conjuntos ou a planta inteira (mecânica, elétrica, civil, estrutura, tubulação,
      automação, processo) a partir dos desenhos, manuais e medidas. O Prognos procura interferências:
      - ajustes de buchas, rolamentos e eixos, calculados de forma exata quando as peças são coaxiais;
      - colisões gerais, por amostragem do volume comum.
   2) abrir_modelo_3d: abre modelos nativos (STEP, IGES, BREP, IFC/BIM, STL, OBJ) e aponta conflitos entre disciplinas.
   3) leitura de DXF: camadas, cotas, círculos e textos viram dados para a IA reconstruir o 3D. */

const DISC_COR={mecanica:"#B9BEC5",eletrica:"#FFC857",civil:"#A8A29E",estrutura:"#5DA9E9",tubulacao:"#7CFFB2",automacao:"#C792EA",processo:"#FF8A5D",instrumentacao:"#F78FB3",outro:"#8A9099"};
const DISC_NOME={mecanica:"Mecânica",eletrica:"Elétrica",civil:"Civil",estrutura:"Estrutura metálica",tubulacao:"Tubulação",automacao:"Automação",processo:"Processo",instrumentacao:"Instrumentação",outro:"Outros"};
const numE=v=>{const n=+String(v??"").replace(",",".");return isFinite(n)?n:0};

/* ---------- sólidos: geometria para desenhar e teste de ponto interno para as interferências */
function solMatriz(s){const T=THREE,m=new T.Matrix4(),e=s.eixo||"z";const r=(s.rot||[0,0,0]).map(a=>numE(a)*Math.PI/180);
  const base=new T.Matrix4();if(e==="x")base.makeRotationY(Math.PI/2);else if(e==="y")base.makeRotationX(-Math.PI/2);
  const R=new T.Matrix4().makeRotationFromEuler(new T.Euler(r[0]||0,r[1]||0,r[2]||0,"XYZ"));const p=(s.pos||[0,0,0]).map(numE);
  m.makeTranslation(p[0]||0,p[1]||0,p[2]||0).multiply(R).multiply(base);return m}
function solGeom(s){const T=THREE,f=s.forma;let g;
  if(f==="caixa"){g=new T.BoxGeometry(numE(s.w)||1,numE(s.p)||1,numE(s.h)||1);g.translate(0,0,(numE(s.h)||1)/2)}
  else if(f==="cilindro"){const r=numE(s.d)/2||.5,h=numE(s.h)||1;g=new T.CylinderGeometry(r,r,h,48);g.rotateX(Math.PI/2);g.translate(0,0,h/2)}
  else if(f==="cone"){const h=numE(s.h)||1;g=new T.CylinderGeometry(numE(s.d2)/2,numE(s.d1)/2,h,48);g.rotateX(Math.PI/2);g.translate(0,0,h/2)}
  else if(f==="tubo"){const ro=numE(s.de)/2||.5,ri=numE(s.di)/2||.4,h=numE(s.h)||1;g=new T.LatheGeometry([new T.Vector2(ri,0),new T.Vector2(ro,0),new T.Vector2(ro,h),new T.Vector2(ri,h),new T.Vector2(ri,0)],64);g.rotateX(Math.PI/2)}
  else if(f==="esfera"){g=new T.SphereGeometry(numE(s.d)/2||.5,32,20)}
  else if(f==="extrusao"&&Array.isArray(s.pontos)&&s.pontos.length>=3){const sh=new T.Shape(s.pontos.map(([x,y])=>new T.Vector2(numE(x),numE(y))));g=new T.ExtrudeGeometry(sh,{depth:numE(s.h)||1,bevelEnabled:false})}
  else if(f==="revolucao"&&Array.isArray(s.perfil)&&s.perfil.length>=3){g=new T.LatheGeometry(s.perfil.map(([r,z])=>new T.Vector2(Math.max(0,numE(r)),numE(z))),64);g.rotateX(Math.PI/2)}
  else{g=new T.BoxGeometry(1,1,1);g.translate(0,0,.5)}
  g.applyMatrix4(solMatriz(s));return g}
function noPoligono(x,y,pts){let d=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [xi,yi]=pts[i].map(numE),[xj,yj]=pts[j].map(numE);if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)d=!d}return d}
function solContem(s,pW){const p=pW.clone().applyMatrix4(s._inv),r=Math.hypot(p.x,p.y);switch(s.forma){
  case"caixa":return Math.abs(p.x)<=numE(s.w)/2&&Math.abs(p.y)<=numE(s.p)/2&&p.z>=0&&p.z<=numE(s.h);
  case"cilindro":return r<=numE(s.d)/2&&p.z>=0&&p.z<=numE(s.h);
  case"tubo":return r<=numE(s.de)/2&&r>=numE(s.di)/2&&p.z>=0&&p.z<=numE(s.h);
  case"cone":{const h=numE(s.h);if(p.z<0||p.z>h)return false;return r<=(numE(s.d1)+(numE(s.d2)-numE(s.d1))*p.z/h)/2}
  case"esfera":return p.length()<=numE(s.d)/2;
  case"extrusao":return p.z>=0&&p.z<=numE(s.h)&&noPoligono(p.x,p.y,s.pontos);
  case"revolucao":return noPoligono(r,p.z,s.perfil);default:return false}}
function pecaContem(pc,p){return pc.solidos.some(s=>solContem(s,p))&&!(pc.vazios||[]).some(s=>solContem(s,p))}

/* ---------- ajustes coaxiais exatos (eixo × bucha × alojamento × rolamento) */
function eixoMundo(s){const m=solMatriz(s),o=new THREE.Vector3(0,0,0).applyMatrix4(m),z=new THREE.Vector3(0,0,1).applyMatrix4(m).sub(o).normalize();return {o,z,h:numE(s.h)}}
function cilindrico(s,vazio){if(s.forma==="cilindro")return vazio?{furo:numE(s.d)}:{externo:numE(s.d)};if(s.forma==="tubo")return vazio?{furo:numE(s.de)}:{externo:numE(s.de),interno:numE(s.di)};return null}
function ajustesCoaxiais(pecas,tol){const out=[],lista=[];
  for(const pc of pecas){for(const s of pc.solidos){const c=cilindrico(s,false);if(c)lista.push({pc,s,...c})}for(const s of pc.vazios||[]){const c=cilindrico(s,true);if(c)lista.push({pc,s,...c})}}
  for(let i=0;i<lista.length;i++)for(let j=0;j<lista.length;j++){const A=lista[i],B=lista[j];if(A.pc===B.pc||!A.externo)continue;const furoB=B.furo||B.interno;if(!furoB)continue;
    const a=eixoMundo(A.s),b=eixoMundo(B.s);if(Math.abs(a.z.dot(b.z))<.9995)continue;const d=b.o.clone().sub(a.o),dist=d.clone().sub(a.z.clone().multiplyScalar(d.dot(a.z))).length();if(dist>Math.max(tol,A.externo*.02))continue;
    const ta=[0,a.h],tb=[d.dot(a.z),d.dot(a.z)+b.h*Math.sign(a.z.dot(b.z))].sort((x,y)=>x-y),sob=Math.min(ta[1],tb[1])-Math.max(ta[0],tb[0]);if(sob<=tol)continue;
    if(A.externo>B.furo*1.6&&!B.interno)continue;if(B.interno&&A.externo>(B.externo||1e9))continue;
    const diam=A.externo-furoB;if(diam<0&&-diam>Math.max(tol*200,furoB*.01))continue;out.push({a:A.pc.id,b:B.pc.id,diam_externo:A.externo,diam_furo:furoB,interferencia:diam>tol?+diam.toFixed(4):0,folga:diam<-tol?+(-diam).toFixed(4):0,comprimento:+sob.toFixed(3),desalinhamento:+dist.toFixed(4)})}
  const vistos=new Set();return out.filter(x=>{const k=[x.a,x.b,x.diam_externo,x.diam_furo].join("|");if(vistos.has(k))return false;vistos.add(k);return true})}

/* ---------- colisões gerais por amostragem do volume comum */
function colisoes(pecas,{amostras=6000}={}){const out=[];const caixas=pecas.map(pc=>{const b=new THREE.Box3();pc._geos.forEach(g=>{g.computeBoundingBox();b.union(g.boundingBox)});return b});
  for(let i=0;i<pecas.length;i++)for(let j=i+1;j<pecas.length;j++){const I=caixas[i].clone().intersect(caixas[j]);if(I.isEmpty())continue;const sz=I.getSize(new THREE.Vector3());if(sz.x<=0||sz.y<=0||sz.z<=0)continue;
    const n=Math.round(Math.cbrt(amostras)),pts=[];let dentro=0;const c=new THREE.Vector3();
    for(let a=0;a<n;a++)for(let b=0;b<n;b++)for(let k=0;k<n;k++){const p=new THREE.Vector3(I.min.x+sz.x*(a+.5)/n,I.min.y+sz.y*(b+.5)/n,I.min.z+sz.z*(k+.5)/n);if(pecaContem(pecas[i],p)&&pecaContem(pecas[j],p)){dentro++;c.add(p);if(pts.length<400)pts.push(p)}}
    if(dentro){const vol=sz.x*sz.y*sz.z*dentro/(n*n*n);out.push({a:pecas[i].id,b:pecas[j].id,volume:vol,centro:c.multiplyScalar(1/dentro),pontos:pts})}}return out}

/* ---------- cena */
async function eng3dCena(el,{pecas,escala=1,interf=[],marcadores=[]}){await loadScript("vendor/three.min.js");const T=THREE;el.innerHTML="";const W=el.clientWidth||700,H=el.clientHeight||440;
  let ren;try{ren=new T.WebGLRenderer({antialias:true,alpha:true})}catch(e){el.innerHTML=`<p class="note">Este navegador não liberou o 3D.</p>`;return null}
  ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.setSize(W,H);ren.localClippingEnabled=true;el.append(ren.domElement);
  const sc=new T.Scene(),cam=new T.PerspectiveCamera(38,W/H,.001,1e5);cam.up.set(0,0,1);sc.add(new T.HemisphereLight(0xffffff,0x404040,1));const dl=new T.DirectionalLight(0xffffff,.75);dl.position.set(3,-5,8);sc.add(dl);
  const corte=new T.Plane(new T.Vector3(-1,0,0),1e9),raiz=new T.Group();raiz.scale.setScalar(escala);sc.add(raiz);const objs=new Map();
  for(const pc of pecas){const g=new T.Group();const cor=new T.Color(pc.cor||DISC_COR[pc.disciplina]||DISC_COR.outro);
    const mat=new T.MeshStandardMaterial({color:cor,metalness:pc.disciplina==="civil"?.05:.45,roughness:pc.disciplina==="civil"?.85:.45,transparent:true,opacity:pc.origem==="estimado"?.75:1,clippingPlanes:[corte],clipShadows:true,side:T.DoubleSide});
    const linha=new T.LineBasicMaterial({color:0x0b0b0b,transparent:true,opacity:.35,clippingPlanes:[corte]});
    for(const geo of pc._geos){g.add(new T.Mesh(geo,mat));if(geo.attributes.position.count<60000)g.add(new T.LineSegments(new T.EdgesGeometry(geo,30),linha))}
    for(const geo of pc._furos||[]){g.add(new T.Mesh(geo,new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false,clippingPlanes:[corte]})))}
    g.userData.peca=pc;raiz.add(g);objs.set(pc.id,{g,mat})}
  const mk=new T.Group();raiz.add(mk);
  for(const c of interf){const geo=new T.BufferGeometry().setFromPoints(c.pontos||[]);mk.add(new T.Points(geo,new T.PointsMaterial({color:0xff3b3b,size:4,sizeAttenuation:false,depthTest:false})))}
  for(const m of marcadores){const s=new T.Mesh(new T.SphereGeometry(1,16,12),new T.MeshBasicMaterial({color:m.cor||0xff3b3b,transparent:true,opacity:.55,depthTest:false}));s.position.copy(m.p);s.scale.setScalar(m.r||1);mk.add(s)}
  const box=new T.Box3().setFromObject(raiz),cen=box.getCenter(new T.Vector3()),tam=box.getSize(new T.Vector3()),R=Math.max(tam.length()*.5,1e-3);
  const grid=new T.GridHelper(R*6,30,0x555555,0x2a2a2a);grid.rotation.x=Math.PI/2;grid.position.set(cen.x,cen.y,box.min.z);sc.add(grid);
  let th=-.85,ph=1.0,dist=R*2.6;const alvo=cen.clone();const poe=()=>{cam.position.set(alvo.x+dist*Math.sin(ph)*Math.cos(th),alvo.y+dist*Math.sin(ph)*Math.sin(th),alvo.z+dist*Math.cos(ph));cam.near=dist/1000;cam.far=dist*100;cam.updateProjectionMatrix();cam.lookAt(alvo)};poe();
  let arr=null;const cv=ren.domElement;cv.style.touchAction="none";
  cv.onpointerdown=e=>{arr={x:e.clientX,y:e.clientY,b:e.button};cv.setPointerCapture(e.pointerId)};
  cv.onpointermove=e=>{if(!arr)return;const dx=e.clientX-arr.x,dy=e.clientY-arr.y;arr.x=e.clientX;arr.y=e.clientY;if(arr.b===2||e.shiftKey){const f=dist/700;alvo.x+=(-dx*Math.sin(th))*f;alvo.y+=(dx*Math.cos(th))*f;alvo.z+=dy*f}else{th-=dx*.008;ph=Math.min(3.1,Math.max(.05,ph-dy*.008))}poe();desenha()};
  cv.onpointerup=()=>{arr=null};cv.oncontextmenu=e=>e.preventDefault();cv.onwheel=e=>{e.preventDefault();dist*=e.deltaY>0?1.12:.89;poe();desenha()};
  const desenha=()=>ren.render(sc,cam);desenha();
  return {desenha,box,
    visivel:(disc,on)=>{for(const [,o] of objs)if(o.g.userData.peca.disciplina===disc)o.g.visible=on;desenha()},
    opacidade:v=>{for(const [,o] of objs){o.mat.opacity=v;o.mat.depthWrite=v>.95}desenha()},
    corte:(eixo,frac)=>{if(frac>=1){corte.constant=1e9;desenha();return}const n=eixo==="x"?new T.Vector3(-1,0,0):eixo==="y"?new T.Vector3(0,-1,0):new T.Vector3(0,0,-1);const lo=box.min[eixo],hi=box.max[eixo];corte.normal.copy(n);corte.constant=(lo+(hi-lo)*frac);desenha()},
    foco:id=>{const o=objs.get(id);if(!o)return;const b=new T.Box3().setFromObject(o.g);alvo.copy(b.getCenter(new T.Vector3()));dist=Math.max(b.getSize(new T.Vector3()).length()*1.6,R*.05);poe();desenha()},
    destaca:ids=>{for(const [id,o] of objs){o.mat.emissive?.set(ids.includes(id)?0x661111:0x000000)}desenha()},
    obj:()=>{let s="# Prognos · Black and White\n",off=1;for(const [id,o] of objs){s+=`o ${String(id).replace(/\s+/g,"_")}\n`;o.g.traverse(m=>{if(!m.isMesh)return;const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry,p=g.attributes.position;for(let i=0;i<p.count;i++)s+=`v ${(p.getX(i)*escala).toFixed(5)} ${(p.getY(i)*escala).toFixed(5)} ${(p.getZ(i)*escala).toFixed(5)}\n`;for(let i=0;i<p.count;i+=3)s+=`f ${off+i} ${off+i+1} ${off+i+2}\n`;off+=p.count})}return s}}}

/* ---------- cartão do modelo */
function eng3dPrepara(M){const pecas=(M.pecas||[]).map((p,i)=>({id:p.id||p.nome||"peca"+(i+1),nome:p.nome||p.id||"peça "+(i+1),disciplina:DISC_COR[p.disciplina]?p.disciplina:"outro",cor:p.cor,origem:p.origem||"estimado",fonte:p.fonte,
  solidos:(p.solidos||[]).filter(s=>s&&s.forma),vazios:(p.vazios||[]).filter(s=>s&&s.forma)})).filter(p=>p.solidos.length);
  for(const pc of pecas){pc._geos=pc.solidos.map(s=>{s._inv=solMatriz(s).invert();return solGeom(s)});pc._furos=pc.vazios.map(s=>{s._inv=solMatriz(s).invert();return solGeom(s)})}return pecas}
function eng3dAnalisa(M,pecas){const un=M.unidade==="m"?"m":"mm",tol=un==="m"?1e-5:.005;
  const aj=ajustesCoaxiais(pecas,tol),col=colisoes(pecas);const previstos=new Set((M.ajustes_previstos||[]).map(x=>[x[0],x[1]].sort().join("|")));
  const coax=new Set(aj.filter(a=>a.interferencia>0).map(a=>[a.a,a.b].sort().join("|")));
  const conflitos=col.filter(c=>!coax.has([c.a,c.b].sort().join("|"))).map(c=>({...c,previsto:previstos.has([c.a,c.b].sort().join("|"))}));
  return {un,ajustes:aj.map(a=>({...a,previsto:previstos.has([a.a,a.b].sort().join("|"))})),conflitos}}
function eng3dCard(d){const M=JSON.parse(JSON.stringify(d.modelo||{}));const el=card(`Modelo 3D · ${M.nome||"conjunto"}`,`<div class="e3d"></div><div class="e3dctl"></div><div class="simg"><div><small>Interferências e ajustes</small><div class="e3dint"></div></div><div><small>Peças</small><div class="e3dpc scroll" style="max-height:220px"></div></div></div><p class="note e3dnota"></p>`,
  `<button class="btn" data-e="obj">Exportar OBJ</button><button class="btn" data-e="json">Modelo (JSON)</button>`);
  setTimeout(async()=>{try{await loadScript("vendor/three.min.js")}catch(e){el.querySelector(".e3d").innerHTML=`<p class="note">Não consegui carregar o 3D.</p>`;return}
    const pecas=eng3dPrepara(M),A=eng3dAnalisa(M,pecas),un=A.un,fator=un==="mm"?.001:1;
    const nome=id=>pecas.find(p=>p.id===id)?.nome||id,fmtV=v=>un==="mm"?(v/1000).toFixed(1)+" cm³":(v*1000).toFixed(1)+" L";
    const marc=A.conflitos.map(c=>({p:c.centro,r:Math.cbrt(c.volume)*.6+(un==="mm"?2:.02),cor:c.previsto?0xffc857:0xff3b3b}));
    const V=await eng3dCena(el.querySelector(".e3d"),{pecas,escala:fator,interf:A.conflitos.filter(c=>!c.previsto),marcadores:marc});if(!V)return;
    const discs=[...new Set(pecas.map(p=>p.disciplina))];
    el.querySelector(".e3dctl").innerHTML=`<div class="lin">${discs.map(k=>`<label class="io on" style="background:${DISC_COR[k]};border-color:${DISC_COR[k]};color:#07080A"><input type="checkbox" checked data-d="${k}" style="margin:0"> ${DISC_NOME[k]}</label>`).join("")}</div>
      <div class="lin"><label class="kb">Transparência <input type="range" min="15" max="100" value="100" data-o></label><label class="kb">Corte <select data-ce><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select> <input type="range" min="0" max="100" value="100" data-c></label></div>`;
    el.querySelector(".e3dctl").oninput=e=>{const t=e.target;if(t.dataset.d)V.visivel(t.dataset.d,t.checked);if(t.dataset.o!=null)V.opacidade(+t.value/100);if(t.dataset.c!=null||t.dataset.ce!=null)V.corte(el.querySelector("[data-ce]").value,+el.querySelector("[data-c]").value/100)};
    const linhas=[...A.ajustes.map(a=>`<div class="rung ${a.interferencia&&!a.previsto?"al":a.interferencia?"":"on"}" data-f="${esc_(a.a)}|${esc_(a.b)}"><b>${esc(nome(a.a))} em ${esc(nome(a.b))}</b> Ø${a.diam_externo} em furo Ø${a.diam_furo} ${un}: ${a.interferencia?`interferência diametral de ${a.interferencia} ${un}${a.previsto?" (ajuste prensado previsto)":" — não previsto"}`:a.folga?`folga diametral de ${a.folga} ${un}`:"ajuste exato"} · contato em ${a.comprimento} ${un}${a.desalinhamento?` · desalinhamento ${a.desalinhamento} ${un}`:""}</div>`),
      ...A.conflitos.map(c=>`<div class="rung ${c.previsto?"":"al"}" data-f="${esc_(c.a)}|${esc_(c.b)}"><b>${esc(nome(c.a))} × ${esc(nome(c.b))}</b> ${c.previsto?"sobreposição prevista":"colisão"} · volume comum ≈ ${fmtV(c.volume)} · em (${[c.centro.x,c.centro.y,c.centro.z].map(v=>(Math.abs(v)<1e-9?0:+v).toFixed(un==="mm"?0:2).replace(/^-0(\.0+)?$/,"0")).join(", ")}) ${un}</div>`)];
    el.querySelector(".e3dint").innerHTML=linhas.join("")||`<span class="kb">Nenhuma interferência encontrada.</span>`;
    el.querySelector(".e3dint").onclick=e=>{const r=e.target.closest("[data-f]");if(!r)return;const [a,b]=r.dataset.f.split("|");V.destaca([a,b]);V.foco(a)};
    el.querySelector(".e3dpc").innerHTML=pecas.map(p=>`<div class="rung" data-p="${esc_(p.id)}"><b style="color:${DISC_COR[p.disciplina]}">■</b> <b>${esc(p.nome)}</b> · ${DISC_NOME[p.disciplina]} · ${p.origem==="estimado"?"<i>medidas estimadas</i>":p.origem}${p.fonte?" · "+esc(p.fonte):""}</div>`).join("");
    el.querySelector(".e3dpc").onclick=e=>{const r=e.target.closest("[data-p]");if(r){V.destaca([r.dataset.p]);V.foco(r.dataset.p)}};
    el.querySelector(".e3dnota").textContent=`${pecas.length} peça(s) em ${un}. Arraste para girar, Shift ou botão direito para mover, roda para zoom. Peças semitransparentes têm medidas estimadas. ${M.observacoes||""}`;
    el.querySelector(".acts").onclick=e=>{const b=e.target.closest("[data-e]");if(!b)return;const nm=(M.nome||"modelo").replace(/[^\w-]+/g,"_");
      if(b.dataset.e==="obj")baixar(nm+".obj",V.obj(),"text/plain");else baixar(nm+".json",JSON.stringify(d.modelo,null,1),"application/json")}},30);
  return el}
const esc_=s=>String(s).replace(/["|<>&]/g,"_");
function baixar(nome,conteudo,tipo){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([conteudo],{type:tipo}));a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

/* ======================= MODELOS NATIVOS: STEP, IGES, BREP, IFC, STL, OBJ ======================= */
const EXT3D=/^(step|stp|iges|igs|brep|ifc|stl|obj)$/i;
function stlLer(ab){const T=THREE,dv=new DataView(ab),n=ab.byteLength>=84?dv.getUint32(80,true):0;
  if(84+n*50===ab.byteLength){const p=new Float32Array(n*9);for(let i=0;i<n;i++)for(let k=0;k<9;k++)p[i*9+k]=dv.getFloat32(84+i*50+12+k*4,true);const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(p,3));g.computeVertexNormals();return [{nome:"STL",geo:g}]}
  const t=new TextDecoder().decode(ab),v=[...t.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)].flatMap(m=>[+m[1],+m[2],+m[3]]);const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(v,3));g.computeVertexNormals();return [{nome:"STL",geo:g}]}
function objLer(txt){const T=THREE,v=[],out=[];let atual={nome:"OBJ",p:[]};const fecha=()=>{if(atual.p.length){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(atual.p,3));g.computeVertexNormals();out.push({nome:atual.nome,geo:g})}};
  for(const l of txt.split(/\r?\n/)){const s=l.trim().split(/\s+/);if(s[0]==="v")v.push([+s[1],+s[2],+s[3]]);else if(s[0]==="o"||s[0]==="g"){fecha();atual={nome:s.slice(1).join(" ")||"parte",p:[]}}
    else if(s[0]==="f"){const id=s.slice(1).map(x=>{const i=parseInt(x);return i<0?v.length+i:i-1});for(let k=1;k<id.length-1;k++)for(const q of [id[0],id[k],id[k+1]])atual.p.push(...(v[q]||[0,0,0]))}}fecha();return out}
/* o leitor STEP/IGES roda num worker separado: assim a página continua com a política de segurança restrita */
function occtLer(ab,ext){return new Promise((res,rej)=>{const w=new Worker("vendor/occt-import-js-worker.js");const fmt=/^(step|stp)$/i.test(ext)?"step":/^(iges|igs)$/i.test(ext)?"iges":"brep";
  const t=setTimeout(()=>{w.terminate();rej(new Error("o arquivo demorou demais para abrir"))},180000);
  w.onmessage=ev=>{clearTimeout(t);w.terminate();const r=ev.data;if(!r||!r.success)return rej(new Error("não consegui ler o arquivo CAD"));
    res(r.meshes.map((m,i)=>{const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(m.attributes.position.array,3));if(m.attributes.normal)g.setAttribute("normal",new THREE.Float32BufferAttribute(m.attributes.normal.array,3));if(m.index)g.setIndex(m.index.array);if(!m.attributes.normal)g.computeVertexNormals();
      return {nome:m.name||`corpo ${i+1}`,geo:g,cor:m.color?"#"+new THREE.Color(...m.color).getHexString():null}}))};
  w.onerror=e=>{clearTimeout(t);w.terminate();rej(new Error(e.message||"falha no leitor CAD"))};w.postMessage({format:fmt,buffer:new Uint8Array(ab),params:null})})}
const IFC_DISC=[[/WALL|SLAB|ROOF|STAIR|RAMP|FOOTING|PILE|COVERING|DOOR|WINDOW|RAILING|CURTAIN/,"civil"],[/BEAM|COLUMN|MEMBER|PLATE|TRUSS/,"estrutura"],[/PIPE|DUCT|FLOW|VALVE|PUMP|TANK|FITTING/,"tubulacao"],[/CABLE|ELECTRIC|LIGHT|OUTLET|SWITCHING|PROTECTIVE|TRANSFORMER|MOTOR/,"eletrica"],[/SENSOR|CONTROLLER|ALARM|ACTUATOR/,"instrumentacao"],[/MECHANICAL|EQUIPMENT|FURNISHING/,"mecanica"]];
async function ifcLer(ab){await loadScript("vendor/web-ifc-api-iife.js");const api=new WebIFC.IfcAPI();api.SetWasmPath(new URL("vendor/",location.href).href,true);await api.Init();
  const id=api.OpenModel(new Uint8Array(ab)),grupos=new Map();
  api.StreamAllMeshes(id,mesh=>{let tipo="";try{tipo=String(api.GetNameFromTypeCode?.(api.GetLineType(id,mesh.expressID))||api.GetLineType(id,mesh.expressID))}catch(e){}const T=tipo.toUpperCase();const disc=(IFC_DISC.find(([r])=>r.test(T))||[0,"outro"])[1];
    for(let i=0;i<mesh.geometries.size();i++){const pg=mesh.geometries.get(i),geo=api.GetGeometry(id,pg.geometryExpressID),vd=api.GetVertexArray(geo.GetVertexData(),geo.GetVertexDataSize()),ix=api.GetIndexArray(geo.GetIndexData(),geo.GetIndexDataSize());
      const pos=new Float32Array(vd.length/2);for(let k=0,j=0;k<vd.length;k+=6,j+=3){pos[j]=vd[k];pos[j+1]=vd[k+1];pos[j+2]=vd[k+2]}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(ix),1));
      g.applyMatrix4(new THREE.Matrix4().fromArray(pg.flatTransformation));g.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI/2));g.computeVertexNormals();const k=disc+"|"+(T.replace(/^IFC/,"")||"elemento");if(!grupos.has(k))grupos.set(k,{nome:T.replace(/^IFC/,"")||"elemento",disciplina:disc,geos:[]});grupos.get(k).geos.push(g);geo.delete?.()}});
  api.CloseModel(id);return [...grupos.values()].map(x=>({nome:`${x.nome} (${x.geos.length})`,disciplina:x.disciplina,geos:x.geos}))}
async function modeloNativo(file){const ext=(file.name.split(".").pop()||"").toLowerCase(),ab=await file.arrayBuffer();
  if(ext==="stl")return stlLer(ab);if(ext==="obj")return objLer(new TextDecoder().decode(ab));if(ext==="ifc")return ifcLer(ab);return occtLer(ab,ext)}
function nativoCard(d){const el=card(`Modelo 3D · ${d.nome}`,`<div class="e3d"></div><div class="e3dctl"></div><div class="simg"><div><small>Conflitos entre disciplinas (caixas envolventes)</small><div class="e3dint"></div></div><div><small>Partes</small><div class="e3dpc scroll" style="max-height:220px"></div></div></div><p class="note e3dnota"></p>`,`<button class="btn" data-e="obj">Exportar OBJ</button>`);
  setTimeout(async()=>{const box=el.querySelector(".e3d");box.innerHTML=`<p class="note">Lendo o modelo…</p>`;
    try{await loadScript("vendor/three.min.js");const reg=NATIVOS.get(d.chave);if(!reg)throw new Error("o arquivo não está mais carregado nesta sessão; anexe de novo e peça para abrir");
      const partes=reg.partes||(reg.partes=await modeloNativo(reg.file));const pecas=partes.map((p,i)=>({id:"p"+i,nome:p.nome,disciplina:p.disciplina||d.disciplina||"mecanica",cor:p.cor,origem:"arquivo",_geos:p.geos||[p.geo]}));
      const V=await eng3dCena(box,{pecas,escala:d.escala||1});if(!V)return;const caixas=pecas.map(pc=>{const b=new THREE.Box3();pc._geos.forEach(g=>{g.computeBoundingBox();b.union(g.boundingBox)});return b});const conf=[];
      for(let i=0;i<pecas.length&&conf.length<60;i++)for(let j=i+1;j<pecas.length;j++)if(pecas[i].disciplina!==pecas[j].disciplina&&caixas[i].intersectsBox(caixas[j]))conf.push([i,j]);
      const discs=[...new Set(pecas.map(p=>p.disciplina))];el.querySelector(".e3dctl").innerHTML=`<div class="lin">${discs.map(k=>`<label class="io on" style="background:${DISC_COR[k]};border-color:${DISC_COR[k]};color:#07080A"><input type="checkbox" checked data-d="${k}" style="margin:0"> ${DISC_NOME[k]}</label>`).join("")}</div><div class="lin"><label class="kb">Transparência <input type="range" min="15" max="100" value="100" data-o></label><label class="kb">Corte <select data-ce><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select> <input type="range" min="0" max="100" value="100" data-c></label></div>`;
      el.querySelector(".e3dctl").oninput=e=>{const t=e.target;if(t.dataset.d)V.visivel(t.dataset.d,t.checked);if(t.dataset.o!=null)V.opacidade(+t.value/100);if(t.dataset.c!=null||t.dataset.ce!=null)V.corte(el.querySelector("[data-ce]").value,+el.querySelector("[data-c]").value/100)};
      el.querySelector(".e3dint").innerHTML=conf.map(([i,j])=>`<div class="rung al" data-f="p${i}|p${j}"><b>${esc(pecas[i].nome)} × ${esc(pecas[j].nome)}</b> ${DISC_NOME[pecas[i].disciplina]} × ${DISC_NOME[pecas[j].disciplina]}: caixas se cruzam, conferir</div>`).join("")||`<span class="kb">Nenhum cruzamento entre disciplinas.</span>`;
      el.querySelector(".e3dint").onclick=e=>{const r=e.target.closest("[data-f]");if(!r)return;const [a,b]=r.dataset.f.split("|");V.destaca([a,b]);V.foco(a)};
      el.querySelector(".e3dpc").innerHTML=pecas.map(p=>`<div class="rung" data-p="${p.id}"><b style="color:${DISC_COR[p.disciplina]}">■</b> ${esc(p.nome)}</div>`).join("");el.querySelector(".e3dpc").onclick=e=>{const r=e.target.closest("[data-p]");if(r){V.destaca([r.dataset.p]);V.foco(r.dataset.p)}};
      el.querySelector(".e3dnota").textContent=`${pecas.length} parte(s). O cruzamento de caixas envolventes é uma triagem: confirme cada caso girando e cortando o modelo.`;
      el.querySelector(".acts").onclick=e=>{if(e.target.closest("[data-e]"))baixar(d.nome.replace(/\.[^.]+$/,"")+".obj",V.obj(),"text/plain")}}
    catch(e){box.innerHTML=`<p class="note">Não consegui abrir: ${esc(e.message||e)}</p>`}},30);return el}
const NATIVOS=new Map();

/* ======================= DXF ======================= */
function dxfResumo(txt){const L=txt.split(/\r?\n/);const pares=[];for(let i=0;i+1<L.length;i+=2)pares.push([L[i].trim(),L[i+1].trim()]);
  let sec="",ent=null;const ents=[],camadas=new Map(),blocos=new Set();let ext=null;
  for(let i=0;i<pares.length;i++){const [c,v]=pares[i];if(c==="0"&&v==="SECTION"){sec=pares[i+1]?.[1]||"";continue}if(c==="2"&&sec==="BLOCKS"&&pares[i-1]?.[1]==="BLOCK")blocos.add(v);
    if(sec==="HEADER"&&c==="9"&&(v==="$EXTMIN"||v==="$EXTMAX")){const x=+pares[i+1][1],y=+pares[i+2][1];ext=ext||{};ext[v==="$EXTMIN"?"min":"max"]=[x,y]}
    if(sec!=="ENTITIES")continue;if(c==="0"){if(ent)ents.push(ent);ent={t:v,g:{}}}else if(ent){(ent.g[c]=ent.g[c]||[]).push(v)}}if(ent)ents.push(ent);
  const cont={},circ=new Map(),textos=[],cotas=[];for(const e of ents){cont[e.t]=(cont[e.t]||0)+1;const lay=e.g["8"]?.[0]||"0";camadas.set(lay,(camadas.get(lay)||0)+1);
    if(e.t==="CIRCLE"){const d=+(2*+e.g["40"]?.[0]).toFixed(3);circ.set(d,(circ.get(d)||0)+1)}
    if((e.t==="TEXT"||e.t==="MTEXT")&&textos.length<300)textos.push(((e.g["1"]||[]).join("")+(e.g["3"]||[]).join("")).replace(/\\[A-Za-z][^;]*;|[{}]|\\P/g," ").trim());
    if(e.t==="DIMENSION"&&cotas.length<300){const m=+e.g["42"]?.[0],tx=e.g["1"]?.[0];cotas.push(tx&&tx!=="<>"?tx.replace("<>",m?m.toFixed(2):""):m?+m.toFixed(3):"?")}}
  return `DESENHO DXF\nExtensão: ${ext?.min&&ext?.max?`(${ext.min.map(v=>v.toFixed(1))}) a (${ext.max.map(v=>v.toFixed(1))}) · ${(ext.max[0]-ext.min[0]).toFixed(1)} × ${(ext.max[1]-ext.min[1]).toFixed(1)} unidades`:"não informada"}
Entidades: ${Object.entries(cont).map(([k,v])=>k+" "+v).join(", ")}
Camadas: ${[...camadas].sort((a,b)=>b[1]-a[1]).slice(0,60).map(([k,v])=>`${k} (${v})`).join(", ")}
Blocos: ${[...blocos].filter(b=>!b.startsWith("*")).slice(0,80).join(", ")}
Círculos por diâmetro: ${[...circ].sort((a,b)=>a[0]-b[0]).slice(0,80).map(([d,n])=>`Ø${d}×${n}`).join(", ")}
Cotas: ${cotas.join("; ")}
Textos: ${textos.filter(Boolean).join(" | ")}`.slice(0,60000)}

async function nativoAbrir(file,chave){await loadScript("vendor/three.min.js");const partes=await modeloNativo(file);NATIVOS.set(chave,{file,partes});
  const caixas=partes.map(p=>{const b=new THREE.Box3();(p.geos||[p.geo]).forEach(g=>{g.computeBoundingBox();b.union(g.boundingBox)});return b});let conf=0;const tot=new THREE.Box3();caixas.forEach(b=>tot.union(b));
  for(let i=0;i<partes.length;i++)for(let j=i+1;j<partes.length;j++)if((partes[i].disciplina||"m")!==(partes[j].disciplina||"m")&&caixas[i].intersectsBox(caixas[j]))conf++;
  const sz=tot.getSize(new THREE.Vector3());return {partes:partes.length,nomes:partes.slice(0,60).map(p=>p.nome),disciplinas:[...new Set(partes.map(p=>p.disciplina||"mecanica"))],dimensoes_envelope:[sz.x,sz.y,sz.z].map(v=>+v.toFixed(3)),cruzamentos_entre_disciplinas:conf}}
