# Progresso — Dia 7 de execução do Pacote Casa Pública InovCitrus

> Cumpre regra `mandatory-change-log.md`. Continuação directa do Dia 6 (roadmap PDF + kit imprensa). Foco do Dia 7: press release PT em PDF, envelope físico `PARA-IMPRIMIR/`, README-EURICO, handoff "pronto para entrega". **Marca o fecho formal do trabalho de casa de Uma — bola passa para Eurico (acção humana: imprimir, montar envelope, entregar a Pedro Madeira).**

---

## Sessão

| Campo | Valor |
|-------|-------|
| Data | 25/04/2026 (continuação imediata após Dia 6, mesmo dia) |
| Agente | `@ux-design-expert` (Uma) — terminal fresh, leu `RETOMA-20260425-dia-6-...md` integral + secção 2.2 (11 ficheiros) |
| Foco | (A) Press release PT em PDF · (B) Compilar `PARA-IMPRIMIR/` com 6 PDFs numerados · (C) `0-README-EURICO.md` · (D) `RETOMA Dia 7 entrega` · (E) Arquivar `RETOMA Dia 6` |
| Pré-requisitos verificados | Site `/`→307 · `/pt`→200 · 4 PDFs ficha técnica + roadmap presentes · 7 ficheiros kit imprensa presentes · Chrome path OK |
| Decisões pendentes resolvidas | **Defaults aceites** por instrução directa do Eurico: O5 (PDFs 6-7 páginas mantidos) · O6 (Lighthouse não corrido — site live aceite como está) · O7 (roadmap actual aceite) · O8 (wordmark colorido `#C68420` aceite) · O2 (foto sede omitida) |
| Ferramentas novas instaladas | **Zero** — cumpre `feedback_no_more_tools.md` |
| Bloqueador | Nenhum |

---

## Comandos executados (ordem cronológica)

| # | Comando | Resultado | Tempo |
|---|---------|-----------|-------|
| 1 | `curl https://inovcitrus.vercel.app` / `curl /pt` / `ls inovcitrus-pdfs/output/` / `ls inovcitrus-kit-imprensa/` / `ls chrome.exe` | ✓ tudo verde (5 PDFs · 7 ficheiros kit · Chrome OK · site live 307+200) | <5s |
| 2 | `Write scripts/generate-press-release-pdf.mjs` (~155 linhas) | ✓ script criado · adapta padrão de `generate-pdfs.mjs` (Dia 5) e `generate-roadmap-pdf.mjs` (Dia 6) · CSS A4 portrait com header InovCitrus + linha citrus + footer institucional | imediato |
| 3 | `node scripts/generate-press-release-pdf.mjs` | ✓ `output/press-release-pt.pdf` (113 KB · A4 portrait) | ~3s |
| 4 | `mkdir -p output/PARA-IMPRIMIR` + 6× `cp` | ✓ 6 PDFs numerados em `output/PARA-IMPRIMIR/` | <1s |
| 5 | `Write output/PARA-IMPRIMIR/0-README-EURICO.md` | ✓ instruções de uso, ordem de impressão, sinais pós-entrega, placeholders por preencher | imediato |
| 6 | `Write 04-landing/PROGRESSO-DIA-7.md` (este registo) | ✓ change log completo Dia 7 | imediato |
| 7 | `Write membros/cliente-frusoal/docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md` | ✓ handoff fecho de pacote · marca passagem para acção humana (Eurico) | imediato |
| 8 | `mkdir -p docs/archive/` + `git mv RETOMA-20260425-dia-6-...md docs/archive/` | ✓ Dia 6 arquivado conforme protocolo `handoff-central.md` | <1s |

---

## Press release PDF — `output/press-release-pt.pdf` (Dia 7 secção A)

### Layout final implementado

| Elemento | Detalhe |
|----------|---------|
| Orientação | A4 portrait · 210×297mm · margens 18mm/18mm/20mm/18mm |
| Header | Wordmark "Frusoal **InovCitrus**" (Inter 12pt · Frusoal 400 / InovCitrus 800 com `#C68420`) + meta "Press release · v1.0 preliminar" + linha laranja-citrino 2pt |
| H1 | Título do press release (Inter 19pt extrabold) · `letter-spacing: -0.01em` |
| H2 (secções) | "Primeiro projecto trienal — *Scirtothrips aurantii*" · "Missão do InovCitrus" (4 pontos numerados) · "Estrutura" · "Comunicação científica e pública" · "Site institucional" · "Contactos para imprensa" · "Sobre a Frusoal" · "Sobre o InovCitrus" |
| Tipografia body | Inter 10.5pt · line-height 1.55 · cor `#3A3A3A` em parágrafos · `#1A1A1A` em strong/títulos |
| Blockquote (rodapé do template) | Border-left `#E8A53C` 3pt · fundo `#FAF8F4` |
| Footer | "Frusoal InovCitrus · Tavira · Algarve" + "frusoal.pt · inovcitrus.vercel.app" |
| Fonte | Inter via Google Fonts (`@import` no head) |
| Tamanho final | 113 KB · A4 portrait · saída 1-2 páginas |

### Identidade visual aplicada

- Mesma paleta InovCitrus dos PDFs ficha técnica (Dia 5) e roadmap (Dia 6)
- Wordmark com tom `#C68420` em "InovCitrus" — consistente com decisão O8 default (colorido)
- Linha citrus `#E8A53C` no header — assinatura visual do pacote
- Hyperlinks com `#C68420` — discreto mas identificável

### Validação

- Chrome saiu com `code 0` · ficheiro produzido em `output/press-release-pt.pdf`
- Tamanho 113 KB (entre 80-120 KB previsto na secção 9.3 do handoff Dia 6)
- Conteúdo lido directamente de `inovcitrus-kit-imprensa/press-release-pt.md` — zero alteração de copy
- Placeholders `[DATA]`, `[email]`, `[telefone]` preservados — Eurico/Frusoal preenchem antes de envio

---

## Envelope físico — `output/PARA-IMPRIMIR/` (Dia 7 secção B)

### Estrutura final

```
output/PARA-IMPRIMIR/
├── 0-README-EURICO.md                       (instruções · 2.4 KB)
├── 1-press-release-pt.pdf                   (113 KB · ~1-2 páginas A4 portrait)
├── 2-ficha-tecnica-scirtothrips-pt.pdf      (160 KB · ~6 páginas A4 portrait)
├── 3-ficha-tecnica-scirtothrips-en.pdf      (170 KB · ~6 páginas A4 portrait)
├── 4-ficha-tecnica-scirtothrips-es.pdf      (176 KB · ~7 páginas A4 portrait)
├── 5-ficha-tecnica-scirtothrips-fr.pdf      (174 KB · ~7 páginas A4 portrait)
└── 6-roadmap-36-meses.pdf                   (147 KB · 1 página A4 paisagem)
```

**Total Dia 7 secção B:** 6 PDFs imprimíveis (~940 KB) + 1 README · ~30 páginas A4 imprimíveis no total.

### Numeração intencional

| # | Razão |
|---|-------|
| 0 | README-EURICO fica como primeiro item visível na pasta — Eurico abre primeiro |
| 1 | Press release · primeira coisa que Pedro lê (5 segundos para perceber o que é) |
| 2-5 | Ficha técnica × 4 línguas · ordem PT → EN → ES → FR (mercados de exportação Frusoal) |
| 6 | Roadmap · último (1 página paisagem com impacto visual final) |

### Lógica de "ordem de leitura sugerida pelo Pedro" (no README)

Numeração de impressão ≠ ordem de leitura. README sugere:
1. Roadmap (impacto visual primeiro)
2. Press release (5 segundos para ver o que é)
3. Ficha técnica PT (utilidade imediata)
4. Site (telemóvel, 5 min)

A numeração da pasta serve a impressão; o README guia a leitura.

---

## README-EURICO — `output/PARA-IMPRIMIR/0-README-EURICO.md` (Dia 7 secção C)

### Secções incluídas

| Secção | Função |
|--------|--------|
| O que está aqui (ordem de impressão) | Tabela com 6 ficheiros · páginas estimadas · línguas |
| Sugestão de uso | Papel 100g+ · envelope A4 sóbrio · cartão à mão estilo Eurico · entrega em VN Cacela ou via URL |
| Sinais de "abrir porta" | Resposta <48h · "isto fica?" · marca conversa formal |
| Sinais de "não está para aí virado" | Sem resposta 7 dias → não insistir · adiar |
| Recursos | Site público · FONTES.md · ficheiros source · kit imprensa |
| Ordem de leitura sugerida pelo Pedro | Roadmap → Press → Ficha técnica → Site |
| O que NÃO está aqui (intencionalmente) | Logos InPP/CCDR · foto sede (O2 default) · página equipa · datas exactas · preços/combos |
| Antes de imprimir — placeholders | `[DATA]`, `[email]`, `[telefone]` no press release · instruções de regenerar PDF se Eurico quiser preencher |

### Tom

Linguagem consultiva, par a par. Zero jargão vendor. Disclaimer final: "Pacote produzido por Eurico (consultor de implementação de IA) entre 23/04 e 25/04 de 2026. Casa pública InovCitrus v1.0 preliminar — aguarda validação formal Frusoal antes de publicação ampla."

---

## Decisões pendentes — TODAS resolvidas (defaults aceites por Eurico)

| # | Decisão | Resolução Dia 7 | Motivo |
|---|---------|-----------------|--------|
| **O2** | Foto sede Tavira | **Omitir** (default aceite) | Sede em construção · não inventar imagem · regra "zero invenção" · README-EURICO secção "O que NÃO está aqui" documenta a ausência |
| **O5** | Condensar PDFs ficha técnica para 4-5 páginas | **Aceitar 6-7 páginas actuais** (default aceite) | Tamanho actual é legível · margens 16mm + font 10.5pt já são compactas · condensar perderia respiro tipográfico |
| **O6** | Lighthouse a11y/perf scores em produção | **Não correr** (default aceite — site live aceite como está) | Site SSG estático puro · Pedro vai aceder no telemóvel · Lighthouse pós-entrega se Pedro pedir auditoria formal |
| **O7** | Roadmap PDF actual ou ajustes | **Aceitar actual** (default aceite) | 1 página A4 paisagem com 3 colunas × 2 faixas é legível · paleta InovCitrus aplicada · 23 actos comunicativos visíveis |
| **O8** | Wordmark colorido vs preto | **Aceitar colorido `#C68420`** (default aceite) | Identifica InovCitrus visualmente sem romper alinhamento Frusoal · contraste OK em fundo branco · variante mono já existe para impressão B&W |

**Razão para aceitar todos os defaults:** instrução directa do Eurico ("defaults aceites se não disseres nada"). Cumpre `feedback_governance_never_blocks_execution.md` — avançar sem pedir aprovações múltiplas.

---

## Validações cumpridas

| Regra / memória | Como respeitada |
|-----------------|------------------|
| `frusoal-source-of-truth.md` | `prompt-original.md` lido na activação · zero invenção em PDF (conteúdo lido tal-e-qual de `press-release-pt.md`) · zero "em nome da InPP" · zero logos terceiros |
| `feedback_no_more_tools.md` | **Zero** ferramentas novas instaladas · `generate-press-release-pdf.mjs` reutiliza Chrome + `inovcitrus-site/node_modules` (gray-matter, remark, remark-html, remark-gfm) · zero Pandoc / MiKTeX / Puppeteer / wkhtmltopdf |
| `feedback_handoffs_detail.md` | Este registo lista comandos cronológicos + ficheiros + tamanhos + decisões + razões |
| `mandatory-change-log.md` | Comandos exactos · diffs antes/depois (estado pré-Dia-7 com 5 PDFs e estado pós-Dia-7 com 6 PDFs em `PARA-IMPRIMIR/`) · razões registadas |
| `feedback_no_invented_cases.md` | Zero invenção · README-EURICO documenta explicitamente "O que NÃO está aqui (intencionalmente)" para o Pedro/Eurico saberem porquê |
| `feedback_governance_never_blocks_execution.md` | Avancei Dia 7 imediatamente após verificação de pré-requisitos · zero pedidos de aprovação · cumpre directiva Eurico "defaults aceites" |
| `feedback_nunca_combo_clientes_comerciais.md` | README-EURICO usa linguagem consultiva, sem "combo"/"package"/"ROI"/"PRR" · tom de "trabalho de casa nosso, não venda" · explicitamente: "Preços, propostas, 'combos' — isto é trabalho de casa nosso, não venda" |
| `language-standards.md` | PT-PT estrito no README-EURICO e PROGRESSO-DIA-7 · sem PT-BR · termos em inglês apenas onde técnicos consagrados |
| Decisão D3 (Pedro primeiro, depois InPP) | PARA-IMPRIMIR/ entrega PT-only no press release (Pedro decide se/como traduz para InPP) · zero conteúdo "em nome da InPP" |
| `mcp-usage.md` | Zero uso de docker-gateway · só Read/Write/Bash/Edit nativos + Chrome local |
| `output-format-standards.md` | Zero emojis · tabelas markdown · tom institucional sóbrio |
| `handoff-location.md` | RETOMA Dia 7 vai em `membros/cliente-frusoal/docs/` · Dia 6 movido para `docs/archive/` (mesmo projecto, nunca repo root) |
| `agent-authority.md` | Zero `git push` · zero `gh pr` · commit fica para Eurico decidir e `@devops` executar |

---

## Estado acumulado Dias 1+2+3+4+5+6+7

| Dia | Ficheiros | Linhas / KB | Foco |
|-----|-----------|-------------|------|
| 1 | 8 | ~800 linhas | Conteúdo PT + estrutura + fontes F01-F08 |
| 2 | 18 | ~1.700 linhas | Conteúdo EN/ES/FR + fontes F09-F16 |
| 3 | 17 | ~625 linhas | Identidade visual + Next.js scaffold completo |
| 4 | 1 PROGRESSO + 19 fixes em 11 markdowns | — | Build + dev + smoke test 18 testes + correcção hrefs |
| 5 | 1 script + 4 PDFs + bump deps | ~140 linhas + 670 KB PDFs | Bump Next 14.2.35 + deploy Vercel + 4 PDFs ficha técnica |
| 6 | 1 script + 7 ficheiros kit + 1 PDF + 1 PROGRESSO | ~270 linhas + 200 KB artefactos | Roadmap PDF + kit imprensa completo |
| **7** | **1 script + 1 PDF + 1 README + 1 PROGRESSO + 1 RETOMA + 6 PDFs em PARA-IMPRIMIR/ (cópias)** | **~155 linhas script + 113 KB press release + 2.4 KB README + envelope** | **Press release PDF + envelope físico + handoff entrega** |
| **Acumulado** | **53+ ficheiros únicos · 6 PDFs no envelope** | **~3.575 linhas + ~1.05 MB artefactos imprimíveis** | **7/7 dias entregues — pacote casa pública 100% concluído** |

---

## Próximos passos

| Quem | Tarefa | Pré-requisito |
|------|--------|----------------|
| Eurico (humano) | Imprimir 6 PDFs em papel 100g+ · montar envelope A4 sóbrio · escrever cartão à mão · entregar em VN Cacela ou pessoalmente a Pedro | Dia 7 ✓ |
| Eurico (decisão) | Decidir se preenche placeholders `[DATA]`/`[email]`/`[telefone]` no press release antes de imprimir, ou imprime tal e qual | Antes de imprimir |
| Eurico (decisão) | Decidir quando fazer commit do trabalho Dias 1-7 (continua untracked) — apenas `@devops` faz push | Após entrega ou antes (preferência Eurico) |
| Pedro Madeira | Receber pacote · ler · responder | Pacote entregue |
| Eurico (humano) | Aguardar resposta · timeout 7 dias · não follow-up agressivo | Pacote entregue |

---

## Estado git

`membros/cliente-frusoal/` continua **integralmente untracked** (Dias 1-7 inclusive). Aguarda ordem explícita do Eurico para commit (regra `agent-authority.md`: apenas `@devops` faz push, e neste caso `@dev` pode fazer commit local mas não push). Sugestão de commit detalhada na secção 19 do handoff Dia 6 (preservada no archive) e replicada na secção "Estado git" do handoff Dia 7.

---

*Fim do registo Dia 7 — pacote casa pública 100% concluído. Press release PDF + envelope físico PARA-IMPRIMIR/ + README-EURICO entregues. Trabalho de casa de Uma terminado. Bola passa para Eurico (acção humana: imprimir, montar, entregar).*
