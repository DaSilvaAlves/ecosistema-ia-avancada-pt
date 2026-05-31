'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — DevDbExposer (Story 1.12 — F2, ADR-9)
 *
 * Expõe o singleton Dexie (`@/lib/db/client`) em `window.__nexusDB` APENAS em
 * dev/staging (`process.env.NODE_ENV !== 'production'`), para a suite E2E de
 * regressão (Story 1.10/1.12) poder:
 *   1. SEMEAR estado de domínio determinístico (`seedRegressionDb`) antes de
 *      cada teste — as tools reais (Epic 2/3) têm pré-condições contra o Dexie
 *      (categoria/conta/cartão/tarefa existentes) que num Dexie vazio fariam
 *      `criar_financa_variavel`/`completar_tarefa`/etc. lançar.
 *   2. INSPECCIONAR o efeito de domínio (`dexie-eval.ts`) após cada run — prova
 *      que a execução client-side real (ADR-9) escreveu mesmo em Dexie, não só
 *      que a UI renderizou um ToolCard `success`.
 *
 * Decisão Architect Gate Story 1.12 §3-F2 + §4.4: a exposição é OBRIGATÓRIA nesta
 * story (não opcional) — a re-rota ao proxy torna a verificação só-UI frágil, e o
 * assert E2E `lastStatus === 'reverted'` do undo (AC2) depende deste singleton.
 *
 * Edge-safety (ADR-1): componente `'use client'` — a atribuição corre apenas no
 * browser, nunca em código `runtime='edge'`. O guard `NODE_ENV !== 'production'`
 * garante zero superfície em produção (o bundler elimina o ramo morto).
 *
 * NFR11: `window.__nexusDB` expõe o Dexie (dados de domínio do utilizador único
 * `eurico`), nunca prompts em claro nem segredos — coerente com a constraint C1
 * single-user da arquitectura.
 */
export function DevDbExposer(): null {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    (window as unknown as { __nexusDB?: typeof db }).__nexusDB = db;
  }, []);
  return null;
}
