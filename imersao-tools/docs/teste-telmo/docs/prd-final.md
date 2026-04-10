# PRD Final — FitCoach AI | Personal Trainer Virtual

> Versao: 1.0 (MVP)
> Autor: Telmo Cerveira
> Data: 09/04/2026
> Fontes: briefing-base.json + relatorio-tecnico.md

---

## Visao

Democratizar o acesso a treino personalizado em portugues. Uma app que gera planos de treino adaptados ao perfil, objectivos e equipamento de cada utilizador — por 7,99 EUR/mes em vez de 200-300 EUR/mes de um PT presencial.

## Problema + Publico

**Problema:** 70% das pessoas que querem treinar nao conseguem pagar um personal trainer. As alternativas gratuitas (YouTube, apps genericas) nao sao personalizadas — "nao sei se estou a fazer bem."

**Publico:** Adultos 25-45 anos em Portugal/Europa, rendimento medio, que querem treinar com orientacao mas sem orcamento para PT presencial. Ja tentaram YouTube e apps gratis, desistiram por falta de estrutura.

**Dados de mercado:** IA e 80-90% tao eficaz como PT humano para utilizadores auto-motivados (fonte: pesquisa concorrentes). O mercado PT/EU nao tem lider claro neste segmento.

---

## MVP — Funcionalidades com criterios de aceitacao

### F1. Questionario de perfil

**Descricao:** Formulario de onboarding que recolhe dados do utilizador.

**Campos:** nome, idade, genero, peso, altura, objectivo (perder peso / ganhar massa / manter), nivel de experiencia (iniciante / intermedio / avancado), equipamento disponivel (casa sem equipamento / casa com halteres / ginasio completo), limitacoes fisicas (opcional), dias disponiveis por semana.

**Criterio de aceitacao:**
- Formulario completo em menos de 3 minutos
- Dados guardados no perfil do utilizador (Supabase)
- Possibilidade de editar perfil depois

### F2. Geracao de plano semanal por IA

**Descricao:** Com base no perfil, a IA gera um plano de treino semanal personalizado.

**Criterio de aceitacao:**
- Plano gerado em menos de 15 segundos
- Adaptado ao equipamento disponivel (casa vs. ginasio)
- Exercicios com nome, series, repeticoes, descanso
- Cada exercicio com link para demonstracao (ExerciseDB)
- Plano muda semanalmente (progressao)

### F3. Base de exercicios

**Descricao:** Catalogo de exercicios com demonstracoes visuais.

**Criterio de aceitacao:**
- Minimo 200 exercicios no lancamento (filtrados do ExerciseDB)
- Filtros: grupo muscular, equipamento, dificuldade
- Cada exercicio: GIF/video, instrucoes passo-a-passo, musculos trabalhados

### F4. Dashboard de progresso

**Descricao:** Painel onde o utilizador ve a sua evolucao.

**Criterio de aceitacao:**
- Registo de treinos completados (data, exercicios, pesos)
- Grafico de peso ao longo do tempo
- Streak de dias consecutivos (gamificacao basica)
- Resumo semanal: "Esta semana treinaste X dias, completaste Y exercicios"

### F5. Autenticacao + Pagamento

**Descricao:** Sistema de login e gestao de subscricao.

**Criterio de aceitacao:**
- Login com Google (Supabase Auth)
- Trial gratis de 7 dias (sem cartao)
- Subscricao Pro: 7,99 EUR/mes via Stripe
- Plano gratis apos trial: acesso limitado (1 plano/semana, sem progresso detalhado)

---

## Stack tecnica

| Camada | Tecnologia | Justificacao |
|--------|-----------|-------------|
| Frontend | React 19 + Vite | Rapido, moderno, deploy facil no Vercel |
| UI | Tailwind CSS + Shadcn/UI | Componentes prontos, responsivo, dark mode |
| Backend | Supabase | Auth, DB (PostgreSQL), RLS, gratis ate 50K MAU |
| Exercicios | ExerciseDB API | 11K+ exercicios, open source, GIFs |
| IA | Claude API (Anthropic) | Geracao de planos de treino personalizados |
| Pagamentos | Stripe Checkout | Integrado, europeu, suporta EUR |
| Deploy | Vercel | Free tier, deploy automatico via GitHub |

---

## Modelo de negocio

| Plano | Preco | Inclui |
|-------|-------|--------|
| Trial | Gratis (7 dias) | Acesso total, sem cartao |
| Free (apos trial) | 0 EUR | 1 plano/semana, exercicios basicos |
| Pro | 7,99 EUR/mes | Planos ilimitados, nutricao basica, progresso detalhado, prioridade IA |

**Metricas de conversao esperadas (baseadas em dados de mercado):**
- Trial-to-paid: 30-40% (mediana fitness: 39,9%)
- Retencao dia 30: 25-30% (com gamificacao)
- Churn mensal: 8-12%

---

## Metricas de sucesso (primeiro mes)

| Metrica | Target |
|---------|--------|
| Sign-ups | 100 |
| Retencao dia 30 | >= 30% |
| Conversao trial → pago | >= 10% |
| Planos gerados por IA | 500+ |
| NPS | >= 40 |

---

## O que NAO esta no MVP

| Feature | Razao | Quando |
|---------|-------|--------|
| Planos de nutricao detalhados | Complexidade legal + tecnica | v2 |
| Integracao wearables | Nice-to-have, nao bloqueia valor | v2 |
| Comunidade / social | Retencao longo prazo, mas MVP foca em core | v2 |
| Video-consulta com PT | Requer parcerias e infraestrutura | v3 |
| App nativa (iOS/Android) | PWA primeiro, nativa depois | v3 |

---

## Design

- Dark mode por defeito (tendencia fitness apps)
- Cores: azul/cyan para accoes, verde para sucesso/progresso, escuro para fundo
- Tipografia: Inter (body) + monospace para numeros/metricas
- Mobile-first (80%+ do publico-alvo usa telemovel)
- Animacoes subtis nas transicoes de exercicio

---

*PRD gerado pelo metodo ORIGINAI: clareza antes de execucao.*
*Briefing → Pesquisa → Relatorio Tecnico → PRD Final → Construcao.*
