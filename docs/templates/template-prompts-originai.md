# Prompts ORIGINAI — Prontos a Usar

---

## Prompt QA 1 — Análise de Rascunho

```
Analisa este rascunho de projecto. Identifica:
1. Pontos cegos — o que está a faltar?
2. Contradições — alguma ideia contradiz outra?
3. Perguntas — o que devia eu responder antes de avançar?
4. Sugestões de pesquisa — o que devia investigar?

Regras:
- Baseia-te APENAS no que escrevi
- Não inventes funcionalidades
- Sê directo e pragmático

[COLA O TEU RASCUNHO AQUI]
```

---

## Prompt QA 2 — Validação do Brief

```
Analisa este Brief e verifica:
1. Está claro o que quero construir?
2. O problema está bem definido?
3. O âmbito está delimitado (o que NÃO é)?
4. As referências fazem sentido?
5. Está pronto para ser detalhado — ou precisa de mais trabalho?

Sê pragmático. Não elogies — aponta o que falta.

[COLA O TEU BRIEF AQUI]
```

---

## Prompt de Detalhamento

```
Com base neste Brief aprovado, preciso de:

1. IDENTIFICAR: Lista todas as funcionalidades necessárias
2. AGRUPAR: Junta funcionalidades relacionadas em clusters
3. SEQUENCIAR: Ordena por dependências (o que precisa existir primeiro)

Para cada cluster, define:
- Input: o que entra
- Output: o que sai
- Critério de sucesso: como sei que está feito

Brief:
[COLA O TEU BRIEF AQUI]
```

---

## Prompt de Criação de Etapas

```
Transforma este detalhamento em etapas executáveis.

Regras para cada ETAPA:
- Explicável em 1 frase
- Tem critério de "pronto"
- Contém 3-7 tarefas
- Faz sentido sozinha

Regras para cada TAREFA:
- Começa com verbo (Criar, Configurar, Testar...)
- Executável por 1 pessoa
- Verificável: "fiz ou não fiz"
- Duração: minutos a poucas horas

Detalhamento:
[COLA O TEU DETALHAMENTO AQUI]
```

---

## Prompt Simples — Auditoria Frontend

```
Revisa a componentização e tokenização do sistema e verifica se
estão a seguir as melhores práticas de Tailwind e Shadcn.
```

---

## Prompt Avançado — Auditoria Profunda 2025

```
Act like um(a) Arquitecto(a) de Software Sénior + Tech Lead de
Frontend (React/Next.js), especialista em Design Systems,
Tailwind CSS (v3 e v4), shadcn/ui, performance (Core Web Vitals),
acessibilidade (WCAG 2.2) e DX (tooling/CI).

PREMISSA FUNDAMENTAL:
Tu JÁ TENS ACESSO AO CÓDIGO (repositório inteiro). NÃO peças
para colar ficheiros. Faz a análise explorando o repo.
Se não conseguires aceder, diz "Não tenho acesso ao código."
e pára. Não inventes nada.

OBJECTIVO:
Revisar e elevar o projecto para padrão profissional:
1. Componentização e reutilização (Design System)
2. Tokenização sólida (W3C Design Tokens, 3 camadas)
3. Tailwind CSS (v4 quando viável, OKLCH)
4. shadcn/ui (copy-paste ownership)
5. Performance (Core Web Vitals, bundle)
6. Acessibilidade (WCAG 2.2, APCA)
7. Tooling/DX (Prettier, ESLint, Husky, CI)

REGRAS ANTI-ALUCINAÇÃO:
- Trabalha SOMENTE com o que encontrares no repositório
- Nunca inventes ficheiros, rotas, APIs ou dependências
- Toda afirmação aponta: ficheiro + símbolo + localização
- Se não encontrares, diz "não encontrado no repo"

FORMATO DE SAÍDA:
1. Resumo Executivo (máximo 10 bullets)
2. Mapa do Projecto (stack, estrutura, configs)
3. Estado do Tailwind e Tema
4. Diagnóstico por Categoria (7 pilares)
5. Matriz de Priorização (impacto/esforço/risco)
6. Plano de Acção Incremental (quick wins + roadmap)
7. Checklist de Qualidade para Novas Features

Começa agora explorando o repositório.
```

---

*Método ORIGINAI — [IA]AVANÇADA PT*
*Prompts prontos para a imersão de 11-12 Abril 2026*
