import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Nexus v2 — Vitest config (Story 0.9)
 *
 * Environment jsdom para testes de componentes.
 * `fake-indexeddb/auto` carregado em `tests/setup.ts`.
 * Coverage gate 60% em `lib/agent/`, `lib/db/`, `lib/shared/`, `app/api/agent/` (architecture §5.4).
 */

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    // Story 9.11 — isolamento de testes full-suite (débito REC-8.6-ISOLAMENTO-TESTES).
    //
    // Causa-raiz confirmada (T1, 3/3 corridas): o único flake reproduzível não é
    // contaminação cross-test — o Vitest 2.x isola o registo de módulos e os globals
    // POR FICHEIRO (`pool: 'forks'` + `isolate: true`, defaults intactos), pelo que a
    // instância `server` (MSW), o `process.env` e o fake-indexeddb são recriados a cada
    // ficheiro. A falha é sempre um `Test timed out in 5000ms` no PRIMEIRO teste de
    // ficheiros cujo corpo dispara um `await import()` dinâmico de grafos de módulo
    // pesados (routes que puxam googleapis/openai/anthropic SDK). Sob paralelismo máximo
    // (o tempo de collect/transform agregado da suite chega a 170-460s), essa compilação
    // cold-start do primeiro import consome o orçamento de 5000ms do primeiro teste — que
    // por si só faz trabalho trivial (ex: sessão mockada → 401). Os ficheiros isolam
    // verdes porque, sozinhos, não competem por CPU.
    //
    // Correcção (AC2-b timing genuíno / AC3): elevar o orçamento de tempo por teste/hook.
    // NÃO se desactiva concorrência (pool/isolate/maxWorkers ficam nos defaults) — isso
    // seria mascarar o sintoma (AC3). NÃO se salta nenhum teste. 20000ms dá 4× de margem
    // para o cold-start sob carga e continua a apanhar hangs reais (um teste pendurado
    // falha à mesma, apenas mais tarde). Valor derivado da medição, não arbitrário.
    // Território bloqueador de not-tested-trailer-rules.md → evidência local (≥3 corridas)
    // registada na story; gate escalado a @architect (SF-1 do PO Gate).
    testTimeout: 20000,
    hookTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/agent/**',
        'lib/db/**',
        'lib/shared/**',
        'app/api/agent/**',
        // Story 1.9 — UI consumer
        'hooks/useAgentStream.ts',
        'components/chat/ToolCard.tsx',
        'components/chat/UndoToast.tsx',
        'components/chat/InputBox.tsx',
        // Story 1.9 Iter 2 — fixes em MessageList (Major #2 toolCallId) e
        // ChatPanel (Major #1 dedup, Minor #4 error handling)
        'components/chat/MessageList.tsx',
        'components/chat/ChatPanel.tsx',
        // Story 2.3 — Vista lista de tarefas (precedente Story 1.9 — apenas
        // adiciona paths à allowlist do report; thresholds globais inalterados).
        'app/(app)/tarefas/**',
        'components/tarefas/**',
        'lib/tarefas/**',
        'hooks/useTasks.ts',
        'hooks/useProjects.ts',
        'hooks/useDebounced.ts',
        // Story 2.8 — CRUD projectos (precedente Story 2.3 — apenas adiciona
        // paths à allowlist do report; thresholds globais e exclusões inalterados,
        // sem alteração comportamental do test runner).
        'app/(app)/projectos/**',
        'components/projectos/**',
        // Story 2.6 — Sistema de tags global (precedente Stories 2.3/2.5/2.8 —
        // adiciona paths novos à allowlist do report; thresholds globais
        // inalterados; sem alteração comportamental do test runner).
        'app/(app)/tags/**',
        'components/tags/**',
        'lib/tags/**',
        'hooks/useTags.ts',
        // Story 2.10 — Tools cérebro tarefas/projectos (precedente Stories
        // 2.3/2.6/2.8 — adiciona path à allowlist do report; thresholds
        // globais inalterados; sem alteração comportamental do test runner).
        'lib/agent/tools/**',
        // Story 3.3 — CRUD transações variáveis. Absorve o débito D-3.2-1
        // (EPIC-3 §8): o domínio `lib/financas/` (`formatCurrency.ts`,
        // `seedCategories.ts`, `currencyInput.ts`) passa a ser medido no
        // report de coverage. Precedente Stories 2.3/2.8/2.10 — apenas
        // adiciona path à allowlist do report; thresholds globais inalterados;
        // sem alteração comportamental do test runner.
        'lib/financas/**',
        // Story 4.2 — CRUD hábitos + UI partilhada (precedente Stories
        // 2.3/3.3 — adiciona paths à allowlist do report; thresholds globais
        // inalterados; sem alteração comportamental do test runner).
        'app/(app)/habitos/**',
        'components/habitos/**',
        'components/ui/FormField.tsx',
        'components/ui/TabStrip.tsx',
        'hooks/useHabits.ts',
        'hooks/useHabitLogs.ts',
        // Story 5.2 — Editor markdown (Tiptap 2). Precedente Stories 2.3/3.3/4.2
        // — adiciona paths à allowlist do report; thresholds globais inalterados;
        // sem alteração comportamental do test runner.
        'lib/editor/**',
        'components/ui/MarkdownEditor.tsx',
        // Story 5.9 — CRUD áreas/cadernos/notas (Conhecimento). Precedente
        // Stories 2.3/3.3/4.2/5.2 — adiciona paths à allowlist do report;
        // thresholds globais inalterados; sem alteração comportamental do test
        // runner.
        'app/(app)/knowledge/**',
        'components/conhecimento/**',
        'hooks/useKnowledgeAreas.ts',
        'hooks/useKnowledgeNotebooks.ts',
        'hooks/useKnowledgeNotes.ts',
        // Story 5.10 — Pesquisa full-text conhecimento (helper puro). Precedente
        // Stories 2.3/3.3/4.2/5.2/5.9 — adiciona path à allowlist do report;
        // thresholds globais inalterados; sem alteração comportamental do test
        // runner.
        'lib/conhecimento/**',
        // Story 6.1 — OAuth flow Google (Calendar scope). Precedente Stories
        // 2.3/3.3/4.2/5.2/5.9/5.10 — adiciona paths à allowlist do report;
        // thresholds globais inalterados; sem alteração comportamental do test
        // runner. Cobre o wrapper OAuth2, o seam token-store, o state assinado, as
        // routes start/callback/status e a UI de definições.
        'lib/google/**',
        'app/api/google/**',
        'app/(app)/settings/**',
        'components/settings/**',
        // Story 6.11 — setup bot Telegram (helper Bot API por `fetch` + webhook
        // Edge + setup Node). Precedente Stories 2.3/3.3/4.2/5.2/5.9/6.1 — adiciona
        // paths à allowlist do report; thresholds globais inalterados; sem
        // alteração comportamental do test runner.
        'lib/telegram/**',
        'app/api/telegram/**',
        // Story 9.1a — rotas proxy de inferência (o chat envia as mensagens ao
        // LLM por aqui, ADR-8/ADR-10). Estas 2 rotas já tinham testes parciais
        // mas nunca estiveram no allowlist do report — correcção de âmbito de
        // MEDIÇÃO (não de comportamento). Precedente Stories
        // 2.3/2.6/2.8/3.3/4.2/5.2/5.9/5.10/6.1/6.11 — thresholds globais
        // inalterados; `pool`/`isolate`/`testTimeout`/`hookTimeout` intactos
        // (D-9.11-TIMEOUT NÃO reaberta). Finanças NÃO entram aqui (vive em 9.1b).
        'app/api/anthropic/**',
        'app/api/openai/**',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      // Coverage threshold 60% (P1.1 — roadmap de conclusão, architecture §5.4).
      // Sobe o baseline temporário de 25%: a coverage global real está a ~91%, e
      // os 3 ficheiros `lib/shared` outrora a 0% (env/format/themes) passaram a ter
      // testes próprios. 60% dá margem confortável sem ser frágil a código novo.
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
