# HANDOFF — AIOS Compiler (Bug Investigation)
**Data:** 09/03/2026 | **Sessão:** Debug Pipeline
**Para continuar:** "Lê C:/Users/XPS/Documents/imersao-tools/HANDOFF-COMPILER.md e continua a corrigir o AIOS Compiler"

---

## ESTADO ATUAL — HONESTO

O pipeline gera código correto (FileViewer mostra 9 ficheiros reais), mas o deploy mostra página em branco. O problema está no que é empurrado para o GitHub.

### O que funciona ✅
- Prompt Optimizer → gera prompt excelente (642 palavras, glassmorphism, PT-PT)
- AIOS Compiler → FileViewer mostra 9 ficheiros com código real
- GitHub push → repo criado com nome único
- Vercel deploy → URL pública funciona
- AI Velocity → funciona perfeitamente com qualquer repo válido

### O que falha ❌
- Do repo `teste13-mmij1i4u` (último teste), só chegaram ao GitHub:
  ```
  src/App.tsx      (2438 bytes — código correto com imports)
  src/main.tsx     (209 bytes — scaffold protegido)
  ```
- Ficheiros em FALTA no GitHub (existiam no FileViewer):
  ```
  src/styles/theme.css              ← NÃO chegou
  src/features/feature-1/index.tsx  ← NÃO chegou
  src/features/feature-2/index.tsx  ← NÃO chegou
  src/features/feature-3/index.tsx  ← NÃO chegou
  src/components/ui/Button.tsx      ← NÃO chegou
  src/types/index.ts                ← NÃO chegou
  src/index.ts                      ← NÃO chegou
  ```
- Resultado: App.tsx importa ficheiros que não existem → página branca

---

## BUGS CORRIGIDOS NESTA SESSÃO (já aplicados)

| # | Ficheiro | Linha | Fix |
|---|---------|-------|-----|
| 1 | `App.tsx` | 102 | `rawOutput = await generateWithGroq(...)` — return value ignorado |
| 2 | `GeminiService.ts` | 184 | Regex greedy `[\s\S]*` em vez de lazy `[\s\S]*?` |
| 3 | `GeminiService.ts` | 186 | Strip inner code fences antes de embrulhar |
| 4 | `GeminiService.ts` | 189 | Fallback: procura code fence se markers falharem |
| 5 | `GeminiService.ts` | 189 | Removida linha que apagava local imports válidos do Gemini |
| 6 | `GeminiService.ts` | GROQ_MARKER_SYSTEM | Atualizado para gerar app completo (não skeleton) |
| 7 | `GeminiService.ts` | SYSTEM_INSTRUCTION | Atualizado para Gemini gerar código completo |

---

## BUG ATUAL — NÃO RESOLVIDO

**Diagnóstico:** Os 9 ficheiros aparecem no FileViewer mas só App.tsx chega ao GitHub.

**Hipótese mais provável:** `parseGeneratedFiles` está a parsear os 9 ficheiros corretamente, mas o loop de push em `GitHubService.ts:pushAllFiles` falha a meio silenciosamente, ou os ficheiros são filtrados/normalizados de forma errada.

**Próximo passo de debug:**
1. Abrir `GitHubService.ts` função `pushAllFiles` (linha ~236)
2. Verificar se o `safeFiles` array contém os 9 ficheiros antes do push
3. Verificar se `pushFileToRepo` falha para ficheiros com paths `src/features/feature-1/index.tsx`
4. O path com subpastas (`feature-1/`) pode estar a causar 404 na GitHub API (a API do GitHub requer que o parent directory exista — mas em Git isso é automático via blob/tree, não deveria ser problema)

**Ficheiros a investigar:**
```
C:/Users/XPS/Documents/imersao-build/packages/aios-compiler/src/features/github-pusher/GitHubService.ts
  → função pushAllFiles (~linha 236)
  → função pushFileToRepo (~linha 100-140)
  → verificar se há try/catch que engole erros silenciosamente
```

---

## ARQUITECTURA DO COMPILER (para contexto)

```
App.tsx (wizard 5 passos)
  └── Passo 3: generateWithGemini() ou generateWithGroq()
        └── GeminiService.ts → retorna raw LLM output
  └── preProcessCode(finalOutput) → fix TypeScript errors
  └── parseGeneratedFiles(finalOutput) → extrai ficheiros individuais
  └── sortFiles() → ordena CSS → types → components → App → main

  └── Passo 5: pushAllFiles()
        └── GitHubService.ts
              1. Cria repo GitHub com nome único (Date.now())
              2. Push README.md (init commit)
              3. Push scaffold (package.json, vite.config, index.html, etc.)
              4. Push safeFiles (ficheiros gerados pelo LLM, exceto PROTECTED)
              5. Retorna htmlUrl → abre Vercel import
```

**PROTECTED_FILES (nunca pushados do LLM, vêm sempre do scaffold):**
```
src/main.tsx, package.json, vite.config.ts, tsconfig.json,
tsconfig.app.json, tsconfig.node.json, vercel.json, index.html
```

---

## STRATEGY PARA PRÓXIMA SESSÃO

### Opção A — Debug cirúrgico (recomendado)
1. Adicionar `console.log` ao `pushAllFiles` para ver quais ficheiros estão em `safeFiles`
2. Ver no browser console se há erros durante o push
3. Identificar exatamente onde os ficheiros desaparecem

### Opção B — Abordagem alternativa
Usar o **Gemini em vez de Groq** para a geração principal:
- Gemini gera multi-file naturalmente
- Groq fica só para validação (já funciona assim no código)
- Testar com chave Gemini gratuita

### Opção C — Simplificar para garantir demo
Forçar geração single-file (tudo em App.tsx) mas com código completo:
- Garantia de funcionar sempre
- Menos features mas 100% funcional
- Para a imersão pode ser suficiente

---

## COMANDO PARA CONTINUAR

```
Lê C:/Users/XPS/Documents/imersao-tools/HANDOFF-COMPILER.md
e continua a corrigir o AIOS Compiler. O problema é que os ficheiros
gerados (9 no total) só chegam parcialmente ao GitHub — apenas App.tsx
é pushado, os outros (theme.css, features, components) desaparecem.
Começa por investigar pushAllFiles em GitHubService.ts.
```

---

## CONTEXTO DO PROJETO
**MASTER.md completo:** `C:/Users/XPS/Documents/imersao-tools/MASTER.md`

*Gerado em 09/03/2026*
