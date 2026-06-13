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
