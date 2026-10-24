[README.md](https://github.com/user-attachments/files/33895774/README.md)
# Prognos · Black and White

Copiloto de manutenção e operação industrial. Uma tela de chat: você conversa, anexa arquivos, e a IA aciona as ferramentas quando precisa. As ferramentas são:

- base da planta e histórico de cada equipamento;
- previsão de falha (Weibull bayesiano com Monte Carlo);
- enxame de especialistas;
- alarmes (ISA-18.2) e malhas de controle;
- revisão de programas de CLP;
- engenharia reversa de peça em 2D e 3D;
- retorno de campo, que é como o sistema aprende.

## Estrutura
- `index.html`, `app.js`, `lib.js`: o app (estático, roda no GitHub Pages).
- `ingest/`: programa que lê o HD e alimenta a base da planta (roda no seu PC).
- `supabase/`: esquema do banco e função `ia` (já implantados no projeto Prognos do Supabase).

## Colocar no ar (uma vez)
1. **Chave da IA.** Crie uma chave em https://console.anthropic.com e defina um limite de gasto mensal lá. Depois cadastre a chave no Supabase: projeto **Prognos** → Edge Functions → Secrets → nome `ANTHROPIC_API_KEY`.
2. **GitHub Pages.** Crie o repositório público `prognos` e envie `index.html`, `app.js`, `lib.js` e `README.md`. Depois ative em Settings → Pages → *Deploy from a branch* → `main` / `(root)`. O endereço fica `https://golliasblack.github.io/prognos/`.
3. **Login.** No Supabase, vá em Authentication → URL Configuration e defina o *Site URL* com o endereço do passo 2.
4. **Primeiro acesso.** Abra o app, escolha *Criar conta* com o e-mail autorizado e confirme pelo link que chega no e-mail.
   - Para autorizar outras pessoas: `insert into membros(email) values ('pessoa@exemplo.com');`

## Alimentar a base da planta
Copie a pasta `ingest` para o PC e dê dois cliques em `iniciar.bat`. As opções são:
1. **Inventário:** conta tipos e tamanhos e não envia nada.
2. **Indexar:** extrai o texto de PDF, Word, Excel, PowerPoint, e-mails, `.doc`/`.ppt` antigos, ZIP e textos de CLP. Desenhos, fotos e vídeos entram pelo nome e pelo número do desenho. Exportações de notas e ordens do SAP viram eventos automaticamente. Esta opção não tem custo de IA.
3. **Indexar com IA:** além do passo 2, a IA extrai eventos de relatórios e históricos em texto livre, respeitando o teto de gasto que você definir.

O programa lembra o que já leu. Pode ser interrompido e retomado. Os arquivos originais não saem do seu PC: só o texto extraído vai para a base.

## Limites do plano gratuito do Supabase
- **Banco de 500 MB.** Se o texto indexado passar disso, migre para o plano Pro.
- **Pausa por inatividade.** O projeto pausa após 7 dias sem uso. Para reativar: Supabase → projeto → Restore.
