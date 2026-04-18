# RETOMA — Teste Telmo (ler PRIMEIRO em qualquer sessao nova)

## O que estamos a fazer

Teste real do pipeline da imersao ORIGINAI (11-12 Abril).
O Eurico faz o percurso como se fosse o Telmo (PT Virtual).
Tira prints de cada passo. A Uma analisa e anota.

## Projecto de teste

- Nome: FitCoach AI — Personal Trainer Virtual
- Dor: PT presencial custa 200-300 EUR/mes
- Modelo: free trial 7 dias → 7,99 EUR/mes
- Pasta: `membros/telmo/`

## Onde estamos (actualizar a cada sessao)

| Passo | Estado | Ficheiro |
|-------|--------|----------|
| P1 Briefing | FEITO (prints reais) | membros/telmo/assets/passo-01..05.png |
| P2 Prompt Pesquisa | FEITO (simulado) | membros/telmo/01-pesquisa/perguntas-pesquisa.md |
| P3 Pesquisa x3 | FEITO (simulado) | membros/telmo/01-pesquisa/pesquisa-*.md |
| P4 PRD Final | FEITO (simulado) | membros/telmo/02-prd/prd-final.md |
| P5 Construcao | PROXIMO | Eurico vai fazer hands-on, print a print |
| P6 Deploy | PENDENTE | |

## Ultima sessao (10/04/2026 — sessao 2, limpeza)

Sessao anterior (10/04, sessao 1): Kit reescrito 7→6 passos + 5 prints BG analisados + 5 achados (F3-10 a F3-14).
Sessao 2: Revisao cruzada handoff vs RETOMA vs TEST-LOG. Corrigidas 6 inconsistencias:
1. Tabela RETOMA alinhada com 6 passos (tinha P5 duplicado)
2. RETOMA: "4 achados" → "5 achados" (F3-10 a F3-14)
3. TEST-LOG cabecalho: "7 passos" → "6 passos"
4. TEST-LOG veredicto Fase 3: actualizado para "EM CURSO"
5. TEST-LOG resumo: "P5-P6 colar no terminal" marcado CORRIGIDO
6. TEST-LOG tab Kit HTML: marcado como feito

Proximo: testar P5 (Construcao) — Eurico abre Claude Code, cola prompt do kit, IA le prd-final.md e constroi.

## Pipeline actual (6 passos — reescrito 10/04)

- P1: BG gera 2 blocos → copiar para Bloco de Notas → guardar como payload.md + blueprint.md
- P2: Claude Code gera prompt de pesquisa optimizado (le os ficheiros do P1)
- P3: Colar prompt em 3 LLMs a escolha → cada LLM pesquisa E cria PRD tecnico → guardar em docs/
- P4: Claude Code funde os 3 PRDs num PRD final (docs/prd-final.md)
- P5: Construir (Claude Code le PRD e constroi)
- P6: Deploy (GitHub + Vercel)

Decisao-chave: LLMs que pesquisam ja criam o PRD tecnico (contexto completo). Claude Code recebe PRD pronto.

## Ficheiros-chave (ler se precisares de contexto)

1. `membros/telmo/handoffs/TEST-LOG-TELMO.md` — diario completo do teste
2. `imersao-tools/docs/manual-fase3.html` — manual que o aluno segue
3. `imersao-tools/docs/originai-kit-imersao.html` — kit com 8 tabs
4. `imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md` — PRD da imersao
5. `membros/telmo/02-prd/prd-final.md` — PRD do projecto

## O que fazer ao abrir sessao nova

1. Ler ESTE ficheiro (ja estas a ler)
2. Activar @ux-design-expert (Uma)
3. Dizer: "continuar teste Telmo, estou no passo [X]"
4. Se o Eurico enviar prints, analisar e anotar no TEST-LOG
5. Qualquer correcao ao kit/manual → fazer e anotar

## Achados pendentes (corrigir quando possivel)

- ~~F3-5: Payload do BG referencia agentes AIOX~~ FECHADO — alunos instalam AIOX na manha
- F3-6: `generateProjectSeed` hardcoda arquitectura em vez de usar `detectProjectType` (SmartAI.ts:249)
- ~~F3-7: Verificar se botao "Exportar Briefing JSON" existe~~ FECHADO — confirmado em App.tsx:382

## Regra de ouro

NUNCA reexplicar contexto. Ler ficheiros. Continuar onde parou.
