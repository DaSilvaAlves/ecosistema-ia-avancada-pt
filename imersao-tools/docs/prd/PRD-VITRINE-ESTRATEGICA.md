# PRD — Vitrine Estratégica [IA]AVANÇADA PT

**ID:** PRD-VITRINE-001
**Versão:** 1.0
**Data:** 22/03/2026
**Autor:** Morgan (PM) com input de Quinn (QA)
**Estado:** Draft — aguarda validação

---

## 1. Problema

A comunidade [IA]AVANÇADA PT desenvolveu mais de 15 ferramentas e projectos ao longo do ecossistema — pipeline pedagógico, ferramentas de apoio, case studies de clientes. Muitas foram desenvolvidas, deployadas e esquecidas. Não existe uma estratégia de exposição que:

- Demonstre o valor real do ecossistema a novos membros
- Motive membros existentes a utilizar ferramentas disponíveis
- Funcione como prova social para aquisição de novos membros
- Posicione a [IA]AVANÇADA PT como referência em IA aplicada em Portugal

**Risco actual:** Ferramentas soltas sem narrativa = zero impacto. O visitante não entende o que tem acesso nem o porquê.

---

## 2. Objectivo estratégico

Transformar a secção "Vitrine [IA]" do dashboard da comunidade num **showcase estratégico** que:

1. **Demonstre capacidade real** — ferramentas funcionais, não promessas
2. **Guie o membro pelo ecossistema** — cada item na vitrine tem um propósito claro
3. **Funcione como marketing** — qualquer visitante entende o valor em 30 segundos
4. **Gere prova social** — case studies reais mostram resultados concretos

**Métrica de sucesso:** Membro novo que entra na vitrine entende o valor do ecossistema e activa pelo menos 1 ferramenta nas primeiras 24h.

---

## 3. Público-alvo

| Segmento | Perfil | O que procura na vitrine |
|----------|--------|--------------------------|
| Visitante/lead | Ainda não é membro | Prova de que a comunidade entrega valor real |
| Membro novo (Nível 1-2) | Entrou recentemente | Orientação — "por onde começo?" |
| Membro activo (Nível 3-4) | Já utiliza ferramentas | Novidades, ferramentas avançadas, inspiração |
| Potencial cliente | Quer contratar serviços | Case studies e provas de capacidade |

---

## 4. Arquitectura da vitrine — 3 secções estratégicas

### 4.1 Secção 1: "As Nossas Ferramentas" (Pipeline da Imersão)

**Objectivo:** Mostrar que os membros têm acesso a um pipeline real de criação com IA.

**Posicionamento:** "Do zero ao deploy em 48 horas — estas são as ferramentas que utilizas."

| # | Ferramenta | URL | Descrição curta | CTA |
|---|-----------|-----|-----------------|-----|
| 1 | Student Profiler | deployed | "Descobre o teu nível real de IA" | Experimenta |
| 2 | Briefing Generator | deployed | "Transforma a tua ideia num PRD técnico" | Experimenta |
| 3 | Starter Builder | deployed | "Configura o design do teu projecto" | Experimenta |
| 4 | Prompt Optimizer | deployed | "Optimiza o teu prompt para máximo resultado" | Experimenta |
| 5 | AIOS Compiler | deployed | "Gera código React e publica no GitHub" | Experimenta |
**Regra visual:** Apresentar como pipeline sequencial (1 → 2 → 3 → 4 → 5), não como lista. Cada passo linka para o seguinte. O Diagrama Pipeline (se deployado) serve como hero visual desta secção.

---

### 4.2 Secção 2: "Ecossistema [IA]" (Ferramentas de apoio)

**Objectivo:** Mostrar que a comunidade é mais do que formações — é um ecossistema completo.

**Posicionamento:** "Ferramentas que construímos para resolver problemas reais."

| Ferramenta | URL | Descrição curta | Tipo |
|-----------|-----|-----------------|------|
| AIOS Control Center | aios-control-center-web.vercel.app | "Centro de comando para orquestrar agentes IA" | Dashboard |
| Design System Visual | design-system-visual.vercel.app | "O padrão visual de tudo o que construímos" | Referência |
| Roda da Vida Interativa | roda-da-vida-interativa.vercel.app | "Avalia o equilíbrio da tua vida com IA" | Ferramenta pessoal |
| Tradutor Pro DOCX | tradutor-pro-docx.vercel.app | "Tradução profissional de documentos com IA" | Utilitário |

**Critério de inclusão:** Apenas ferramentas que funcionam a 100% e que um membro consiga utilizar sem assistência.

**Excluídos (por agora):**
- Monster Dashboard — ferramenta interna, confunde o público
- Video Pipeline — backend sem UI, sem valor de showcase
- AI Velocity Imersão — conteúdo insuficiente
- Prototype Vision — redirige para outro projecto

---

### 4.3 Secção 3: "Projectos Reais" (Case Studies)

**Objectivo:** Prova social — mostrar que a metodologia gera resultados reais para clientes reais.

**Posicionamento:** "Projectos construídos com a metodologia [IA]AVANÇADA PT."

| Projecto | URLs | Descrição | Cliente |
|---------|------|-----------|---------|
| Nexus CRM | nexus-crm-lac.vercel.app | CRM com IA integrada | A avaliar |

**Regra:** Cada case study deve incluir: problema → solução → resultado. Sem isso, não entra na vitrine.

**Nota sobre Nexus CRM:** Avaliar estado antes de publicar. Se não estiver completo e funcional, não entra.

**Removidos (decisão do utilizador 22/03/2026):**
- Manuel Manero — todos os projectos removidos da vitrine por decisão do utilizador

---

## 5. Regras de copy e tom

Conforme design system [IA]AVANÇADA PT e voz do Eurico:

| Regra | Detalhe |
|-------|---------|
| Tom | Directo, PT-PT, praticante — "fala como quem já fez" |
| Herói | O membro é o herói, a comunidade é o guia |
| PROIBIDO | "curso", "fácil", "automático", "revolucionário", "garantido" |
| PREFERIDO | "construir", "operacional", "solução real", "ferramenta", "pipeline" |
| CTA | Sempre acção concreta — "Experimenta", "Ver projecto", "Abre a ferramenta" |
| Tamanho | Descrição máxima de 2 linhas por item |

---

## 6. Requisitos técnicos

| Requisito | Detalhe |
|-----------|---------|
| Localização | Secção "Vitrine [IA]" no `comunidade/dashboard.html` |
| Layout | Cards com imagem/screenshot, título, descrição, CTA |
| Categorias | Tabs ou filtros: "Ferramentas" / "Ecossistema" / "Projectos Reais" |
| Responsivo | Mobile-first — cards empilham verticalmente |
| Design system | Obrigatório — fundo `#04040A`, glassmorphism, cores do sistema |
| Screenshots | Cada ferramenta precisa de screenshot ou thumbnail de qualidade |
| Links | Todos os links abrem em nova tab (`target="_blank"`) |
| Ordem | Curada manualmente — não por data de criação |
| Dados | Posts curados pelo admin vs posts de membros (coexistem) |

---

## 7. O que NÃO entra na vitrine (critérios de exclusão)

| Critério | Razão |
|----------|-------|
| Ferramenta não funcional | Prejudica credibilidade |
| Ferramenta sem URL pública | Sem acesso = sem valor |
| Protótipo incompleto | Mostra fragilidade em vez de força |
| Ferramenta interna/admin | Confunde o público-alvo |
| Projecto sem autorização do cliente | Questão legal |

---

## 8. Fases de implementação

| Fase | Acção | Agente | Prioridade |
|------|-------|--------|------------|
| 1 | Validar PRD | @po | Imediata |
| 2 | Verificar estado de cada URL (funciona? polida?) | @qa | Alta |
| 3 | Capturar screenshots de cada ferramenta | @dev | Alta |
| 4 | Criar copy estratégico por item | `/market-copy` | Alta |
| 5 | Implementar 3 secções na vitrine | @dev | Alta |
| 6 | Deploy do Diagrama Pipeline (se aprovado) | @devops | Média |
| 7 | QA final da vitrine completa | @qa | Alta |
| 8 | Push e deploy | @devops | Final |

---

## 9. Métricas de sucesso

| Métrica | Alvo | Como medir |
|---------|------|------------|
| Ferramentas activadas por membro novo | >= 1 nas primeiras 24h | Analytics de cliques nos CTAs |
| Tempo na secção vitrine | >= 45 segundos | Scroll depth tracking |
| Cliques em "Ver projecto" (case studies) | >= 20% dos visitantes | Event tracking |
| Reacções/comentários em items da vitrine | >= 5 por semana | Contagem Supabase |

---

## 10. Dependências e riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Ferramenta offline no momento da visita | Alto — quebra confiança | Health check periódico das URLs |
| Screenshots desactualizados | Médio — mostra versão antiga | Recapturar a cada actualização |
| Copy genérico | Alto — não diferencia | `/market-copy` com briefing do tom do Eurico |
| Nexus CRM incompleto | Médio — se publicado | Avaliar antes, excluir se necessário |

---

*PRD criado por Morgan (PM) | Input de Quinn (QA) | 22/03/2026*
*Próximo passo: Validação por @po (Pax)*
