/* Prognos · Black and White — OPERAÇÃO ASSISTIDA
   O Prognos acompanha o trabalho ao vivo:
   - Câmera do celular: aponte para um painel elétrico, um mancal, uma estrutura ou uma IHM. Ele identifica componentes e tags,
     busca os desenhos e manuais na base da planta e conduz o diagnóstico passo a passo, com segurança primeiro.
   - Tela do computador: enquanto você programa uma lógica (TIA Portal, Studio 5000, CODESYS) ou monta uma IHM (InTouch, WinCC,
     FactoryTalk, Ignition), ele olha a tela e dá suporte.
   - Voz: fale com as mãos ocupadas; a resposta pode ser lida em voz alta.
   As imagens só são enviadas quando você pede ("Analisar") ou, no modo automático, quando a cena muda. */
const ASSIST={ativo:false,fonte:null,stream:null,auto:false,voz:false,timer:null,ultimo:null,rec:null,ouvindo:false,lanterna:false,
  prompt(){if(!this.ativo)return "";return `\n\nOPERAÇÃO ASSISTIDA ATIVA (${this.fonte==="tela"?"tela do computador do usuário":"câmera ao vivo do celular, em campo"}). As imagens que chegam são quadros ao vivo.
- Respostas curtas e práticas, em passos numerados, uma ação por vez. O usuário está com as mãos ocupadas.
- Segurança primeiro: em painel elétrico, lembre bloqueio e etiquetagem (LOTO), NR-10, EPI e teste de ausência de tensão antes de tocar; em máquina, NR-12 e energia zero; em altura, NR-35. Se houver risco iminente na imagem, diga isso antes de tudo.
- Identifique o que aparece: componentes (disjuntores, contatores, relés, bornes, inversores, CLP e cartões, sensores, mancais, acoplamentos, soldas, estruturas), tags, placas de identificação, LEDs e códigos de alarme. Leia os textos visíveis.
- Assim que reconhecer um tag, painel, equipamento ou código, use buscar_base para achar o desenho elétrico, o diagrama, o manual ou o histórico e diga qual folha e qual borne ou componente conferir. Use historico_equipamento quando reconhecer o equipamento.
- Na tela do computador: revise a lógica ou a IHM que está sendo feita, aponte erros, riscos e boas práticas (ISA-101 para IHM, ISA-18.2 para alarmes), e sugira o código ou a configuração exata para aquele software.
- Em atualização automática sem nada novo ou relevante, responda só "Sem alterações." Não repita orientações já dadas.`},
  $:id=>document.getElementById(id)};

function assistUI(){if(ASSIST.$("assistPanel"))return;const box=ASSIST.$("box");const el=document.createElement("div");el.id="assistPanel";el.className="assist";el.hidden=true;
  el.innerHTML=`<div class="asv"><video id="asVideo" playsinline muted></video><div class="astag" id="asTag">Operação assistida</div></div>
  <div class="asctl">
    <button class="btn" data-a="camera">Câmera</button><button class="btn" data-a="tela">Tela do PC</button>
    <button class="btn fill" data-a="analisar">Analisar agora</button>
    <button class="btn" data-a="falar" title="Fale e o Prognos responde olhando a imagem">Falar</button>
    <label class="kb"><input type="checkbox" data-a="auto"> automático</label><label class="kb"><input type="checkbox" data-a="voz"> ler respostas</label>
    <button class="btn" data-a="lanterna" hidden>Lanterna</button><button class="btn" data-a="sair">Encerrar</button>
  </div>`;
  box.parentElement.insertBefore(el,box);
  el.addEventListener("click",e=>{const b=e.target.closest("button[data-a]");if(!b)return;const a=b.dataset.a;
    if(a==="camera")assistIniciar("camera");else if(a==="tela")assistIniciar("tela");else if(a==="analisar")assistEnviar();else if(a==="falar")assistOuvir();else if(a==="lanterna")assistLanterna();else if(a==="sair")assistParar()});
  el.addEventListener("change",e=>{const a=e.target.dataset.a;if(a==="auto"){ASSIST.auto=e.target.checked;assistAuto()}if(a==="voz"){ASSIST.voz=e.target.checked;if(!ASSIST.voz)speechSynthesis?.cancel()}});
  if(!navigator.mediaDevices?.getDisplayMedia||/Android|iPhone|iPad/i.test(navigator.userAgent))el.querySelector('[data-a="tela"]').hidden=true;
  if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window))el.querySelector('[data-a="falar"]').hidden=true}

async function assistIniciar(fonte){assistUI();const p=ASSIST.$("assistPanel");p.hidden=false;ASSIST.ativo=true;
  if(ASSIST.stream){ASSIST.stream.getTracks().forEach(t=>t.stop());ASSIST.stream=null}
  try{ASSIST.stream=fonte==="tela"?await navigator.mediaDevices.getDisplayMedia({video:{frameRate:5},audio:false})
      :await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}},audio:false});
    ASSIST.fonte=fonte;const v=ASSIST.$("asVideo");v.srcObject=ASSIST.stream;await v.play().catch(()=>{});
    ASSIST.stream.getVideoTracks()[0].onended=()=>{if(ASSIST.fonte===fonte)assistParar()};
    const cap=ASSIST.stream.getVideoTracks()[0].getCapabilities?.()||{};p.querySelector('[data-a="lanterna"]').hidden=!cap.torch;
    ASSIST.$("asTag").textContent=fonte==="tela"?"Vendo a sua tela":"Câmera ao vivo";
    if(!$("inp").value)$("inp").placeholder=fonte==="tela"?"O que você está fazendo? Ex.: revisa a lógica desta rede, confere esta tela da IHM":"O que está acontecendo? Ex.: motor desarmou, ruído no mancal, painel com LED vermelho"}
  catch(e){ASSIST.$("asTag").textContent=e.name==="NotAllowedError"?"Permissão negada para "+(fonte==="tela"?"a tela":"a câmera"):"Não consegui abrir: "+(e.message||e)}}
function assistParar(){ASSIST.ativo=false;ASSIST.auto=false;clearInterval(ASSIST.timer);ASSIST.stream?.getTracks().forEach(t=>t.stop());ASSIST.stream=null;ASSIST.rec?.stop();speechSynthesis?.cancel();
  const p=ASSIST.$("assistPanel");if(p){p.hidden=true;p.querySelector('[data-a="auto"]').checked=false}$("inp").placeholder="Pergunte sobre um equipamento, conte o que aconteceu ou anexe arquivos…"}
function assistQuadro(max=1600){const v=ASSIST.$("asVideo");if(!v?.videoWidth)return null;const k=Math.min(1,max/Math.max(v.videoWidth,v.videoHeight)),c=document.createElement("canvas");c.width=Math.round(v.videoWidth*k);c.height=Math.round(v.videoHeight*k);c.getContext("2d").drawImage(v,0,0,c.width,c.height);return c}
function assistAssinatura(){const v=ASSIST.$("asVideo");if(!v?.videoWidth)return null;const c=document.createElement("canvas");c.width=32;c.height=18;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(v,0,0,32,18);const d=g.getImageData(0,0,32,18).data,o=[];for(let i=0;i<d.length;i+=4)o.push((d[i]+d[i+1]+d[i+2])/3);return o}
const assistDif=(a,b)=>{if(!a||!b)return 255;let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-b[i]);return s/a.length};
async function assistEnviar(texto,auto){if(busy)return;const c=assistQuadro();if(!c){ASSIST.$("asTag").textContent="Sem imagem ainda: abra a câmera ou a tela";return}
  ASSIST.ultimo=assistAssinatura();const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",.85));
  const f=new File([blob],`${ASSIST.fonte==="tela"?"tela":"camera"}-${new Date().toLocaleTimeString("pt-BR").replace(/:/g,"")}.jpg`,{type:"image/jpeg"});
  pending.push(await readAttachment(f));renderAtt();
  if(texto!=null)$("inp").value=texto;else if(!$("inp").value.trim())$("inp").value=auto?"(atualização automática da imagem)":ASSIST.fonte==="tela"?"Olhe a minha tela e me ajude.":"Olhe a imagem e me ajude no diagnóstico.";
  await send()}
function assistAuto(){clearInterval(ASSIST.timer);if(!ASSIST.auto)return;ASSIST.ultimo=assistAssinatura();
  ASSIST.timer=setInterval(()=>{if(!ASSIST.ativo||busy||document.hidden)return;const a=assistAssinatura();if(assistDif(a,ASSIST.ultimo)>14)assistEnviar(null,true)},ASSIST.fonte==="tela"?20000:12000)}
function assistOuvir(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;const b=ASSIST.$("assistPanel").querySelector('[data-a="falar"]');
  if(ASSIST.ouvindo){ASSIST.rec?.stop();return}const r=new SR();r.lang="pt-BR";r.interimResults=true;r.continuous=false;ASSIST.rec=r;ASSIST.ouvindo=true;b.textContent="Ouvindo… toque para parar";b.classList.add("fill");speechSynthesis?.cancel();
  let final="";r.onresult=e=>{let t="";for(const x of e.results){if(x.isFinal)final+=x[0].transcript;else t+=x[0].transcript}$("inp").value=(final+t).trim()};
  r.onend=()=>{ASSIST.ouvindo=false;b.textContent="Falar";b.classList.remove("fill");if(final.trim())ASSIST.stream?assistEnviar(final.trim()):send()};r.onerror=()=>{};r.start()}
async function assistLanterna(){const t=ASSIST.stream?.getVideoTracks()[0];if(!t)return;ASSIST.lanterna=!ASSIST.lanterna;try{await t.applyConstraints({advanced:[{torch:ASSIST.lanterna}]})}catch(e){}}
/* lê em voz alta a resposta, sem a formatação */
function assistFalar(texto){if(!ASSIST.voz||!window.speechSynthesis||!texto||/^Sem altera/i.test(texto.trim()))return;speechSynthesis.cancel();
  const limpo=texto.replace(/```[\s\S]*?```/g," ").replace(/[*_#>`|]/g," ").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\s+/g," ").slice(0,1800);
  const u=new SpeechSynthesisUtterance(limpo);u.lang="pt-BR";u.rate=1.05;const v=speechSynthesis.getVoices().find(x=>/pt-BR/i.test(x.lang));if(v)u.voice=v;speechSynthesis.speak(u)}
/* em operação assistida, mantém só as imagens mais recentes no contexto da IA */
function assistPoda(api){if(!ASSIST.ativo)return;let vistas=0;for(let i=api.length-1;i>=0;i--){const m=api[i];if(m.role!=="user"||!Array.isArray(m.content))continue;
  if(m.content.some(b=>b.type==="image")){vistas++;if(vistas>2)m.content=m.content.map(b=>b.type==="image"?{type:"text",text:"[imagem anterior da operação assistida removida para economizar contexto]"}:b)}}}
document.addEventListener("DOMContentLoaded",assistUI);if(document.readyState!=="loading")assistUI();
