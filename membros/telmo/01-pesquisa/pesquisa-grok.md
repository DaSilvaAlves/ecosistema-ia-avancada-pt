# Pesquisa 3 — Modelo de negocio, ARPU e tecnologia

> Fonte: Web search (simulando Grok)
> Data: 09/04/2026

## Modelos de negocio — conversao

| Modelo | Conversao media | Top performers |
|--------|-----------------|----------------|
| Hard paywall | 12,11% | — |
| Freemium | 2,18% (geral), 3-5% (apps) | 6-8% |
| Free trial | 8-12% | 15-25% |
| Trial fitness especifico | 39,9% mediana | 68,3% (top 10%) |

## ARPU (receita media por utilizador)

| Metrica | Valor |
|---------|-------|
| ARPU 14 dias (mediana saude/fitness) | 0,44 USD |
| ARPU 14 dias (quartil superior) | 1,31 USD |
| ARPU P90 | 4,19 USD |

## Insights de monetizacao

- Precos mais baixos convertem melhor: 47,8% vs 28,4% (preco alto)
- Modelo hibrido (subscricao + compras in-app) gera mais receita que so subscricao
- Apps com trial gratuito convertem 2-4x mais que freemium puro
- 80-90% dos trials acontecem no DIA 0 — onboarding decide tudo

## Tecnologia — APIs de exercicios

| API | Exercicios | Preco | Notas |
|-----|-----------|-------|-------|
| ExerciseDB | 11.000+ | Gratis (open source) | Videos, GIFs, instrucoes. Rate limits em producao. |
| YMove | 636+ | Pago | HD videos, melhor alternativa paga |
| Free Exercise DB | 800+ | Gratis (dominio publico) | JSON + imagens, sem videos |
| GymFit API | — | Gratis | Inclui calculadoras (TDEE, BMR, BMI) |
| Wger | — | Gratis (open source) | Self-hosted, REST API, nutricao incluida |

## Recomendacao para o FitCoach AI

1. **Modelo:** Free trial 7 dias → subscricao 7,99 EUR/mes (preco baixo converte melhor)
2. **API:** ExerciseDB para MVP (gratis, 11K+ exercicios), migrar para Wger self-hosted em producao
3. **Stack:** React + Supabase + ExerciseDB + Claude API para geracao de planos
4. **Quick win MVP:** questionario → plano semanal gerado por IA → dashboard basico

## Fontes

- https://www.revenuecat.com/state-of-subscription-apps-2025/
- https://financialmodelslab.com/blogs/kpi-metrics/personal-fitness-mobile-application
- https://github.com/ExerciseDB/exercisedb-api
- https://github.com/wger-project/wger
- https://ymove.app/exercise-api
