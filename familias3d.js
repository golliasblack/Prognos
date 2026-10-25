/* Prognos · Black and White — FAMÍLIAS DE EQUIPAMENTOS EM 3D
   Geradores em código: a IA manda só os parâmetros (potência, diâmetro do rotor, relação, torque, vão...) e o Prognos
   desenha o equipamento inteiro. Gasta poucas centenas de tokens em vez de milhares.
   Todas as medidas em mm. Eixo z para cima.
   Quando um dado não vem, o gerador estima pelas proporções típicas da família (normas IEC 60072 para motores,
   ISO 2858/5199 para bombas e proporções usuais de redutores e pontes rolantes) e registra a suposição. */

const FAM_INFO={
  motor_eletrico:"motor elétrico de indução IEC com pés: potencia_kw, polos, carcaca (altura do eixo em mm), d_eixo",
  bomba_centrifuga:"bomba centrífuga horizontal com motor e base: d_rotor, dn_succao, dn_recalque, potencia_kw, rpm, designacao (ex.: 250-400)",
  redutor:"redutor de engrenagens de eixos paralelos: estagios, relacao, torque_saida_knm ou potencia_kw+rpm_entrada, comprimento/largura/altura da carcaça, d_eixo_entrada, d_eixo_saida, distancias_centro [mm], massa_kg",
  ponte_rolante:"ponte rolante dupla viga com carro, tambor, redutor e motor de elevação: capacidade_t, vao_m, altura_trilho_m, posicao_carro_m, bitola_carro_mm",
  mancal:"mancal bipartido (tipo SNL) com rolamento: d_eixo, d_rolamento_ext, largura",
  tanque:"tanque vertical: diametro, altura, com_pernas",
  painel:"painel elétrico ou CCM em colunas: colunas, largura_coluna, altura, profundidade",
  transportador_correia:"transportador de correia com acionamento: comprimento, largura_correia, altura, potencia_kw",
  estrutura_portico:"estrutura em pórticos de perfis: vao, altura, comprimento, n_porticos, perfil_altura",
  tubovia:"tubovia (pipe rack) com tubos: comprimento, largura, niveis, altura_primeiro_nivel, tubos (lista de DN em mm)",
  conjunto_rodas:"conjunto de rodas de ponte rolante sobre trilho (roda com flanges, eixo, 2 mancais, trilho e viga de rolamento; motriz leva redutor): d_roda (Ø mm), largura_banda, d_eixo, trilho (ex.: TR57 ou perfil A75), largura_boleto, motriz (true/false), vao_viga_mm, folga_flange",
  ventilador_centrifugo:"ventilador centrífugo com motor: d_rotor, potencia_kw, rpm"};
const num=(v,d)=>{const n=+String(v??"").replace(",",".");return isFinite(n)&&n>0?n:d};
const r5=x=>Math.ceil(x/5)*5;
const cxS=(d,h,x,y,z)=>({forma:"cilindro",d,h,eixo:"x",pos:[x,y,z]});
const cyS=(d,h,x,y,z)=>({forma:"cilindro",d,h,eixo:"y",pos:[x,y,z]});
const czS=(d,h,x,y,z)=>({forma:"cilindro",d,h,pos:[x,y,z]});
const tbX=(de,di,h,x,y,z)=>({forma:"tubo",de,di,h,eixo:"x",pos:[x,y,z]});
const tbY=(de,di,h,x,y,z)=>({forma:"tubo",de,di,h,eixo:"y",pos:[x,y,z]});
const bx=(w,p,h,x,y,z)=>({forma:"caixa",w,p,h,pos:[x,y,z]});
const IEC=[[0.37,71,14],[0.75,80,19],[1.5,90,24],[2.2,100,28],[4,112,28],[7.5,132,38],[15,160,42],[22,180,48],[30,200,55],[45,225,60],[55,250,65],[90,280,75],[132,315,80],[250,355,95],[355,400,110],[560,450,120],[900,500,130],[1500,560,140]];
const torqueNm=(kw,rpm)=>9550*kw/Math.max(1,rpm);
const dEixo=(Tnm,tau=40)=>r5(Math.cbrt(16*Tnm*1000/(Math.PI*tau)));

function motorEletrico(p,sup){const kw=num(p.potencia_kw,null);let H=num(p.carcaca,null),D=num(p.d_eixo,null);
  const lin=IEC.find(l=>kw?l[0]>=kw:l[1]>=(H||0))||IEC.at(-1);if(!H){H=lin[1];sup.push(`carcaça IEC ${H} pela potência`)}if(!D){D=(IEC.find(l=>l[1]>=H)||IEC.at(-1))[2];sup.push(`eixo Ø${D} mm pela carcaça`)}
  const Dc=Math.round(1.9*H),L=Math.round(3.3*H),E=Math.round(2.1*D);
  return {pecas:[{id:"motor",nome:`Motor ${kw?kw+" kW":"IEC "+H}`,disciplina:"eletrica",solidos:[cxS(Dc,L,-L,0,H),cxS(Dc*.92,L*.18,-L*1.18,0,H),bx(L*.85,Dc*.95,H*.25,-L/2,0,0),bx(Dc*.42,Dc*.42,Dc*.32,-L*.55,0,H+Dc*.42)]},
    {id:"motor_eixo",nome:`Eixo do motor Ø${D}`,disciplina:"mecanica",solidos:[cxS(D,E+40,-40,0,H)]}],H,D,E,L,comprimento:L*1.18+E}}

function bombaCentrifuga(p,sup){let d=num(p.d_rotor,null),ds=num(p.dn_succao,null),dr=num(p.dn_recalque,null);const des=String(p.designacao||"").match(/(\d+)\D+(\d+)(?:\D+(\d+))?/);
  if(des){const a=+des[1],b=+des[2],c=des[3]?+des[3]:null;if(c){dr=dr||a;ds=ds||b;d=d||c}else{dr=dr||a;d=d||(b<100?b*10:b)}sup.push(`designação ${p.designacao} lida como recalque DN${dr}${ds?", sucção DN"+ds:""}, rotor Ø${d} mm`)}
  d=d||315;dr=dr||Math.max(25,r5(d*.35));ds=ds||r5(dr*1.25);const rpm=num(p.rpm,d>=400?1180:1750),kw=num(p.potencia_kw,Math.round(Math.pow(d/100,3)*(rpm/1750)**3*4.5));
  if(!p.potencia_kw)sup.push(`potência estimada ${kw} kW a ${rpm} rpm`);const T=torqueNm(kw,rpm),de=dEixo(T,25);
  const Dv=Math.round(d*1.35+80),bv=Math.round(d*.42+40),M=motorEletrico({potencia_kw:kw},sup),Hs=Math.max(Math.round(Dv*.75),M.H+80);
  const xc=0,Lm=Math.round(Dv*1.3),Lac=Math.round(de*1.6),xAc=xc+bv/2+Lm+15+Lac,tx=xAc+M.E+10,Gm=matrizG([tx,0,Hs-M.H],180);
  const mot=M.pecas.map(pc=>{const c=JSON.parse(JSON.stringify(pc));c.solidos.forEach(s=>s.G=Gm);return c});
  const x0=xc-bv/2-Dv*.55-100,x1=tx+M.L*1.18+100,Lbase=x1-x0;
  const pecas=[
    {id:"carcaca",nome:`Carcaça (voluta) DN${ds}×DN${dr}`,disciplina:"processo",opacidade:.45,solidos:[cxS(Dv,bv,xc-bv/2,0,Hs),tbX(ds+40,ds,Dv*.55,xc-bv/2-Dv*.55,0,Hs),cxS(ds+150,24,xc-bv/2-Dv*.55,0,Hs),{forma:"tubo",de:dr+40,di:dr,h:Dv*.62,pos:[xc,Dv*.28,Hs]},czS(dr+150,24,xc,Dv*.28,Hs+Dv*.62-24),bx(bv*.9,Dv*.7,Hs-Dv/2,xc,0,0)]},
    {id:"rotor",nome:`Rotor Ø${d}`,disciplina:"processo",solidos:[cxS(d,bv*.42,xc-bv*.21,0,Hs)]},
    {id:"eixo",nome:`Eixo Ø${de}`,disciplina:"mecanica",solidos:[cxS(de,bv/2+Lm+Lac/2+bv*.21,xc-bv*.21,0,Hs)]},
    {id:"selo",nome:"Selo mecânico",disciplina:"mecanica",solidos:[tbX(de*2.2,de,bv*.45,xc+bv/2,0,Hs)]},
    {id:"mancal",nome:"Cavalete de mancais",disciplina:"mecanica",opacidade:.6,solidos:[tbX(de*3.2,de,Lm*.82,xc+bv/2+Lm*.15,0,Hs),bx(Lm*.6,de*3,Hs-de*1.6,xc+bv/2+Lm*.55,0,0)]},
    {id:"acoplamento",nome:"Acoplamento",disciplina:"mecanica",solidos:[cxS(de*3,Lac,xc+bv/2+Lm+15,0,Hs)]},
    ...mot.map(c=>({...c,id:"bomba_"+c.id})),
    {id:"base",nome:"Base metálica",disciplina:"estrutura",solidos:[bx(Lbase,Math.max(Dv,M.H*2.2)*1.1,120,(x0+x1)/2,0,-120)]},
    ...(Hs-M.H>10?[{id:"calco_motor",nome:"Calço do motor",disciplina:"estrutura",solidos:[bx(M.L*.9,M.H*2,Hs-M.H,tx+M.L/2,0,0)]}]:[])];
  return {pecas,dados:{d_rotor:d,dn_succao:ds,dn_recalque:dr,potencia_kw:kw,rpm,eixo:de,altura_eixo:Hs,comprimento_total:Math.round(Lbase)}}}

function redutor(p,sup){const S=Math.max(1,Math.min(4,Math.round(num(p.estagios,null)||(num(p.relacao,20)>45?3:num(p.relacao,20)>8?2:1))));const i=num(p.relacao,S===1?5:S===2?16:40);
  let Tout=num(p.torque_saida_knm,null)?num(p.torque_saida_knm)*1000:null;if(!Tout){const kw=num(p.potencia_kw,null),n=num(p.rpm_entrada,1750);if(kw){Tout=torqueNm(kw,n/i)*.95}else{Tout=50000;sup.push("torque de saída suposto 50 kN·m")}}
  const ik=Math.pow(i,1/S),T=[];for(let j=0;j<=S;j++)T.push(Tout/Math.pow(ik,S-j));
  const ds=T.map((t,j)=>j===0&&num(p.d_eixo_entrada,null)?num(p.d_eixo_entrada):j===S&&num(p.d_eixo_saida,null)?num(p.d_eixo_saida):dEixo(t));
  const dc=(p.distancias_centro||[]).map(x=>num(x,null)).filter(Boolean);const a=[];for(let k=0;k<S;k++)a.push(dc[k]||Math.round(11*Math.cbrt(T[k+1])));if(dc.length<S)sup.push("distâncias entre centros estimadas pelo torque");
  const eng=[];let x=0;const X=[0];for(let k=0;k<S;k++){const d1=2*a[k]/(1+ik),d2=2*a[k]-d1,b=Math.round(.32*a[k]);eng.push({k,d1,d2,b,x0:x});x+=a[k];X.push(x)}
  const dmax=Math.max(...eng.map(e=>e.d2)),bmax=Math.max(...eng.map(e=>e.b));
  let C=Math.round(x+dmax+220),Lg=Math.round(bmax*S*.9+bmax+360),A=Math.round(dmax+260);const hc=Math.round(A*.55);
  const fx=num(p.comprimento,null)?num(p.comprimento)/C:1,fy=num(p.largura,null)?num(p.largura)/Lg:1,fz=num(p.altura,null)?num(p.altura)/A:1;
  if(fx!==1||fy!==1||fz!==1)sup.push("engrenagens e eixos ajustados às dimensões da carcaça informadas");else sup.push("carcaça dimensionada pelas engrenagens (sem desenho)");
  C*=fx;Lg*=fy;A*=fz;const xs=X.map(v=>(v-x/2)*fx),zc=hc*fz,yw=Lg/2;
  const pecas=[{id:"carcaca",nome:`Carcaça do redutor ${Math.round(C)}×${Math.round(Lg)}×${Math.round(A)}`,disciplina:"mecanica",opacidade:.28,solidos:[bx(C,Lg,A,0,0,0),bx(C*1.06,Lg*1.02,40,0,0,zc-20)],
    vazios:xs.map((xx,j)=>cyS(r5(ds[j]*1.8+20),Lg+20,xx,-yw-10,zc))}];
  xs.forEach((xx,j)=>{const ent=j===0,sai=j===S;const ext=ent?ds[j]*2.2:sai?ds[j]*2:60;const y0=ent?-yw-ext:sai?-yw+40:-yw+40,len=(ent?ext+Lg-40:sai?Lg-40+ext:Lg-80);
    pecas.push({id:`eixo${j}`,nome:`Eixo ${ent?"de entrada":sai?"de saída":"intermediário "+j} Ø${ds[j]}`,disciplina:"mecanica",solidos:[cyS(ds[j],len,xx,y0,zc)]});
    for(const lado of [-1,1])pecas.push({id:`rol${j}${lado<0?"a":"b"}`,nome:`Rolamento eixo ${j} ${lado<0?"lado A":"lado B"}`,disciplina:"mecanica",solidos:[tbY(r5(ds[j]*1.8+20),ds[j],Math.round(ds[j]*.45),xx,lado<0?-yw+10:yw-10-Math.round(ds[j]*.45),zc)]})});
  eng.forEach((e,k)=>{const y=-yw+120+k*bmax*.9;pecas.push({id:`pinhao${k+1}`,nome:`Pinhão ${k+1}º estágio Ø${Math.round(e.d1)}`,disciplina:"mecanica",solidos:[cyS(e.d1*fx,e.b*fy,xs[k],y,zc)]},{id:`coroa${k+1}`,nome:`Coroa ${k+1}º estágio Ø${Math.round(e.d2)}`,disciplina:"mecanica",solidos:[cyS(e.d2*fx,e.b*fy,xs[k+1],y,zc)]})});
  const massa=num(p.massa_kg,null)||Math.round(C*Lg*A*1e-9*7850*.22);if(!p.massa_kg)sup.push(`massa estimada ${massa} kg (≈22% do volume da carcaça em aço)`);
  return {pecas,dados:{estagios:S,relacao:+i.toFixed(2),torque_saida_knm:+(Tout/1000).toFixed(1),eixos_mm:ds,distancias_centro_mm:a,carcaca_mm:[C,Lg,A].map(Math.round),massa_kg:massa,altura_eixos_mm:Math.round(zc),x_entrada:Math.round(xs[0]),x_saida:Math.round(xs[S]),extensao_entrada:Math.round(ds[0]*2.2)}}}

function pontoRolante(p,sup){const cap=num(p.capacidade_t,50),vao=num(p.vao_m,22)*1000,ht=num(p.altura_trilho_m,12)*1000,xc=num(p.posicao_carro_m,vao/2000)*1000;
  const h=Math.round(vao/16),bw=Math.round(h*.45),g=num(p.bitola_carro_mm,Math.round(2000+cap*12));const pecas=[];
  for(const s of [-1,1])pecas.push({id:`viga${s<0?"A":"B"}`,nome:`Viga principal ${s<0?"A":"B"}`,disciplina:"estrutura",solidos:[bx(vao,bw,h,vao/2,s*g/2,ht)]});
  for(const s of [0,1])pecas.push({id:`cabeceira${s+1}`,nome:`Cabeceira ${s+1}`,disciplina:"estrutura",solidos:[bx(700,g+bw+900,h*.6,s*vao,0,ht-h*.1)]});
  for(const s of [0,1])pecas.push({id:`caminho${s+1}`,nome:`Viga de rolamento ${s+1}`,disciplina:"civil",solidos:[bx(600,g*4,800,s*vao,0,ht-800-h*.1)]});
  const D=Math.round(500+cap*6),Lt=Math.round(g*.7),zt=ht+h;
  pecas.push({id:"carro",nome:"Estrutura do carro",disciplina:"estrutura",opacidade:.7,solidos:[bx(D*2.4,g+bw,250,xc,0,zt)]});
  pecas.push({id:"tambor",nome:`Tambor Ø${D}`,disciplina:"mecanica",solidos:[cyS(D,Lt,xc-D*.35,-Lt/2,zt+250+D*.55)]});
  const sup2=[],R=redutor({estagios:3,relacao:num(p.relacao_elevacao,60),torque_saida_knm:cap*9.81*D/2/8/1000*1.25},sup2);
  const xD=xc-D*.35,zD=zt+250+D*.55,y0=Lt/2+60,GR=matrizG([xD-R.dados.x_saida,y0+R.dados.carcaca_mm[1]/2,zD-R.dados.altura_eixos_mm],0);
  R.pecas.forEach(pc=>{pc.id="redutor_"+pc.id;pc.nome="Redutor de elevação · "+pc.nome;[...pc.solidos,...(pc.vazios||[])].forEach(s=>{s.G=GR});pecas.push(pc)});
  const M=motorEletrico({potencia_kw:Math.round(cap*9.81*0.05/0.9)},sup2),xin=xD-R.dados.x_saida+R.dados.x_entrada,ytip=y0-R.dados.extensao_entrada-30,GM=matrizG([xin,ytip-M.E,zD-M.H],90);
  M.pecas.forEach(pc=>{pc.id="motor_elev_"+pc.id;pc.nome="Elevação · "+pc.nome;pc.solidos.forEach(s=>{s.G=GM});pecas.push(pc)});
  pecas.push({id:"base_motor",nome:"Base do motor de elevação",disciplina:"estrutura",solidos:[bx(M.H*2.2,M.L*1.2,Math.max(10,zD-M.H-(zt+250)),xin,ytip-M.E-M.L*.55,zt+250)]});
  pecas.push({id:"moitao",nome:"Moitão e gancho",disciplina:"mecanica",solidos:[bx(D*.9,D*.6,D*.8,xc,0,ht-h-D*2.2),czS(D*.25,D*.6,xc,0,ht-h-D*2.8)]});
  sup.push(`viga com altura ≈ vão/16, bitola do carro ${g} mm, tambor Ø${D} mm, redutor de elevação para ${(cap*9.81*D/2/8/1000*1.25).toFixed(0)} kN·m (cabo com 8 pernas)`);
  return {pecas,dados:{capacidade_t:cap,vao_mm:vao,altura_trilho_mm:ht,altura_viga_mm:h,bitola_mm:g,tambor_mm:D,redutor_elevacao:R.dados,posicao_redutor:[Math.round(xD-R.dados.x_saida),Math.round(y0+R.dados.carcaca_mm[1]/2),Math.round(zD-R.dados.altura_eixos_mm)]}}}

function mancalSNL(p,sup){const d=num(p.d_eixo,80),De=num(p.d_rolamento_ext,r5(d*1.8+20)),B=num(p.largura,Math.round(d*.45)),H=Math.round(De*.72+20);
  return {pecas:[{id:"caixa",nome:`Mancal bipartido eixo Ø${d}`,disciplina:"mecanica",opacidade:.55,solidos:[bx(De*2.4,B*1.9,H*.55,0,0,0),cyS(De*1.35,B*1.9,0,-B*.95,H)],vazios:[cyS(De,B*2,0,-B,H)]},
    {id:"rolamento",nome:`Rolamento Ø${d}×Ø${De}`,disciplina:"mecanica",solidos:[tbY(De,d,B,0,-B/2,H)]},{id:"eixo",nome:`Eixo Ø${d}`,disciplina:"mecanica",solidos:[cyS(d,B*6,0,-B*3,H)]}],dados:{d,De,B,altura_centro:H}}}
function conjuntoRodas(p,sup){const D=num(p.d_roda||p.diametro,630),tr=String(p.trilho||"TR57").toUpperCase();
  const cat={TR57:[100,140,168],TR68:[108,150,185],A75:[75,95,65],A100:[100,120,75],A120:[120,138,85]};const ref=cat[tr.replace(/[^A-Z0-9]/g,"")]||cat.TR57;if(!p.trilho||!cat[tr.replace(/[^A-Z0-9]/g,"")])sup.push(`trilho ${tr} ${cat[tr.replace(/[^A-Z0-9]/g,"")]?"":"não catalogado; usado perfil de "}boleto ${ref[0]} mm`);
  const bol=num(p.largura_boleto,ref[0]);if(!p.largura_boleto&&!p.trilho)sup.push(`boleto do trilho ${bol} mm`);
  const b=num(p.largura_banda,r5(bol+40)),fl=num(p.altura_flange,28),gap=num(p.folga_flange,(b-bol)/2),d=num(p.d_eixo,r5(D*.22));if(!p.d_roda&&!p.diametro)sup.push(`roda Ø${D} mm (assumida)`);if(!p.largura_banda)sup.push(`banda de rodagem ${b} mm`);if(!p.d_eixo)sup.push(`eixo Ø${d} mm pelo diâmetro da roda`);
  const vao=num(p.vao_viga_mm,b+900),hv=num(p.altura_viga,400),hb=ref[1],hr=hb*0+ref[2];const L=Math.max(3*D,2500),fb=Math.round(fl*.9);
  const pecas=[{id:"roda",nome:`Roda Ø${D} banda ${b}`,disciplina:"mecanica",solidos:[cyS(D,b,0,-b/2,D/2),cyS(D+2*fl,22,0,-b/2-22,D/2),cyS(D+2*fl,22,0,b/2,D/2)]},
    {id:"eixo",nome:`Eixo Ø${d}`,disciplina:"mecanica",solidos:[cyS(d,b+vao*0+Math.round(D*1.1),0,-(b+Math.round(D*1.1))/2,D/2)]}];
  const yb=b/2+22+Math.round(D*.12),Hm=Math.round(d*1.4),Bm=Math.round(d*.9);
  for(const lado of [-1,1])pecas.push({id:"mancal"+(lado<0?"_esq":"_dir"),nome:`Mancal ${lado<0?"esquerdo":"direito"} eixo Ø${d}`,disciplina:"mecanica",opacidade:.6,solidos:[bx(Math.round(d*2.4),Bm,Math.round(d*2),0,lado*(yb+Bm/2)-Bm/2*0,D/2-d*1.0),bx(Math.round(d*2.9),Bm,Math.round(d*.35),0,lado*(yb+Bm/2),D/2-d*1.0-d*.35)],vazios:[cyS(d,Bm+4,0,lado*(yb+Bm/2)-Bm/2-2,D/2)]});
  pecas.push({id:"trilho",nome:`Trilho ${tr}`,disciplina:"estrutura",solidos:[bx(L,bol,Math.round(hr*.35),0,0,-Math.round(hr*.35)),bx(L,Math.round(bol*.35),Math.round(hr*.4),0,0,-Math.round(hr*.75)),bx(L,Math.round(bol*1.4),Math.round(hr*.25),0,0,-hr)]});
  pecas.push({id:"viga",nome:"Viga de rolamento",disciplina:"civil",solidos:[bx(L,Math.round(Math.max(vao*.45,300)),hv,0,0,-hr-hv)]});
  if(p.motriz!==false&&p.motriz!=="false"){const R=redutor({estagios:2,relacao:num(p.relacao,31.5),potencia_kw:num(p.potencia_kw,15),rpm_entrada:1750},sup);if(!p.potencia_kw)sup.push("motorredutor de translação estimado: 15 kW, relação 31,5");
    R.pecas.forEach(pc=>{pc.id="red_"+pc.id;pc.nome="Acionamento · "+pc.nome;const G=matrizG([0,yb+Bm+R.dados.carcaca_mm[1]/2+40,D/2-R.dados.altura_eixos_mm],0);pc.solidos.forEach(s=>s.G=G);(pc.vazios||[]).forEach(s=>s.G=G);pecas.push(pc)})}
  return {pecas,dados:{D,banda:b,flange:fl,boleto:bol,folga_lateral_por_lado:+((b-bol)/2).toFixed(1),eixo:d}}}
function tanque(p){const D=num(p.diametro,3000),H=num(p.altura,4000);const pecas=[{id:"tanque",nome:`Tanque Ø${D}×${H}`,disciplina:"processo",opacidade:.6,solidos:[czS(D,H,0,0,p.com_pernas===false?0:800),{forma:"cone",d1:D,d2:D*.15,h:D*.18,pos:[0,0,(p.com_pernas===false?0:800)+H]}]}];
  if(p.com_pernas!==false)pecas.push({id:"pernas",nome:"Pernas",disciplina:"estrutura",solidos:[0,90,180,270].map(a=>bx(150,150,800,Math.cos(a*Math.PI/180)*D*.42,Math.sin(a*Math.PI/180)*D*.42,0))});return {pecas,dados:{D,H}}}
function painel(p){const n=Math.round(num(p.colunas,4)),w=num(p.largura_coluna,800),h=num(p.altura,2200),pr=num(p.profundidade,600);
  return {pecas:Array.from({length:n},(_,i)=>({id:`coluna${i+1}`,nome:`Coluna ${i+1}`,disciplina:"eletrica",solidos:[bx(w-4,pr,h,i*w+w/2,0,100)]})).concat([{id:"soleira",nome:"Soleira",disciplina:"civil",solidos:[bx(n*w,pr,100,n*w/2,0,0)]}]),dados:{colunas:n,frente_mm:n*w}}}
function transportador(p,sup){const L=num(p.comprimento,20000),b=num(p.largura_correia,1000),h=num(p.altura,1000),Dp=r5(b*.5);
  const pecas=[{id:"estrutura",nome:"Longarinas",disciplina:"estrutura",solidos:[bx(L,120,200,L/2,-(b/2+150),h-200),bx(L,120,200,L/2,b/2+150,h-200),...Array.from({length:Math.ceil(L/3000)+1},(_,i)=>bx(150,b+500,h-200,Math.min(L,i*3000),0,0))]},
    {id:"correia",nome:`Correia ${b} mm`,disciplina:"mecanica",solidos:[bx(L,b,20,L/2,0,h+Dp/2-10)]},{id:"tambor_acion",nome:"Tambor de acionamento",disciplina:"mecanica",solidos:[cyS(Dp,b*1.1,L,-b*.55,h)]},{id:"tambor_retorno",nome:"Tambor de retorno",disciplina:"mecanica",solidos:[cyS(Dp*.8,b*1.1,0,-b*.55,h)]}];
  const R=redutor({estagios:3,relacao:25,potencia_kw:num(p.potencia_kw,30),rpm_entrada:1750},sup);R.pecas.forEach(pc=>{pc.id="red_"+pc.id;pc.nome="Acionamento · "+pc.nome;const G=matrizG([L,b*.55+R.dados.carcaca_mm[1]/2+60,h-R.dados.altura_eixos_mm],0);pc.solidos.forEach(s=>s.G=G);(pc.vazios||[]).forEach(s=>s.G=G);pecas.push(pc)});return {pecas,dados:{L,b}}}
function portico(p){const V=num(p.vao,12000),H=num(p.altura,8000),C=num(p.comprimento,30000),n=Math.max(2,Math.round(num(p.n_porticos,C/6000+1))),hp=num(p.perfil_altura,400);const pecas=[];
  for(let i=0;i<n;i++){const x=i*C/(n-1);pecas.push({id:`portico${i+1}`,nome:`Pórtico ${i+1}`,disciplina:"estrutura",solidos:[bx(hp,hp*.5,H,x,-V/2,0),bx(hp,hp*.5,H,x,V/2,0),bx(hp*.5,V,hp,x,0,H)]})}
  pecas.push({id:"longitudinais",nome:"Vigas longitudinais",disciplina:"estrutura",solidos:[bx(C,hp*.4,hp*.8,C/2,-V/2,H-hp*.8),bx(C,hp*.4,hp*.8,C/2,V/2,H-hp*.8)]});return {pecas,dados:{V,H,C,n}}}
function tubovia(p){const C=num(p.comprimento,24000),W=num(p.largura,4000),nv=Math.round(num(p.niveis,2)),h1=num(p.altura_primeiro_nivel,4500),tubos=(p.tubos||[200,150,100,80]).map(x=>num(x,100));const pecas=portico({vao:W,altura:h1+(nv-1)*1500,comprimento:C,n_porticos:C/6000+1,perfil_altura:300}).pecas;
  for(let k=0;k<nv;k++)pecas.push({id:`nivel${k+1}`,nome:`Travessas nível ${k+1}`,disciplina:"estrutura",solidos:Array.from({length:Math.round(C/6000)+1},(_,i)=>bx(200,W,200,i*6000,0,h1+k*1500-200))});
  let y=-W/2+300;tubos.forEach((dn,i)=>{const k=i%nv;pecas.push({id:`tubo${i+1}`,nome:`Tubo DN${dn}`,disciplina:"tubulacao",solidos:[tbX(dn*1.08,dn,C,0,y,h1+k*1500+dn*.54)]});y+=Math.max(dn*1.08+200,300);if(y>W/2-200)y=-W/2+300});return {pecas,dados:{C,W,niveis:nv}}}
function ventilador(p,sup){const d=num(p.d_rotor,900),kw=num(p.potencia_kw,Math.round(Math.pow(d/600,3)*15));const M=motorEletrico({potencia_kw:kw},sup),Dv=d*1.5,Hs=Math.max(Dv*.6,M.H+60);
  const pecas=[{id:"voluta",nome:`Voluta Ø${Math.round(Dv)}`,disciplina:"processo",opacidade:.5,solidos:[cxS(Dv,d*.5,0,0,Hs),cxS(d*.8,d*.4,-d*.4,0,Hs),{forma:"caixa",w:d*.5,p:Dv*.45,h:Dv*.75,pos:[d*.25,Dv*.28,Hs]}]},{id:"rotor",nome:`Rotor Ø${d}`,disciplina:"processo",solidos:[cxS(d,d*.3,d*.1,0,Hs)]}];
  const xm=d*.5+M.comprimento+400;M.pecas.forEach(pc=>{pc.id="vent_"+pc.id;pc.solidos.forEach(s=>s.G=matrizG([xm,0,Hs-M.H],0));pecas.push(pc)});return {pecas,dados:{d,kw}}}
const FAMILIAS={conjunto_rodas:conjuntoRodas,motor_eletrico:(p,s)=>{const m=motorEletrico(p,s);return {pecas:m.pecas,dados:{carcaca:m.H,eixo:m.D}}},bomba_centrifuga:bombaCentrifuga,redutor,ponte_rolante:pontoRolante,mancal:mancalSNL,tanque,painel,transportador_correia:transportador,estrutura_portico:portico,tubovia,ventilador_centrifugo:ventilador};

/* matriz de posição de um equipamento: translação e giro em torno de z (graus) */
function matrizG(pos=[0,0,0],rotz=0){const a=(rotz||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),[x,y,z]=pos.map(v=>+v||0);return [c,s,0,0,-s,c,0,0,0,0,1,0,x,y,z,1]}
function mult16(A,B){const o=new Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)o[j*4+i]+=A[k*4+i]*B[j*4+k];return o}
/* expande equipamentos (família + parâmetros) em peças do modelo 3D */
function expandirEquipamentos(M){const resumo=[];const pecas=[...(M.pecas||[])];
  for(const [n,e] of (M.equipamentos||[]).entries()){const f=FAMILIAS[e.familia];if(!f){resumo.push({id:e.id,erro:`família desconhecida: ${e.familia}`});continue}
    const sup=[],r=f(e.parametros||{},sup),G=matrizG(e.pos,e.rot_z),pre=(e.id||e.familia+(n+1))+"_";
    for(const pc of r.pecas){const c=JSON.parse(JSON.stringify(pc));c.id=pre+c.id;c.nome=(e.nome?e.nome+" · ":"")+c.nome;c.origem=e.origem||(sup.length?"estimado":"desenho");c.equipamento=e.id||e.familia;
      for(const s of [...c.solidos,...(c.vazios||[])])s.G=s.G?mult16(G,s.G):G;pecas.push(c)}
    resumo.push({id:e.id||e.familia,familia:e.familia,dados:r.dados,suposicoes:sup})}
  return {pecas,resumo}}
