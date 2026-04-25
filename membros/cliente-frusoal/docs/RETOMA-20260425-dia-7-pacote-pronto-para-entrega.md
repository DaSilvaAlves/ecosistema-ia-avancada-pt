# RETOMA — Frusoal InovCitrus: Dia 7 entregue, pacote casa pública 100% concluído, pronto para entrega ao Pedro Madeira

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

> **FONTE DA VERDADE:** Este documento assume leitura integral de `membros/cliente-frusoal/prompt-original.md`.
> Regra aplicável obrigatória: `.claude/rules/frusoal-source-of-truth.md`.
> Se não leste o prompt original, PARA e lê primeiro.

> **ESTE HANDOFF MARCA O FECHO DO TRABALHO DE CASA DE UMA.** A bola passa para Eurico (acção humana: imprimir, montar envelope, entregar a Pedro). Não há próximo agente a continuar — apenas observação pós-entrega e eventuais ajustes pontuais se Eurico pedir.

---

## Índice

1. Resumo executivo
2. O que está pronto (inventário final 7 dias)
3. O que falta fazer — agora é com Eurico (acção humana)
4. Decisões consolidadas — TODAS resolvidas (D1-D3, Q1-Q5, O1-O8)
5. Sinais pós-entrega — como interpretar resposta do Pedro
6. Próximo passo da relação Frusoal
7. Estado git e sugestão de commit
8. Arquivamento — RETOMA Dia 6 movido para `docs/archive/`
9. Memórias relevantes para qualquer follow-up
10. Compromissos finais cumpridos
11. Se Eurico precisar regenerar algo

---

## 1. Resumo executivo

Pacote casa pública Frusoal InovCitrus **100% concluído** em 7 dias úteis (23/04 a 25/04 de 2026 — 3 dias calendário, alta densidade). Site live em 4 línguas (`https://inovcitrus.vercel.app`), 6 PDFs imprimíveis em `output/PARA-IMPRIMIR/` (1 press release PT + 4 ficha técnica PT/EN/ES/FR + 1 roadmap 36 meses A4 paisagem), kit imprensa completo (wordmark colorido + mono SVG · paleta swatches PNG · press releases PT/EN modelo · README institucional). README-EURICO em `0-README-EURICO.md` instrui Eurico sobre impressão, envelope, cartão à mão, sinais pós-entrega. Decisões pendentes O5/O6/O7/O8/O2 resolvidas com defaults aceites (instrução directa Eurico). Zero invenção, zero "em nome da InPP", zero ferramentas novas instaladas. **Bola passa para Eurico (acção humana). Não há agente a continuar.**

---

## 2. O que está pronto (inventário final 7 dias)

### 2.1 Site institucional

| Item | Detalhe |
|------|---------|
| URL produção | `https://inovcitrus.vercel.app` |
| Línguas | PT (master) · EN · ES · FR |
| Páginas por língua | 5 (`01-home`, `02-projecto-trienal`, `03-estrutura-parceiros`, `04-repositorio`, `05-contactos`) |
| Endpoints validados | 21 (1× 307 + 20× 200) |
| Stack | Next.js 14.2.35 (CVE Dec 2025 patched) · React 18.3.1 · Tailwind 3.4.10 · TypeScript 5.5.4 |
| Hosting | Vercel · alias automático · custo zero |

### 2.2 Envelope físico — `04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/`

| # | Ficheiro | Tamanho | Páginas | Língua |
|---|----------|---------|---------|--------|
| 0 | `0-README-EURICO.md` | 2.4 KB | — (markdown) | PT |
| 1 | `1-press-release-pt.pdf` | 113 KB | 1-2 | PT |
| 2 | `2-ficha-tecnica-scirtothrips-pt.pdf` | 160 KB | ~6 | PT |
| 3 | `3-ficha-tecnica-scirtothrips-en.pdf` | 170 KB | ~6 | EN |
| 4 | `4-ficha-tecnica-scirtothrips-es.pdf` | 176 KB | ~7 | ES |
| 5 | `5-ficha-tecnica-scirtothrips-fr.pdf` | 174 KB | ~7 | FR |
| 6 | `6-roadmap-36-meses.pdf` | 147 KB | 1 (A4 paisagem) | PT |

**Total imprimível:** ~30 páginas A4 · ~940 KB de PDFs.

### 2.3 Kit imprensa — `04-landing/inovcitrus-kit-imprensa/`

| Ficheiro | Tamanho | Uso |
|----------|---------|-----|
| `README.md` | 3.6 KB | Instruções para Frusoal |
| `wordmark-inovcitrus.svg` | 555 B | Wordmark colorido (`#C68420` em "InovCitrus") |
| `wordmark-inovcitrus-mono.svg` | 555 B | Wordmark mono preto (impressão B&W) |
| `paleta-swatches.html` | 4.7 KB | Source HTML da paleta |
| `paleta-swatches.png` | 30 KB | 1280×720 · 6 cores institucionais |
| `press-release-pt.md` | 4.7 KB | Modelo PT-PT v1.0 preliminar (editável) |
| `press-release-en.md` | 4.6 KB | Modelo EN equivalente |

### 2.4 Documentação operacional

| Ficheiro | Função |
|----------|--------|
| `04-landing/FONTES.md` | F01-F16 com URLs + datas — defesa em Q&A |
| `04-landing/PROGRESSO-DIA-1.md` … `PROGRESSO-DIA-7.md` | Change log integral 7 dias (mandatory-change-log.md) |
| `04-landing/inovcitrus-pdfs/scripts/generate-pdfs.mjs` | Re-gerar 4 PDFs ficha técnica |
| `04-landing/inovcitrus-pdfs/scripts/generate-roadmap-pdf.mjs` | Re-gerar roadmap PDF |
| `04-landing/inovcitrus-pdfs/scripts/generate-press-release-pdf.mjs` | Re-gerar press release PDF |
| `membros/cliente-frusoal/prompt-original.md` | Fonte da verdade do briefing original |

### 2.5 Repositório científico (publicado no site)

Estruturado mas vazio (sem fabricar resultados). Aceita futuros artefactos científicos do projecto trienal.

### 2.6 Acumulado total

- **53+ ficheiros únicos** criados
- **~3.575 linhas** de conteúdo
- **~1.05 MB** de artefactos imprimíveis
- **20 rotas** estáticas em produção
- **6 PDFs** prontos para impressão
- **4 línguas** cobertas
- **16 fontes** rastreadas (F01-F16)
- **0 ferramentas** novas instaladas
- **0 invenção** factual

---

## 3. O que falta fazer — agora é com Eurico (acção humana)

| # | Acção | Quem | Quando | Detalhe |
|---|-------|------|--------|---------|
| 1 | Decidir placeholders | Eurico | Antes de imprimir | Press release tem `[DATA]`, `[email]`, `[telefone]` — preencher antes de imprimir OU deixar tal e qual (Pedro adapta) |
| 2 | Imprimir 6 PDFs | Eurico | Quando estiver pronto | Papel 100g+ · impressão a cores (wordmark + linha citrus + paleta) |
| 3 | Montar envelope | Eurico | Após impressão | Envelope A4 sóbrio · ordem 1→6 conforme numeração |
| 4 | Cartão à mão | Eurico | No envelope | Sugestão estilo Eurico: "Pedro, fizemos isto. Está aqui se fizer sentido. Eurico." |
| 5 | Entregar | Eurico | Quando se proporcionar | Em mão · ou recepção Frusoal Vila Nova de Cacela · ou encontro casual |
| 6 | Comunicar URL | Eurico | Junto com envelope ou em conversa | `https://inovcitrus.vercel.app` — Pedro abre no telemóvel/portátil |
| 7 | Aguardar resposta | Eurico | Timeout 7 dias | Sem resposta → não insistir (ver secção 5) |
| 8 | (Opcional) Commit Dias 1-7 | Eurico → `@devops` | Quando achar adequado | Trabalho continua untracked · push é exclusivo `@devops` |

---

## 4. Decisões consolidadas — TODAS resolvidas (D1-D3, Q1-Q5, O1-O8)

| ID | Decisão | Resolução final | Data |
|----|---------|-----------------|------|
| **D1** | Pacote completo 7 dias úteis | ✓ Concluído (7/7 dias) | 25/04/2026 |
| **D2** | Hosting Vercel | ✓ Resolvido Dia 5 (`inovcitrus.vercel.app`) | 25/04/2026 |
| **D3** | Mostrar a Pedro primeiro, depois à InPP | ✓ Em vigor permanente · zero "em nome da InPP" · zero logos não-autorizados | Sempre |
| **Q1** | Wordmark tipográfico Inter sem ícone | ✓ Implementado Dia 3 + Dia 6 | 25/04/2026 |
| **Q2** | Página "Estrutura" em vez de "Equipa" | ✓ Implementado Dia 1 | 23/04/2026 |
| **Q3** | URL Vercel `inovcitrus.vercel.app` | ✓ Conseguido como alias automático Dia 5 | 25/04/2026 |
| **Q4** | Página "Sede" vaga (sem morada/foto) | ✓ Implementado Dia 1 (4 línguas) | 23/04/2026 |
| **Q5** | Não registar `inovcitrus.pt` agora | ✓ Em vigor (custo zero) | Sempre |
| **O1** | Identidade visual InovCitrus | ✓ Resolvido Dia 3 (wordmark Inter tipográfico) | 24/04/2026 |
| **O2** | Foto sede Tavira | ✓ **Resolvido Dia 7 — omitir** (default aceite) · README-EURICO documenta a ausência | 25/04/2026 |
| **O3** | URL Vercel exacto | ✓ Resolvido Dia 5 (`inovcitrus.vercel.app`) | 25/04/2026 |
| **O4** | Bump Next CVE | ✓ Resolvido Dia 5 (14.2.13 → 14.2.35) | 25/04/2026 |
| **O5** | PDFs ficha técnica condensar para 4-5 páginas | ✓ **Resolvido Dia 7 — manter 6-7 páginas actuais** (default aceite) | 25/04/2026 |
| **O6** | Lighthouse a11y/perf scores | ✓ **Resolvido Dia 7 — site live aceite** (default aceite, não corrido) | 25/04/2026 |
| **O7** | Roadmap PDF actual ou ajustes layout | ✓ **Resolvido Dia 7 — aceitar actual** (default aceite) | 25/04/2026 |
| **O8** | Wordmark colorido `#C68420` ou tudo `#1A1A1A` | ✓ **Resolvido Dia 7 — colorido aceite** (default aceite) | 25/04/2026 |

**Razão para defaults Dia 7:** Eurico instruiu directamente "defaults aceites se não disseres nada". Avancei conforme `feedback_governance_never_blocks_execution.md`.

---

## 5. Sinais pós-entrega — como interpretar resposta do Pedro

### Sinais de "abrir porta"

- Pedro responde em **<48h** (mensagem, chamada, encontro)
- Pergunta concreta: "isto fica?" / "quanto custa?" / "como é que isto funciona?"
- Marca conversa formal (mesmo que informal) — quer perceber melhor
- Convida para evento/visita à Frusoal · pede para apresentar à equipa
- Partilha o material com terceiros (sócios, técnicos, advogados)

### Sinais de "não está para aí virado"

- Sem resposta em **7 dias** → não insistir, não follow-up agressivo
- Resposta vaga "obrigado, vou ver" sem follow-up concreto
- Eurico encontra-o noutro contexto (festa, jantar, evento) e Pedro não traz o tema → adiar
- Pedro pede para "deixar para mais tarde" sem data

### Sinais ambíguos

- Pedro acede ao site (Eurico tem acesso a Vercel analytics se quiser confirmar) mas não responde — não é fechamento, é tempo
- Resposta entusiástica genérica sem questão concreta — pode ser cortesia, esperar follow-up

### Regra de ouro

Pedro tem 65 anos, 45 anos de empresa. **Não está em modo de "reagir a propostas".** Decide quando decide. Eurico conhece-o desde a infância — canal natural, presencial, informal. Zero pressão, zero urgência fabricada.

---

## 6. Próximo passo da relação Frusoal

| Cenário | Próximo passo |
|---------|----------------|
| Pedro responde com interesse | Eurico marca conversa de pares · não levar proposta comercial · ouvir o que Pedro precisa · só depois decidir se há proposta |
| Pedro responde vagamente | Aguardar follow-up natural · não forçar |
| Pedro não responde em 7 dias | Adiar · próximo contacto orgânico (não relacionado com este pacote) · pode ser convite para almoço, conversa sobre Algarve, etc. |
| Pedro pede preço | **NÃO** dar preço imediato · marcar conversa para perceber escopo · proposta comercial só após scope clarificado · linguagem consultiva, não vendor |
| Pedro pede para envolver InPP/CCDR | Pedro decide como/quando comunicar com InPP · Eurico só age após autorização explícita Pedro |

---

## 7. Estado git e sugestão de commit

### 7.1 Estado actual

```bash
$ git status --porcelain membros/cliente-frusoal/
?? membros/cliente-frusoal/
```

**TODA** a pasta `membros/cliente-frusoal/` continua untracked (Dias 1-7 inclusive). Aguarda ordem explícita do Eurico.

### 7.2 Sugestão de commit (se Eurico aprovar)

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt

# Verificar que .gitignore exclui node_modules/, .next/, .vercel/, .tmp-html/
cat membros/cliente-frusoal/04-landing/inovcitrus-site/.gitignore

# Stage tudo da Frusoal
git add membros/cliente-frusoal/

# Commit local (push é exclusivo @devops)
git commit -m "feat(frusoal): pacote casa pública InovCitrus v1.0 — site live + 6 PDFs + kit imprensa + envelope físico

7 dias de execução (23/04 a 25/04 de 2026):
- Site Next.js 14.2.35 em 4 línguas (PT/EN/ES/FR), 20 rotas estáticas, deploy Vercel
- 4 PDFs ficha técnica Scirtothrips aurantii (PT/EN/ES/FR) gerados via Chrome headless
- 1 PDF roadmap 36 meses (A4 paisagem, 23 actos comunicativos)
- 1 PDF press release PT (modelo preliminar)
- Kit imprensa: wordmark colorido + mono SVG, paleta swatches PNG, press releases PT/EN
- Envelope físico PARA-IMPRIMIR/ com 6 PDFs numerados + README-EURICO
- 16 fontes rastreadas (F01-F16) · zero invenção factual

Site live: https://inovcitrus.vercel.app
PDFs imprimíveis: 04-landing/inovcitrus-pdfs/output/PARA-IMPRIMIR/

Constraint: prompt-original.md fonte da verdade
Constraint: zero \"em nome da InPP\" (decisão D3)
Constraint: zero ferramentas novas instaladas (Chrome headless reutilizado)
Constraint: zero linguagem vendor (sem combo, package, ROI, PRR)
Confidence: high
Scope-risk: narrow
Directive: Pacote v1.0 preliminar — aguarda validação formal Frusoal antes de publicação ampla"

# Push só por @devops, e só se Eurico decidir publicar (pacote é entregue offline ao Pedro, não precisa GitHub público)
```

### 7.3 Estrutura de commits sugerida (alternativa granular)

Se Eurico preferir granular, 1 commit por dia: ver secção 21.4 do handoff Dia 5 (preservada em `docs/archive/`).

---

## 8. Arquivamento — RETOMA Dia 6 movido para `docs/archive/`

Conforme protocolo `handoff-central.md`:

| Acção | Detalhe |
|-------|---------|
| Origem | `membros/cliente-frusoal/docs/RETOMA-20260425-dia-6-roadmap-kit-imprensa-pronto-proximo-dia-7.md` |
| Destino | `membros/cliente-frusoal/docs/archive/RETOMA-20260425-dia-6-roadmap-kit-imprensa-pronto-proximo-dia-7.md` |
| Marcação no YAML do Dia 6 | `consumed: true` (handoff Dia 6 foi consumido por este Dia 7) |
| Razão | Dia 6 foi consumido na criação do Dia 7 · não é stale · arquivar para preservar histórico |

---

## 9. Memórias relevantes para qualquer follow-up

| Memória | Relevância pós-entrega |
|---------|------------------------|
| `frusoal-source-of-truth.md` | Manter sempre · qualquer doc futuro Frusoal lê prompt-original primeiro |
| `feedback_nunca_combo_clientes_comerciais.md` | Crítica · se Pedro pedir preço, NÃO usar linguagem vendor SaaS |
| `feedback_no_projected_business_models.md` | Não projectar modelo de negócio · só responder ao que Pedro perguntar |
| `project_frusoal_eurico_pedro_relacao.md` | Eurico conhece Pedro desde infância · canal informal · zero cold outreach |
| `project_frusoal_proposito.md` | Propósito desta fase: analisar + identificar ONDE/COMO apresentar IA · não avançar para proposta sem PRD |
| `feedback_governance_never_blocks_execution.md` | Avançar · não pedir 3 aprovações |
| `feedback_no_invented_cases.md` | Sempre rastrear afirmações a fontes |
| `agent-authority.md` | Push é exclusivo `@devops` · `@dev` pode commit local |
| `handoff-location.md` | Handoffs Frusoal sempre em `membros/cliente-frusoal/docs/` |

---

## 10. Compromissos finais cumpridos

| Compromisso | Cumprimento |
|-------------|--------------|
| Cada afirmação rastreada a fonte | ✓ FONTES.md F01-F16 · 16 fontes verificadas |
| Site Vercel funcional 4 línguas | ✓ Dia 5 — `https://inovcitrus.vercel.app` |
| 4 PDFs ficha técnica imprimíveis | ✓ Dia 5 |
| Roadmap PDF visual | ✓ Dia 6 |
| Kit imprensa | ✓ Dia 6 (7 ficheiros) |
| Press release PT em PDF | ✓ Dia 7 (113 KB · 1-2 páginas A4) |
| Envelope físico compilado (PARA-IMPRIMIR/) | ✓ Dia 7 (6 PDFs numerados + README) |
| README-EURICO.md final | ✓ Dia 7 |
| Handoff "pronto para entrega" | ✓ **Este documento** |
| Zero invenção · zero "em nome da InPP" · zero logos não-autorizados | ✓ Sempre |
| Zero ferramentas novas instaladas | ✓ 7/7 dias (Chrome reutilizado tanto para PDF como para PNG) |
| Linguagem consultiva, não vendor | ✓ Sempre · README-EURICO documenta "Preços, propostas, 'combos' — isto é trabalho de casa nosso, não venda" |

---

## 11. Se Eurico precisar regenerar algo

### 11.1 Regenerar press release PT (e.g. preencher placeholders)

```bash
# Editar markdown source
nano /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-kit-imprensa/press-release-pt.md
# Substituir [DATA], [email], [telefone] pelos valores reais

# Regenerar PDF
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
node scripts/generate-press-release-pdf.mjs

# Recopiar para PARA-IMPRIMIR/
cp output/press-release-pt.pdf output/PARA-IMPRIMIR/1-press-release-pt.pdf
```

### 11.2 Regenerar 4 PDFs ficha técnica

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
node scripts/generate-pdfs.mjs

# Recopiar para PARA-IMPRIMIR/
cp output/ficha-tecnica-scirtothrips-pt.pdf output/PARA-IMPRIMIR/2-ficha-tecnica-scirtothrips-pt.pdf
cp output/ficha-tecnica-scirtothrips-en.pdf output/PARA-IMPRIMIR/3-ficha-tecnica-scirtothrips-en.pdf
cp output/ficha-tecnica-scirtothrips-es.pdf output/PARA-IMPRIMIR/4-ficha-tecnica-scirtothrips-es.pdf
cp output/ficha-tecnica-scirtothrips-fr.pdf output/PARA-IMPRIMIR/5-ficha-tecnica-scirtothrips-fr.pdf
```

### 11.3 Regenerar roadmap PDF

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt/membros/cliente-frusoal/04-landing/inovcitrus-pdfs/
node scripts/generate-roadmap-pdf.mjs

cp output/roadmap-36-meses.pdf output/PARA-IMPRIMIR/6-roadmap-36-meses.pdf
```

### 11.4 Verificar site live

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app    # esperado: 307
curl -s -o /dev/null -w "%{http_code}\n" https://inovcitrus.vercel.app/pt # esperado: 200
```

### 11.5 Mudar wordmark para mono (se Eurico mudar de ideias O8)

Editar `inovcitrus-kit-imprensa/wordmark-inovcitrus.svg`: trocar `fill="#C68420"` → `fill="#1A1A1A"` na tag `<text>` "InovCitrus". Re-gerar `paleta-swatches.png` se quiser que reflicta.

E re-gerar PDFs (press release, ficha técnica, roadmap) — todos têm o wordmark no header com `.inovcitrus { color: #C68420 }`. Substituir por `#1A1A1A` nos 3 scripts em `inovcitrus-pdfs/scripts/` e re-correr.

---

## LEMBRETE — REGRA HANDOFF-LOCATION

ESTE FICHEIRO ESTÁ EM `membros/cliente-frusoal/docs/`. PROJECTO: Frusoal (cliente comercial). CAMINHO CORRECTO. NÃO MOVER.

## LEMBRETE — REGRA FRUSOAL SOURCE OF TRUTH

ANTES DE PRODUZIR QUALQUER OUTPUT FRUSOAL FUTURO, LER:
1. `.claude/rules/frusoal-source-of-truth.md`
2. `membros/cliente-frusoal/prompt-original.md`
3. **Este handoff integralmente**
4. `04-landing/FONTES.md`
5. `04-landing/PROGRESSO-DIA-{1..7}.md`

VIOLAÇÃO = PARAR · DESCARTAR · REFAZER.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Frusoal InovCitrus (cliente comercial)
- **LOCALIZAÇÃO CORRECTA:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md`
- **LOCALIZAÇÃO ACTUAL:** `membros/cliente-frusoal/docs/RETOMA-20260425-dia-7-pacote-pronto-para-entrega.md`
- **COINCIDEM?** SIM

AGENTE RESPONSÁVEL: `@ux-design-expert` (Uma)
DATA: 25/04/2026
ESTADO: handoff de fecho de pacote · próximo agente NÃO existe · trabalho de casa concluído · bola passa para acção humana (Eurico)
