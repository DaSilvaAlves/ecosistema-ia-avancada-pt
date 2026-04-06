# HANDOFF — Pagina todolist.html: Guia da Imersao + 5 Templates

> Data: 04/04/2026
> Autor: Uma (UX Design Expert) + Eurico
> Estado: PRONTO PARA EXECUCAO
> Terminal: NOVO (nao depende de sessoes anteriores)
> Prioridade: CRITICA — a imersao e dia 12/04/2026

---

## ERROS A CORRIGIR DO TRABALHO ANTERIOR

| Erro | Correccao |
|------|-----------|
| "presencial" | A imersao e 100% ONLINE via Google Meet. NUNCA presencial |
| To-Do List aparece abaixo do guia | Templates devem aparecer PRIMEIRO quando a pagina abre |
| Guia pouco detalhado | Usar toda a informacao dos FASE-*.md (hora a hora, tim tim por tim tim) |

---

## O que e esta pagina

`todolist.html` e a pagina completa da imersao — o link que o Eurico envia aos membros para se prepararem. Contem TUDO:

1. **5 templates To-Do List** (primeiro plano, topo da pagina)
2. **Guia completo da imersao** (como funciona, hora a hora)
3. **Checklist de contas** (passo a passo detalhado para cada conta)
4. **O que levar no dia**

### O que NAO e

- NAO e uma pagina de vendas
- NAO precisa de autenticacao
- NAO depende do dashboard — funciona standalone como link directo

---

## Estrutura da pagina (ORDEM OBRIGATORIA)

### 1. HEADER + HERO (topo)
- Logo [IA]AVANCADA PT
- Titulo: "Cria a tua To-Do List"
- Subtitulo: "Escolhe um estilo. 10 segundos. Zero instalacao."

### 2. GRID DOS 5 TEMPLATES (PRIMEIRO PLANO)
- Os 5 cards de templates To-Do List (Cyberpunk, Aurora, Holographic, Neomorphic, Brutalist)
- Cada card com preview visual, nome, descricao, botao "Experimentar →"
- Clique abre o template numa pagina separada (todolist-{nome}.html)
- Este bloco DEVE ser a primeira coisa visivel quando a pagina abre

### 3. SEPARADOR

### 4. GUIA DETALHADO DA IMERSAO
- Label: "COMO FUNCIONA"
- Titulo: "O fim-de-semana, bloco a bloco"
- **A imersao e ONLINE** — via Google Meet, maximo 12 participantes
- Cards detalhados para CADA bloco (ver seccao "Schedule detalhado" abaixo)

### 5. CHECKLIST DE CONTAS
- Label: "PREPARACAO OBRIGATORIA"
- Titulo: "Cria estas contas antes do dia"
- 5 contas com passo a passo detalhado (ver seccao "Checklist" abaixo)
- Checkbox interactiva com localStorage
- Mensagem verde quando tudo esta feito

### 6. O QUE TER PRONTO NO DIA
- Portatil + carregador
- Internet estavel (ha hotspot 4G de backup)
- Um problema real (o projecto que quer construir)
- Contas criadas
- API Key da Groq guardada
- WhatsApp activo

### 7. FOOTER
- Branding [IA]AVANCADA PT (igual ao que ja existe)

---

## Schedule detalhado (extraido dos PRDs — FASE-0 a FASE-7)

### IMERSAO E 100% ONLINE

- Data prevista: 12-13 de Abril de 2026 (sabado + domingo)
- Maximo 12 participantes
- Via Google Meet (todas as sessoes)
- Suporte via WhatsApp durante todo o fim-de-semana

### SABADO

#### 10:00 — 11:00 | Abertura + Perfil (FASE 1)

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 10:00 | 5 min | Boas-vindas — "Nao e um curso. E uma imersao." |
| 10:05 | 20 min | Palestra "Realidade Real" — impacto da IA, os 4 niveis, porque nivel 4 |
| 10:25 | 15 min | Student Profiler — todos fazem um quiz rapido (10 perguntas → arquetipo) |
| 10:40 | 10 min | Eurico comenta os arquetipos — "quem e quem" |
| 10:50 | 10 min | Cada participante diz em 1 frase: "a minha dor e..." |

**Resultado:** Cada participante sabe o seu arquetipo e articulou o seu problema real.

#### 11:00 — 13:00 | Exercicio guiado — primeiro projecto (FASE 2)

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 11:00 | 5 min | "Agora vamos construir. Todos juntos." |
| 11:05 | 15 min | Escolher estilo visual — design tokens (Starter Builder) |
| 11:20 | 10 min | Gerar prompt optimizado (Prompt Optimizer) |
| 11:30 | 20 min | IA gera o codigo em tempo real (AIOS Compiler) |
| 11:50 | 10 min | Deploy — "a tua URL publica" (GitHub + Vercel) |
| 12:00 | 10 min | Celebracao — todos partilham URLs no WhatsApp |
| 12:10 | 50 min | Explorar, personalizar, perguntas |

**Resultado:** Cada participante tem uma To-Do List funcional deployada numa URL publica. Primeiro "wow moment".

#### 13:00 — 15:00 | Pausa

#### 15:00 — 19:00 | Mao na massa — projecto real (FASE 3)

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 15:00 | 15 min | Briefing individual — "qual e a tua dor?" (1:1 com Eurico) |
| 15:15 | 30 min | Claude Code gera briefing personalizado no terminal |
| 15:45 | 15 min | Validar: stack, features, design — "isto e o que queres?" |
| 16:00 | 120 min | Construcao — Claude Code gera codigo completo (React 19 + Vite) |
| 18:00 | 30 min | Primeiro deploy — URL publica |
| 18:30 | 30 min | Iteracao — ajustar, corrigir, melhorar |

O participante descreve o seu problema → Claude Code faz 3-5 perguntas → gera o projecto completo → deploy.

Exemplos de projectos ja construidos: sistema de reservas para restaurante, portfolio profissional, loja online, dashboard de gestao, landing page com formulario, sistema de marcacoes.

**Regra:** O participante e o heroi. O Eurico e o guia. Claude Code e a ferramenta. O participante CONSTROI — nunca e o Eurico a fazer por ele.

**Resultado:** Cada participante tem o SEU projecto real deployed e funcional.

#### 22:00 — 23:30 | Ponto Socorro noturno (FASE 4)

| Momento | Duracao | O que acontece |
|---------|---------|----------------|
| Check-in | 10 min | "Quem esta? Qual e o bloqueio?" |
| Suporte 1:1 | 60 min | Eurico resolve com cada participante (screen share) |
| Wrap-up | 20 min | "Para amanha: foco em [X]" |

- Via Google Meet
- So para quem precisa (voluntario)
- Bloqueios comuns: problemas de deploy, bugs no codigo, nao saber que features adicionar, ideia que mudou

**Resultado:** Ninguem chega ao domingo sem projecto funcional.

### DOMINGO

#### 10:00 — 13:00 | Refinamento + features (FASE 5)

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 10:00 | 15 min | Check-in — "Onde ficaste? O que falta?" |
| 10:15 | 45 min | Bloco 1: Design — melhorar visual, responsivo, dark mode, animacoes |
| 11:00 | 60 min | Bloco 2: Features — formularios, filtros, checkout, integracoes |
| 12:00 | 30 min | Bloco 3: Conteudo — substituir dados de teste por conteudo real |
| 12:30 | 30 min | Deploy intermedio — verificar como esta |

**Resultado:** O projecto passa de "funciona" para "impressiona".

#### 13:00 — 15:00 | Pausa

#### 15:00 — 16:00 | Deploy final (FASE 6)

| Hora | Duracao | O que acontece |
|------|---------|----------------|
| 15:00 | 15 min | Ultimos ajustes |
| 15:15 | 15 min | Deploy final — git push + Vercel |
| 15:30 | 15 min | Teste cruzado — cada participante testa o projecto de outro |
| 15:45 | 15 min | Partilha de URLs — todos no WhatsApp |

Checklist de deploy: conteudo real (sem lorem ipsum), responsivo, links funcionam, deploy online, URL partilhada.

**Resultado:** URL final publica, projecto completo.

#### 22:00 | Fecho + celebracao (FASE 7)

| Momento | Duracao | O que acontece |
|---------|---------|----------------|
| Abertura | 5 min | "Ha 48 horas, ninguem tinha nada. Agora..." |
| Showcase | 40-60 min | Cada participante mostra o SEU projecto (3-5 min cada) |
| Feedback | 10 min | "O que aprendeste? O que mais te surpreendeu?" |
| Proximos passos | 10 min | Comunidade [IA]AVANCADA PT, formacoes, proximo desafio |
| Fecho | 5 min | "Isto e so o comeco." |

- Via Google Meet
- Cada participante apresenta: URL + contexto da dor + demo ao vivo + o que vai fazer a seguir
- Ninguem fica de fora — se o projecto nao ficou perfeito, o ponto e que EXISTE

**Resultado:** Showcase completo, entrada na comunidade, continuidade.

---

## Checklist de contas — passo a passo detalhado

### 1. GitHub (github.com)

Onde o codigo vai viver.

1. Abrir github.com/signup
2. Preencher: email, password, username (escolher algo profissional — vai aparecer na URL)
3. Verificar o email — o GitHub envia um codigo de confirmacao
4. Escolher o plano gratuito (Free) — e tudo o que precisa
5. Pronto — o codigo vai ser publicado automaticamente aqui durante a imersao

### 2. Vercel (vercel.com)

Onde o projecto fica online.

1. Abrir vercel.com/signup
2. Clicar em "Continue with GitHub" — usa a conta GitHub que acabou de criar
3. Autorizar o acesso — o Vercel precisa de ler os repositorios para fazer deploy
4. Pronto — quando fizerem deploy, o projecto recebe uma URL publica automatica (tipo teu-projecto.vercel.app)

### 3. Groq API (console.groq.com)

A IA que gera o codigo. 100% gratis, sem cartao de credito.

1. Abrir console.groq.com
2. Registar com email ou conta Google
3. No painel, ir a "API Keys" no menu lateral
4. Clicar "Create API Key", dar um nome (ex: "imersao") e copiar a chave
5. Guardar a chave num ficheiro de texto ou nas notas do telemovel — NAO perder, NAO partilhar
6. Esta chave e o que permite ao compilador gerar codigo. Sem ela, nao funciona

### 4. Node.js (nodejs.org)

O motor que corre tudo.

1. Abrir nodejs.org
2. Descarregar a versao LTS (o botao grande verde) — e a versao estavel
3. Instalar com as opcoes padrao — next, next, next, finish
4. Para verificar, abrir o terminal (CMD no Windows, Terminal no Mac) e escrever: node -v
5. Se aparecer um numero tipo v22.x.x, esta instalado. Se der erro, reiniciar o computador e tentar outra vez

### 5. Git (git-scm.com)

Controlo de versoes.

1. Abrir git-scm.com/downloads
2. Descarregar a versao para o sistema (Windows / Mac)
3. Instalar com as opcoes padrao — nao mudar nada, clicar sempre "Next"
4. Para verificar, abrir o terminal e escrever: git -v
5. Se aparecer git version 2.x.x, esta pronto

---

## Ficheiros existentes (NAO RECRIAR)

Os 5 templates ja existem e estao deployed em producao. NAO tocar neles:

```
imersao-tools/comunidade/todolist-cyberpunk.html    (1119 linhas)
imersao-tools/comunidade/todolist-aurora.html       (1211 linhas)
imersao-tools/comunidade/todolist-holographic.html  (982 linhas)
imersao-tools/comunidade/todolist-neomorphic.html   (1095 linhas)
imersao-tools/comunidade/todolist-brutalist.html    (974 linhas)
```

URLs em producao:
```
comunidade.avancada.expressia.pt/todolist-cyberpunk.html
comunidade.avancada.expressia.pt/todolist-aurora.html
comunidade.avancada.expressia.pt/todolist-holographic.html
comunidade.avancada.expressia.pt/todolist-neomorphic.html
comunidade.avancada.expressia.pt/todolist-brutalist.html
```

---

## Ficheiro a REESCREVER

```
imersao-tools/comunidade/todolist.html
```

Este ficheiro ja existe mas precisa de ser REESCRITO com:
1. Templates To-Do List NO TOPO (primeira coisa visivel)
2. Guia da imersao POR BAIXO (com toda a info detalhada desta handoff)
3. A imersao e ONLINE — NUNCA presencial
4. Checklist de contas com passo a passo
5. O que ter pronto no dia

---

## Design system obrigatorio

| Regra | Detalhe |
|-------|---------|
| Fundo | #04040A — SEMPRE escuro |
| Glassmorphism | rgba(255,255,255,0.03) + border rgba(255,255,255,0.08) |
| Cyan | #00F5FF — accao primaria |
| Gold | #FFB800 — premium, destaques |
| Purple | #9D00FF — tecnologia |
| Magenta | #FF006E — alertas |
| Lime | #39FF14 — sucesso |
| Font body | Inter |
| Font tech | JetBrains Mono |
| Zero dependencias externas | Excepto Google Fonts |
| Ficheiro unico | CSS em <style>, JS em <script> |

---

## Dashboard — estado actual

O dashboard ja foi alterado nesta sessao:
- Top nav: "Ferramentas" → "Imersao"
- Sidebar: "Ferramentas Pipeline" → "Imersao" com "Guia da Imersao" + "To-Do List"
- View ferramentas: redesenhada com guia da imersao (mas incompleto e com erros)

O proximo terminal pode precisar de ajustar o dashboard tambem, dependendo do resultado.

---

## Instrucao para o proximo terminal

```
Le o handoff em imersao-tools/docs/HANDOFF-TODOLIST-GUIA-IMERSAO-V2.md e executa.
```

---

## Fontes de verdade (PRDs)

| Documento | Path | Conteudo |
|-----------|------|----------|
| PRD Mapa Imersao | imersao-tools/docs/PRD-MAPA-IMERSAO.md | Visao geral + indice de fases |
| Fase 0 | imersao-tools/docs/shards/FASE-0-PRE-IMERSAO.md | Setup dos alunos |
| Fase 1 | imersao-tools/docs/shards/FASE-1-ABERTURA.md | Abertura + perfil |
| Fase 2 | imersao-tools/docs/shards/FASE-2-EXERCICIO-GUIADO.md | Exercicio guiado |
| Fase 3 | imersao-tools/docs/shards/FASE-3-PROJECTO-REAL.md | Projecto real |
| Fase 4 | imersao-tools/docs/shards/FASE-4-PONTO-SOCORRO-1.md | Ponto socorro |
| Fase 5 | imersao-tools/docs/shards/FASE-5-REFINAMENTO.md | Refinamento |
| Fase 6 | imersao-tools/docs/shards/FASE-6-DEPLOY-FINAL.md | Deploy final |
| Fase 7 | imersao-tools/docs/shards/FASE-7-FECHO.md | Fecho + celebracao |
| Design system | .claude/rules/design-system-ia-avancada.md | Cores, tipografia, componentes |

---

*Handoff criado em 04/04/2026. Versao 2 — corrige erros da versao anterior.*
