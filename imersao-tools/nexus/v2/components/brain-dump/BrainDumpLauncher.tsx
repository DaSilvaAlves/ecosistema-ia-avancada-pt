'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BrainDumpModal,
  type BrainDumpAiState,
} from '@/components/brain-dump/BrainDumpModal';
import { parseBrainDump } from '@/lib/brain-dump/parser-cliente';
import { createBrainDump } from '@/lib/db/repos/brain-dumps';

/**
 * Nexus v2 — BrainDumpLauncher (Stories 5.6 + 5.7)
 *
 * Launcher client montado em `HomePage` (à imagem do `OnboardingModal`). Abre o
 * `BrainDumpModal` ao premir "B". Não existe infra de atalhos prévia no projecto —
 * esta story introduz o handler local, guardado.
 *
 * Guarda obrigatória (`front-end-spec-v2.md#1.4 [1]`, #1066): o "B" NÃO dispara
 * quando o foco está num `<input>`, `<textarea>` ou elemento `contenteditable`
 * (senão capturava o "b" durante escrita no chat), nem com modificadores
 * (Ctrl/Meta/Alt) — para não sequestrar atalhos do browser/OS.
 *
 * Story 5.7 (`[D-5.7-MECHANISM]` / `[D-5.7-PERSIST]` / AC3): o `onStructure` real
 * vive aqui — chama o client de inferência (`parseBrainDump` → `/api/anthropic/proxy`
 * JSON síncrono) e, em sucesso, persiste com `createBrainDump(status:'parsed')`.
 * Em falha, mostra erro PT-PT e NÃO persiste (sem dump `pending` órfão). O modal é
 * controlado por `aiState`. As transições `partially/fully_approved` são da 5.8.
 */

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

export function BrainDumpLauncher(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [aiState, setAiState] = useState<BrainDumpAiState>({ kind: 'idle' });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key.toLowerCase() !== 'b') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (isOpen) return;
      e.preventDefault();
      setIsOpen(true);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
    setAiState({ kind: 'idle' });
  }, []);

  // Pipeline AI real (AC3): parse via proxy → persistir em sucesso. Qualquer falha
  // (rede, `!res.ok`, JSON inválido, shape inválido) → estado `error`, zero writes
  // (`[D-5.7-PERSIST]`). O write de persistência também é defensivo: se o Dexie
  // falhar, o erro é PT-PT e nada fica meio-persistido.
  const handleStructure = useCallback(async (markdown: string): Promise<void> => {
    setAiState({ kind: 'loading' });
    try {
      const parsed = await parseBrainDump(markdown);
      await createBrainDump({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        bodyMarkdown: markdown,
        parsedOutput: parsed,
        status: 'parsed',
      });
      setAiState({ kind: 'parsed', parsed });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível estruturar o brain dump — tenta novamente.';
      setAiState({ kind: 'error', message });
    }
  }, []);

  return (
    <BrainDumpModal
      isOpen={isOpen}
      onClose={handleClose}
      onStructure={handleStructure}
      aiState={aiState}
    />
  );
}
