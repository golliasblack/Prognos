<div align="center">

# PROGNOS

**Copiloto de manutenção e operação industrial**

*Black and White · Technology Ahead of Time*

</div>

---

Prognos prevê quando um componente vai falhar e explica por quê. Funciona em uma única tela de chat: o mantenedor conversa, anexa fotos e documentos, e a IA aciona sozinha as ferramentas de engenharia de que precisa.

O sistema foi feito para o chão de fábrica, onde o histórico está espalhado e incompleto: ordens e notas do SAP, relatórios de turno, laudos preditivos, planilhas, PDFs, desenhos e mensagens. Ele serve para qualquer componente, de qualquer fabricante e de qualquer setor: siderurgia, papel e celulose, petróleo, mineração e alimentos.

## O que ele faz

| | |
|---|---|
| **Previsão de falha** | Weibull bayesiano com Monte Carlo. Usa falhas e suspensões do histórico, a idade efetiva pela condição observada e fatores de ambiente (carga, temperatura). Entrega P10, P50 e P90 da data provável de falha. |
| **Base da planta** | Lê o arquivo técnico (PDF, Word, Excel, PowerPoint, e-mails, exportações SAP, textos de CLP) e monta o histórico de cada equipamento. Os arquivos originais não saem do computador; só o texto extraído vai para a base. |
| **Enxame de especialistas** | Vários agentes analisam o mesmo caso: mecânica, elétrica, lubrificação, processo e confiabilidade. O Prognos consolida as visões em um diagnóstico e um plano de ação. |
| **Alarmes e malhas** | Racionalização de alarmes conforme ISA-18.2 e diagnóstico de malhas de controle. |
| **Revisão de CLP** | Leitura e análise de programas de CLP para achar falhas de lógica e riscos. |
| **Engenharia reversa** | Da foto ou do croqui da peça para um desenho 2D e 3D editável, com cotas e tolerâncias. |
| **Biblioteca técnica** | Busca livros e artigos de acesso aberto e explica o conteúdo de forma didática: conceito, funcionamento, fórmula, exemplo numérico e aplicação na planta, sempre com a fonte. |
| **Aprendizado com o campo** | Quando a falha real for diferente da prevista, o retorno do mantenedor corrige o modelo daquele componente. |

## Como funciona uma análise

```
conversa + fotos + documentos
        │
        ▼
  histórico da planta ──► modelo de vida (Weibull bayesiano)
        │                         │
        ▼                         ▼
  enxame de especialistas ──► diagnóstico, data provável e plano
        │
        ▼
  retorno de campo ──► o modelo aprende
```

## Princípios

- **Mínimo atrito.** Uma tela, sem formulários. O mantenedor fala como fala no turno.
- **Transparência.** Toda previsão mostra a faixa de incerteza, os dados que usou e as fontes.
- **Dados da planta sob controle.** Acesso só para membros autorizados, com regras de segurança no banco. As chaves de IA ficam no servidor, nunca no navegador.
- **Sempre disponível.** Vários provedores de IA em fila: se um esgota a cota, o próximo assume automaticamente.
- **Conhecimento legal.** A biblioteca usa só fontes de acesso aberto e domínio público:
  - artigos: OpenAlex, SciELO, arXiv e DOAJ;
  - livros: Open Library, Internet Archive e Projeto Gutenberg;
  - enciclopédia: Wikipédia.

## Tecnologia

App web estático (HTML e JavaScript), banco PostgreSQL com busca em texto completo e funções de servidor no Supabase, e um leitor de arquivos em Python que roda no PC do usuário.

## Licença

Distribuído sob a licença GPL-3.0 (veja `LICENSE`).

---

<div align="center">
<sub>Prognos é um produto Black and White · Technology Ahead of Time</sub>
</div>
