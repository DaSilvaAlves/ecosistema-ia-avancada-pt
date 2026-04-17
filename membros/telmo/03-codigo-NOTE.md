# `03-codigo/` — Sub-repositório Git separado

## Estado actual

A pasta `membros/telmo/03-codigo/` contém o projecto **FitCoach AI** com o seu próprio repositório Git e remote no GitHub:

| Campo | Valor |
|-------|-------|
| Remote | `https://github.com/DaSilvaAlves/fitcoach-ai.git` |
| Stack | React + Vite + Supabase + Stripe + Vercel |
| Tamanho (sem `node_modules/`) | ~656 KB |

## Por que está em `.gitignore` do repo principal

O sub-repo já tem o seu próprio histórico Git e remote. Adicioná-lo ao tracking do repo principal causaria:

- Conflito entre `.git` interno e tracking externo
- Duplicação de histórico
- Risco de `node_modules/` enormes ou `.env` com credenciais entrarem no repo principal

Por isso foi adicionado a `.gitignore` raiz: **fica fisicamente em `membros/telmo/03-codigo/` mas não é tracked pelo repo principal**.

## Decisão pendente para `@devops`

Avaliar e decidir uma de 3 opções:

1. **Submodule oficial** — `git submodule add https://github.com/DaSilvaAlves/fitcoach-ai.git membros/telmo/03-codigo`
   - Vantagem: histórico preservado e ligado
   - Desvantagem: requer `git submodule update --init` em clones

2. **Manter como está** — sub-repo independente, gitignored no principal
   - Vantagem: simples, funciona
   - Desvantagem: alguém que clone o repo principal não recebe o código do FitCoach

3. **Mover repo para fora** — `membros/telmo/03-codigo/` vira link/documentação apenas, código vive separado
   - Vantagem: total separação de concerns
   - Desvantagem: perde-se a ergonomia de ter tudo numa pasta

## Acesso ao código

Enquanto a decisão não é tomada, o código está localmente em:
```
membros/telmo/03-codigo/
```

E remotamente em:
```
https://github.com/DaSilvaAlves/fitcoach-ai
```
