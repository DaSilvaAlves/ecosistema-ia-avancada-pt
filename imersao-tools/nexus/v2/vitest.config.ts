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
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      // Coverage threshold: 25% temporary baseline. Raise to 60%+ in Epic 1 (follow-up Story F.1)
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 25,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
