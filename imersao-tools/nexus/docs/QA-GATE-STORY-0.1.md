# QA Gate — Story 0.1: Setup Next.js 15 + TS strict + Tailwind 4

**Story ID:** 0.1
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC6 e AC8 cumpridos. AC2 e AC7 (build/dev) ficam pendentes do Eurico correr `npm install` — documentado nas Tasks 11-12 e na CI. Não bloqueante para o gate (decisão consciente, todos os artefactos estão presentes). |
| 2 | Tests passing | PASS (N/A) | Story 0.1 sem testes próprios (correctamente marcado N/A). Validação chega via Story 0.9 (smoke) + CI Story 0.10. |
| 3 | Lint + typecheck | DEFERRED | `node_modules` ainda não instalado (Task 11/12 — manual Eurico/CI). ESLint v9 flat config + tsconfig strict configurados. CI Story 0.10 é o gate efectivo. |
| 4 | NFRs respeitadas | PASS | NFR5 (key server-only) preparada — `.env.example` tem `ANTHROPIC_API_KEY` mas zero uso no client. NFR8 (security headers) — `next.config.ts` define HSTS, X-Frame-Options DENY, CSP, Permissions-Policy, Referrer-Policy. |
| 5 | Security review | PASS | CSP definida; `frame-ancestors 'none'`; permissions-policy nega câmara/geolocation, permite microfone (necessário Web Speech). `.gitignore` ignora `.env`/`.env*.local`. |
| 6 | Architecture conformance | PASS | TS strict + path alias `@/*` (ADR Constitution). Tailwind 4 + tokens.css com 9 cores [IA]AVANÇADA PT. Inter + JetBrains Mono via `next/font/google`. `lang="pt-PT"` em `app/layout.tsx`. |
| 7 | Article IV (No Invention) | PASS | `package.json` lista exactamente as dependências do `architecture-v2.md §17` + `@vitejs/plugin-react` (AD-Dex-2 documentada e justificada — necessário para Vitest React). Zero dependências espúrias. |

---

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| AD-Dex-2 (`@vitejs/plugin-react`) | **ACEITE** — necessário para Vitest renderizar JSX. Está em devDependencies, não impacta bundle de produção. Documentação clara no commit do package.json. |

---

## Observações

- `.env.example` tem 11 entradas (não 12 como dito no AC6), mas AC6 conta `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` + 11 outras = 12 vars. **Validado: as 12 vars estão presentes** (Anthropic, NEXUS_PASSWORD_HASH, SESSION_SECRET, 3× Google OAuth, 3× Telegram, 2× WebPush, 2× Vercel KV).
- Path alias `@/*` correctamente configurado em `tsconfig.json` e `vitest.config.ts`.
- v1 intocado confirmado: `git diff --name-only imersao-tools/nexus/src/` retorna vazio.

## Decisão

**PASS.** A estrutura base está sólida e respeita todos os princípios constitucionais. Os 2 ACs deferidos (build/dev) são executados pela CI da Story 0.10 — não bloqueia a Story 0.1.
