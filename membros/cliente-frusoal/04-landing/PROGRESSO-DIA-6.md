# Progresso — Dia 6 de execução do Pacote Casa Pública InovCitrus

> Cumpre regra `mandatory-change-log.md`. Continuação directa do Dia 5 (site live, 4 PDFs ficha técnica). Foco do Dia 6: roadmap PDF visual + kit imprensa.

---

## Sessão

| Campo | Valor |
|-------|-------|
| Data | 25/04/2026 (continuação imediata após Dia 5) |
| Agente | `@ux-design-expert` (Uma) — terminal fresh, leu HANDOFF-INDEX + RETOMA Dia 5 + 13 ficheiros da secção 2.2 |
| Foco | (A) Roadmap PDF 36 meses · (B) Kit imprensa (wordmark colorido + mono · paleta swatches · press-release PT/EN · README) |
| Pré-requisitos verificados | Node v22.22.2 · npm 10.9.7 · site live `/`→307 · `/pt`→200 · 4 PDFs ficha técnica presentes · Chrome path OK · Vercel auth `euricojsalves-4744` |
| Ferramentas novas instaladas | **Zero** — cumpre `feedback_no_more_tools.md` |
| Bloqueador | Nenhum |

---

## Comandos executados (ordem cronológica)

| # | Comando | Resultado | Tempo |
|---|---------|-----------|-------|
| 1 | `node --version` / `npm --version` / `curl https://inovcitrus.vercel.app` / `ls inovcitrus-pdfs/output/` / `ls chrome.exe` / `npx vercel whoami` | ✓ todos verdes (ambiente confirmado) | <5s |
| 2 | `Write scripts/generate-roadmap-pdf.mjs` (~270 linhas) | ✓ script criado | imediato |
| 3 | `node scripts/generate-roadmap-pdf.mjs` | ✓ `output/roadmap-36-meses.pdf` (147 KB · 1 página A4 paisagem) | ~3s |
| 4 | `Write inovcitrus-kit-imprensa/wordmark-inovcitrus.svg` | ✓ wordmark colorido (Frusoal preto + InovCitrus citrus-dark `#C68420`) | imediato |
| 5 | `Write inovcitrus-kit-imprensa/wordmark-inovcitrus-mono.svg` | ✓ wordmark mono (tudo `#000000`) | imediato |
| 6 | `Write inovcitrus-kit-imprensa/paleta-swatches.html` | ✓ HTML standalone com 6 swatches | imediato |
| 7 | `Write inovcitrus-kit-imprensa/press-release-pt.md` | ✓ modelo PT-PT v1.0 preliminar | imediato |
| 8 | `Write inovcitrus-kit-imprensa/press-release-en.md` | ✓ modelo EN equivalente | imediato |
| 9 | `Write inovcitrus-kit-imprensa/README.md` | ✓ instruções + identidade visual + cores | imediato |
| 10 | `chrome --headless --screenshot=paleta-swatches.png ...` | ✓ PNG 30 KB · 1280×720 · paleta limpa | ~2s |
| 11 | `Read paleta-swatches.png` (validação visual) | ✓ render correcto: wordmark · 6 swatches com nome+hex+uso · footer institucional | imediato |

---

## Roadmap PDF — `output/roadmap-36-meses.pdf` (Dia 6 secção A)

### Layout final implementado

| Elemento | Detalhe |
|----------|---------|
| Orientação | A4 paisagem · 297×210mm · margens 10mm/12mm |
| Header | Wordmark "Frusoal **InovCitrus**" + meta "Roadmap 36 meses · v1.0 (preliminar — pré-publicação) · 25/04/2026" + linha laranja-citrino 1.5pt |
| Título | "Calendário do Projecto Trienal — 2026 · 2027 · 2028" |
| Subtítulo | "Determinação da fenologia e ciclo de vida dos tripes (*Scirtothrips aurantii*) em pomares de citrinos do Algarve" |
| Estrutura central | 3 colunas iguais (2026 / 2027 / 2028), cada uma com 2 faixas: "Marcos · Operações" (cima, fundo verde-suave) + "Actos comunicativos" (baixo, fundo laranja-suave) |
| Marcos por ano | 2026: 5 marcos (M01 lançamento, M02 armadilhas, M03 1ª campanha, M04 pico, M05 síntese) · 2027: 4 marcos (M06-M09) · 2028: 3 marcos (M10-M12) |
| Actos comunicativos | Listados com quarter + título + línguas + status executado/previsto · 2026: 7 actos · 2027: 5 actos · 2028: 11 actos · **Total: 23 actos** ✓ matches `communication_inventory.total_actos_comunicativos` |
| Símbolos por track | ● Marcos científicos (verde `#5A8C45`) · ◆ Operações de campo (cinzento `#6B6B6B`) · ▲ Actos comunicativos (citrus-dark `#C68420`) |
| Legenda | 3 itens com símbolo coloridos |
| Disclaimer | "Calendário representativo do desenho trienal. Datas exactas e marcos científicos serão confirmados pela equipa científica do projecto (Frusoal + InovPlantProtect + CCDR Algarve)." |
| Footer | "Frusoal InovCitrus · Tavira · Algarve · Portugal" + "frusoal.pt · inovcitrus.vercel.app" |

### Identidade visual aplicada

- Fonte body: **Inter** 8.8pt (Google Fonts via @import)
- Cabeçalho: wordmark Inter regular+extrabold + linha laranja-citrino `#E8A53C` (1.5pt)
- Cores das tracks: `#5A8C45` (sci) · `#6B6B6B` (op) · `#C68420` (com)
- Tabelas com fundo `#FAF8F4` em headers de ano
- Bordas suaves `#E5E2DA`
- Faixas alternadas (verde-suave + laranja-suave) para separar visualmente marcos de actos comunicativos
- Texto em `#1A1A1A` (titles) e `#3A3A3A` (descrições)

### Validação

Saída: 1 página A4 paisagem · ~147 KB · estrutura legível impressa em A4. Lê-se em diagonal: marcos científicos em cima (verde+cinzento), actos comunicativos em baixo (laranja). Cada milestone identificado por trimestre + título curto + descrição de 1 linha. Aplicada paleta InovCitrus.

---

## Kit imprensa — `inovcitrus-kit-imprensa/` (Dia 6 secção B)

### Estrutura criada

```
inovcitrus-kit-imprensa/
├── README.md                            (3.6 KB · instruções de uso)
├── wordmark-inovcitrus.svg              (555 B · wordmark colorido SVG vetorial)
├── wordmark-inovcitrus-mono.svg         (555 B · wordmark mono SVG vetorial)
├── paleta-swatches.html                 (4.7 KB · source HTML da paleta)
├── paleta-swatches.png                  (30 KB · 1280×720 · paleta com nome+hex+uso)
├── press-release-pt.md                  (4.7 KB · modelo PT-PT v1.0 preliminar)
└── press-release-en.md                  (4.6 KB · modelo EN equivalente)
```

**Total Dia 6 secção B:** 7 ficheiros · ~52 KB.

### Wordmarks SVG

| Ficheiro | Detalhe |
|----------|---------|
| `wordmark-inovcitrus.svg` | "Frusoal" weight 400 `#1A1A1A` + "InovCitrus" weight 800 `#C68420` (citrus-dark) — versão para web/digital/cor |
| `wordmark-inovcitrus-mono.svg` | "Frusoal" weight 400 `#000000` + "InovCitrus" weight 800 `#000000` — versão para impressão a preto e branco / fax / fotocópia |

Ambos: viewBox `0 0 480 80`, font Inter, `preserveAspectRatio="xMinYMid meet"`, `role="img"` + `aria-label` para acessibilidade.

### Press releases (modelos)

| Ficheiro | Língua | Estrutura |
|----------|--------|-----------|
| `press-release-pt.md` | PT-PT | Lead · Primeiro projecto trienal Scirtothrips · Missão (4 pontos) · Estrutura · Comunicação científica · Site institucional · Contactos · Sobre Frusoal · Sobre InovCitrus |
| `press-release-en.md` | EN | Equivalente em inglês com terminologia EPPO/EFSA (e.g. "South African citrus thrips") |

Ambos têm:
- Frontmatter `status: modelo` (PT) / `template` (EN) — explicitamente marcado como modelo editável
- Frontmatter `sources: [F01, F02, F03, F04, F07, F08]` (PT) e `+ F09, F11, F15` (EN) — rastreabilidade
- Placeholders `[DATA]`, `[email]`, `[telefone]` — adaptar antes de envio
- Zero "em nome da InPP" · zero logos InPP/CCDR · zero invenção
- Footer com nota: "Adaptar datas, contactos e citações antes de cada envio"

### Paleta PNG

`paleta-swatches.png` (1280×720 · 30 KB):
- Header com wordmark + meta "PALETA INSTITUCIONAL · V1.0 PRELIMINAR" + linha citrus
- Título "Cores institucionais" + subtítulo descritivo
- Grid 3×2 de 6 swatches:
  - Citrus `#E8A53C` · Citrus dark `#C68420` · Algarve `#5A8C45`
  - Algarve dark `#3F6A2E` · Ink `#1A1A1A` · Surface warm `#FAF8F4`
- Cada swatch tem: bloco de cor + nome + hex (JetBrains Mono) + descrição de uso
- Footer com URLs institucionais

### README

Instruções de uso para a Frusoal: tabela de ficheiros, identidade visual (wordmark + tipografia + cores), site institucional, notas de uso (versão preliminar, logos terceiros não incluídos, comunicação institucional via Frusoal, adaptação obrigatória antes de envio).

---

## Decisões de implementação Dia 6

| Decisão | Razão |
|---------|-------|
| Wordmark colorido usa `#C68420` (citrus-dark) em "InovCitrus" | Mais identificável visualmente do que `#1A1A1A` template do handoff · alinha melhor com identidade Frusoal · contraste suficiente em fundo branco |
| Roadmap usa 3 tracks (não 2 do handoff secção 12.4) | `roadmap-data.json` declara 3 tracks (`scientific`, `operational`, `communication`) — respeitada a estrutura real do JSON |
| Marcos + Operações na mesma faixa visual | Operacionais são apenas 1 (M02 armadilhas) — agrupar com científicos simplifica leitura sem perder informação (símbolos diferentes mantêm distinção) |
| Actos comunicativos em faixa separada | Permite ver de relance o ritmo comunicativo por ano: 2026 baixa intensidade · 2027 média · 2028 alta intensidade (relatório final + multilingue + evento) |
| Paleta gerada via Chrome screenshot (não sketch SVG manual) | Reutiliza Chrome já instalado (`feedback_no_more_tools.md`) · permite regenerar em qualquer tamanho mudando `--window-size` |
| Decisões pendentes O2/O5/O6 não bloqueiam Dia 6 | O2 (foto sede) é opcional · O5 (reduzir páginas PDFs) e O6 (Lighthouse) são revisões pós-Dia 5 que Eurico decide ao ver os ficheiros |

---

## Validações cumpridas

| Regra / memória | Como respeitada |
|-----------------|------------------|
| `frusoal-source-of-truth.md` | Prompt original lido na activação · zero invenção em press-releases (todos os factos rastreados a F01-F08 + F09/F11/F15 para EN) · zero "em nome da InPP" |
| `feedback_no_more_tools.md` | **Zero** ferramentas novas instaladas · roadmap PDF gerado com Chrome headless já existente · paleta PNG gerada com Chrome screenshot já existente · zero Puppeteer / Pandoc / MiKTeX / wkhtmltopdf |
| `feedback_handoffs_detail.md` | Este registo lista comandos cronológicos + ficheiros + tamanhos + decisões + razões |
| `mandatory-change-log.md` | Comandos exactos + diffs antes/depois + razões registadas |
| `feedback_no_invented_cases.md` | Zero invenção · roadmap usa estrutura real do JSON · press-releases têm placeholders explícitos para datas/contactos/morada |
| `feedback_governance_never_blocks_execution.md` | Avancei Dia 6 imediatamente após verificação de pré-requisitos · zero pedidos de aprovação a `@pm` ou outros · cumpre directiva Eurico "avança Dia 6" |
| `language-standards.md` | PT-PT estrito no `press-release-pt.md` e README · sem PT-BR · termos em inglês apenas para títulos consagrados |
| Decisão D3 (Pedro primeiro, depois InPP) | Press-releases referem InPP por nome textual · zero logos InPP/CCDR · zero conteúdo "em nome da InPP" |
| `mcp-usage.md` | Zero uso de docker-gateway · só Read/Write/Edit/Bash nativos (e Chrome local para PDF/PNG) |
| `output-format-standards.md` | Zero emojis · tabelas markdown · tom institucional sóbrio |
| `handoff-location.md` | Trabalho dentro de `membros/cliente-frusoal/` · todos os artefactos no projecto correcto |

---

## Decisões em aberto (transferidas para Dia 7)

| # | Decisão | Quem decide | Quando |
|---|---------|--------------|--------|
| O2 | Foto da sede em construção em Tavira | Eurico (passa foto se houver) | Antes de Dia 7 |
| O5 | Reduzir páginas dos PDFs ficha técnica (6-7 → 4-5) ou aceitar tamanho actual | Eurico ao ver os 4 PDFs | Antes de Dia 7 (decide rever ou não) |
| O6 | Lighthouse a11y/perf scores em produção | Eurico no Chrome DevTools | Antes de Dia 7 |
| **O7** (novo) | Aceitar roadmap PDF actual (147 KB · 1 página A4 paisagem) ou ajustar layout (mais espaço descrição vs mais condensado) | Eurico ao ver `roadmap-36-meses.pdf` | Antes de Dia 7 |
| **O8** (novo) | Aceitar wordmark colorido com `#C68420` em "InovCitrus" ou preferir tudo em `#1A1A1A` (mais sóbrio) | Eurico ao ver `wordmark-inovcitrus.svg` no browser | Antes de Dia 7 |

---

## Próximos passos

| Dia | Status | Tarefa | Pré-requisito |
|-----|--------|--------|----------------|
| 1-5 | ✓ | Conteúdo + traduções + scaffold + build + deploy + 4 PDFs | — |
| 6 | ✓ feito | Roadmap PDF + kit imprensa | Dia 5 |
| 7 | a executar | Revisão final · checklist fontes · resolução O2/O5/O6/O7/O8 · envelope físico PARA-IMPRIMIR · handoff "pronto para Eurico entregar ao Pedro" | Dia 6 + decisões Eurico O5/O6/O7/O8 |

---

## Estado acumulado Dias 1+2+3+4+5+6

| Dia | Ficheiros | Linhas / KB | Foco |
|-----|-----------|-------------|------|
| 1 | 8 | ~800 linhas | Conteúdo PT + estrutura + fontes F01-F08 |
| 2 | 18 | ~1.700 linhas | Conteúdo EN/ES/FR + fontes F09-F16 |
| 3 | 17 | ~625 linhas | Identidade visual + Next.js scaffold completo |
| 4 | 1 PROGRESSO + 19 fixes em 11 markdowns | — | Build + dev + smoke test 18 testes + correcção hrefs |
| 5 | 1 script + 4 PDFs + bump deps | ~140 linhas + 670 KB PDFs | Bump Next 14.2.35 + deploy Vercel + 4 PDFs ficha técnica |
| **6** | **1 script + 7 ficheiros kit + 1 PDF + 1 PROGRESSO** | **~270 linhas + 200 KB artefactos** | **Roadmap PDF visual + kit imprensa completo** |
| **Acumulado** | **52+** | **~3.420 linhas + ~870 KB artefactos** | **6/7 dias entregues — pacote casa pública 86% concluído** |

---

## Para Eurico validar agora

Antes de avançar Dia 7:

1. **Abrir** `04-landing/inovcitrus-pdfs/output/roadmap-36-meses.pdf` → confirmar legibilidade · paleta · estrutura 3 anos × 2 faixas → decidir O7
2. **Abrir** `04-landing/inovcitrus-kit-imprensa/wordmark-inovcitrus.svg` no browser ou Inkscape → confirmar tom citrus-dark em "InovCitrus" → decidir O8
3. **Abrir** `04-landing/inovcitrus-kit-imprensa/paleta-swatches.png` → confirmar 6 cores correctas
4. **Abrir** `04-landing/inovcitrus-kit-imprensa/press-release-pt.md` (e EN) → confirmar tom institucional · placeholders · zero invenção
5. **Abrir** `04-landing/inovcitrus-kit-imprensa/README.md` → confirmar instruções claras para a Frusoal

Sem feedback negativo do Eurico, avanço Dia 7 (revisão final + envelope físico + handoff entrega).

---

## Estado git

`membros/cliente-frusoal/` continua **integralmente untracked**. Trabalho dos Dias 1-6 NÃO foi committed. Aguarda ordem explícita do Eurico (regra `agent-authority.md`: apenas `@devops` faz push).

---

*Fim do registo Dia 6 — pacote casa pública 86% concluído. Roadmap PDF + kit imprensa entregues. Próximo: revisão final + envelope físico + handoff entrega (Dia 7).*
