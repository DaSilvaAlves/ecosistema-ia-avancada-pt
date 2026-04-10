# Relatorio Tecnico — FitCoach AI (Personal Trainer Virtual)

> Gerado no P4 do manual Fase 3
> Fontes cruzadas: pesquisa-perplexity.md + pesquisa-chatgpt.md + pesquisa-grok.md
> Data: 09/04/2026

---

## 1. CONCORRENTES — O que ja existe

| Concorrente | Preco | Ponto forte | Ponto fraco |
|-------------|-------|-------------|-------------|
| Fitbod | ~8 EUR/mes | Progressao automatica, 264K ratings | So ginasio, sem treino casa |
| Freeletics | ~6 EUR/mes | Casa/viagem, 700+ exercicios | Sem personalizacao profunda |
| Future | 199 EUR/mes | Coach humano dedicado | Preco proibitivo |
| Caliber | Gratis + 30 EUR/mes | Bom para iniciantes | Depende de coach humano |
| Nike Training Club | Gratis | Grande base, video | Descontinuado features premium |

**Conclusao:** O mercado e dominado por apps americanas. Nao existe solucao forte em PT-PT focada no mercado europeu. A faixa de preco 6-10 EUR/mes e o sweet spot.

---

## 2. PUBLICO-ALVO — Quem sao estas pessoas

- Adultos 25-45 anos, genero misto
- Rendimento medio — nao conseguem 200-300 EUR/mes para PT presencial
- Objectivos: perder peso (40%), ganhar massa (30%), manter saude (30%)
- Ja tentaram: YouTube (sem estrutura), apps gratis (sem personalizacao), planos PDF (sem acompanhamento)
- Frustracao principal: "Nao sei se estou a fazer bem. Nao tenho quem me diga."

---

## 3. MODELO DE NEGOCIO — Como ganhar dinheiro

**Recomendacao: Free trial 7 dias + subscricao mensal**

| Dado | Valor |
|------|-------|
| Conversao freemium geral | 2-5% |
| Conversao free trial (fitness) | 39,9% mediana, 68,3% top 10% |
| Preco optimo | 7,99 EUR/mes (preco baixo converte 47,8% vs 28,4%) |
| ARPU referencia | 0,44-1,31 USD (14 dias) |

**Estrutura:**
- **Trial gratis 7 dias** — acesso total, sem cartao
- **Plano Pro** — 7,99 EUR/mes (planos ilimitados + nutricao + progresso)
- **Upsell futuro** — Plano Premium 14,99 EUR/mes (video-consulta com PT certificado)

---

## 4. FUNCIONALIDADES — MVP vs. Futuro

### MVP (construir AGORA)

| Feature | Prioridade | Razao |
|---------|-----------|-------|
| Questionario de perfil (objectivos, equipamento, limitacoes) | CRITICA | Personalizacao depende disto |
| Geracao de plano semanal por IA | CRITICA | Core value proposition |
| Base de exercicios com demonstracoes (ExerciseDB) | CRITICA | Sem isto nao ha valor |
| Dashboard de progresso (peso, treinos completados) | ALTA | Retencao: utilizadores que veem progresso ficam |
| Onboarding guiado (first-run experience) | ALTA | 80-90% dos trials acontecem no dia 0 |

### Futuro (v2+)

| Feature | Prioridade | Razao |
|---------|-----------|-------|
| Gamificacao (streaks, badges, desafios semanais) | ALTA | +25-30% retencao |
| Planos de nutricao basicos | MEDIA | Diferenciador, mas complexo legalmente |
| Integracao com wearables (Apple Watch, Fitbit) | MEDIA | Nice-to-have, nao bloqueia MVP |
| Comunidade / social | MEDIA | Retencao a longo prazo |
| Video-consulta com PT certificado | BAIXA | Upsell premium, requer parcerias |

---

## 5. TECNOLOGIA — Stack recomendada

| Camada | Tecnologia | Razao |
|--------|-----------|-------|
| Frontend | React + Vite | Rapido, moderno, grande ecossistema |
| Backend/Auth/DB | Supabase | Gratis ate 50K MAU, auth built-in, RLS |
| Exercicios | ExerciseDB API (open source) | 11K+ exercicios, GIFs, instrucoes |
| Geracao IA | Claude API ou OpenAI | Gerar planos de treino personalizados |
| Deploy | Vercel | Free tier generoso, deploy automatico |
| Calculadoras | GymFit API | TDEE, BMR, BMI (complementar) |

**Nota:** ExerciseDB tem rate limits em producao. Para escalar, migrar para Wger self-hosted.

---

## 6. RISCOS E OPORTUNIDADES

### Riscos

| Risco | Gravidade | Mitigacao |
|-------|-----------|-----------|
| Responsabilidade legal (conselhos de saude) | ALTA | Disclaimer claro + consultar termos legais |
| IA gera plano perigoso para alguem com lesao | ALTA | Questionario filtra limitacoes + aviso "consulte medico" |
| Retencao baixa (70%+ churn nos primeiros 30 dias) | ALTA | Onboarding forte + gamificacao + notificacoes |
| Concorrencia forte (Fitbod, Freeletics) | MEDIA | Diferenciar pelo idioma (PT-PT) e equipamento-aware |

### Oportunidades

| Oportunidade | Potencial |
|-------------|-----------|
| Mercado PT/EU sem lider claro | ALTO — ninguem domina em portugues |
| Preco acessivel (8 EUR vs 200 EUR PT presencial) | ALTO — 25x mais barato |
| IA esta 80-90% tao eficaz como PT humano | ALTO — validacao cientifica |
| Free trial converte a 40-68% em fitness | ALTO — modelo comprovado |

---

## 7. RECOMENDACAO FINAL

**Construir MVP com:**
1. React + Supabase + ExerciseDB + Claude API
2. Questionario → Plano semanal IA → Dashboard progresso
3. Free trial 7 dias → 7,99 EUR/mes
4. Foco total em onboarding (primeiras 24h decidem tudo)
5. PT-PT como diferenciador de mercado

**Nao fazer agora:** nutricao detalhada, wearables, comunidade, video-consulta. Sao v2.

**Metrica de sucesso:** 100 sign-ups no primeiro mes, 30%+ retencao dia 30, 10%+ conversao trial→pago.
