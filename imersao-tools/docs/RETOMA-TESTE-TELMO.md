# RETOMA — Teste Telmo (ler PRIMEIRO em qualquer sessao nova)

## O que estamos a fazer

Teste real do pipeline da imersao ORIGINAI (11-12 Abril).
O Eurico faz o percurso como se fosse o Telmo (PT Virtual).
Tira prints de cada passo. A Uma analisa e anota.

## Projecto de teste

- Nome: FitCoach AI — Personal Trainer Virtual
- Dor: PT presencial custa 200-300 EUR/mes
- Modelo: free trial 7 dias → 7,99 EUR/mes
- Pasta: `imersao-tools/docs/teste-telmo/`

## Onde estamos (actualizar a cada sessao)

| Passo | Estado | Ficheiro |
|-------|--------|----------|
| P1 Briefing | FEITO | teste-telmo/docs/briefing-base.json |
| P2 Perguntas | FEITO | teste-telmo/docs/perguntas-pesquisa.md |
| P3 Pesquisa x3 | FEITO | teste-telmo/docs/pesquisa-*.md |
| P4 Relatorio | FEITO | teste-telmo/docs/relatorio-tecnico.md |
| P5 PRD final | FEITO | teste-telmo/docs/prd-final.md |
| P5 Construcao | PROXIMO | Eurico vai fazer hands-on, print a print |
| P6 Deploy | PENDENTE | |

## Ultima sessao (10/04/2026)

Kit reescrito: 7 passos → 6 passos.
- P1: BG gera 2 blocos → copiar para Bloco de Notas → guardar como payload.md + blueprint.md
- P2: Claude Code gera prompt de pesquisa optimizado (le os ficheiros do P1)
- P3: Colar prompt em 3 LLMs (Perplexity, ChatGPT, Gemini) → cada uma pesquisa E cria PRD tecnico → guardar em docs/
- P4: Claude Code funde os 3 PRDs num PRD final (docs/prd-final.md)
- P5: Construir (Claude Code le PRD e constroi)
- P6: Deploy (GitHub + Vercel)

Decisao-chave: LLMs que pesquisam ja criam o PRD tecnico (contexto completo). Claude Code recebe PRD pronto.

5 prints do BG analisados (passo-01..05.png). 4 achados: F3-10 a F3-13.

Proximo: testar P5 (construcao) com Claude Code.

## Ficheiros-chave (ler se precisares de contexto)

1. `imersao-tools/docs/TEST-LOG-TELMO.md` — diario completo do teste
2. `imersao-tools/docs/manual-fase3.html` — manual que o aluno segue
3. `imersao-tools/docs/originai-kit-imersao.html` — kit com 8 tabs
4. `imersao-tools/docs/PRD-IMERSAO-ORIGINAI.md` — PRD da imersao
5. `imersao-tools/docs/teste-telmo/docs/prd-final.md` — PRD do projecto

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
