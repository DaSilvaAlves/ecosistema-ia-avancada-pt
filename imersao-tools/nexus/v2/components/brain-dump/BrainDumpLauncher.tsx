'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrainDumpModal,
  type BrainDumpAiState,
} from '@/components/brain-dump/BrainDumpModal';
import type { ApprovedItemPayload } from '@/components/brain-dump/BrainDumpApprovalView';
import { parseBrainDump } from '@/lib/brain-dump/parser-cliente';
import { createBrainDump, getBrainDump } from '@/lib/db/repos/brain-dumps';
import {
  BRAIN_DUMP_BUCKETS,
  BrainDumpParsedSchema,
} from '@/lib/brain-dump/ai-parser';
import {
  persistApprovedItems,
  type ApprovedItem,
} from '@/lib/brain-dump/approval-persistencia';

/**
 * Nexus v2 — BrainDumpLauncher (Stories 5.6 + 5.7 + 5.8)
 *
 * Launcher client montado em `HomePage`. Abre o `BrainDumpModal` ao premir "B".
 *
 * Story 5.7 (`[D-5.7-PERSIST]`): o `onStructure` chama o client de inferência
 * (`parseBrainDump` → `/api/anthropic/proxy`) e, em sucesso, persiste com
 * `createBrainDump(status:'parsed')`. Em falha, mostra erro PT-PT e NÃO persiste.
 *
 * Story 5.8 (`[D-5.8-*]`): o launcher é dono da máquina de estados do approval flow.
 * Após o parse+persist bem-sucedidos, transiciona automaticamente para `approving`
 * fazendo `getBrainDump(id)` + `BrainDumpParsedSchema.safeParse` (re-leitura e
 * re-validação obrigatórias — `[D-5.8-REREAD]`, AC1). Ao guardar, orquestra
 * `persistApprovedItems` (transacção Dexie atómica — `[D-5.8-BATCH]`) e, em sucesso,
 * mostra toast Lime + fecha o modal (AC5; `[D-5.8-CHAT-RETRO]` DIFERIDA — sem escrita
 * em `chat_messages`). Em falha → estado `approvalError` (zero entidades, status
 * inalterado), com "Tentar novamente".
 */

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

/** Soma dos itens propostos nos 4 buckets (denominador da transição de status). */
function countProposed(parsed: import('@/lib/brain-dump/ai-parser').BrainDumpParsed): number {
  return BRAIN_DUMP_BUCKETS.reduce((sum, bucket) => sum + parsed[bucket].length, 0);
}

export function BrainDumpLauncher(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [aiState, setAiState] = useState<BrainDumpAiState>({ kind: 'idle' });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espelho do `aiState` num ref — `handleSave` (useCallback `[]`) lê o id/parsed
  // actuais sem depender do closure stale e sem re-criar o callback a cada render.
  const aiStateRef = useRef<BrainDumpAiState>(aiState);
  aiStateRef.current = aiState;

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

  // Auto-dismiss do toast Lime "N itens guardados" após 4s (padrão da page /diario).
  useEffect(() => {
    if (toast === null) return;
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
    setAiState({ kind: 'idle' });
  }, []);

  // Pipeline AI (5.7) + transição para approving (5.8). Re-lê e re-valida o
  // `parsedOutput` de `db.brain_dumps` (AC1 — `[D-5.8-REREAD]`): nunca confia no
  // objecto em memória; o id é capturado (corrige o descarte da 5.7) e usado em
  // `getBrainDump`/`updateBrainDump`.
  const handleStructure = useCallback(async (markdown: string): Promise<void> => {
    setAiState({ kind: 'loading' });
    try {
      const parsed = await parseBrainDump(markdown);
      const id = crypto.randomUUID();
      await createBrainDump({
        id,
        createdAt: Date.now(),
        bodyMarkdown: markdown,
        parsedOutput: parsed,
        status: 'parsed',
      });

      // Re-leitura + re-validação (AC1 — `[D-5.8-REREAD]`, `internal-state-contract-gate`
      // eixo c): o `parsedOutput` é `unknown` na camada db; valida-se sempre.
      const fresh = await getBrainDump(id);
      if (fresh === undefined) {
        setAiState({
          kind: 'error',
          message: 'O brain dump não foi encontrado após a estruturação.',
        });
        return;
      }
      const revalidated = BrainDumpParsedSchema.safeParse(fresh.parsedOutput);
      if (!revalidated.success) {
        setAiState({
          kind: 'error',
          message:
            'Não foi possível carregar os itens propostos — os dados estão corrompidos.',
        });
        return;
      }
      setAiState({ kind: 'approving', id, parsed: revalidated.data });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível estruturar o brain dump — tenta novamente.';
      setAiState({ kind: 'error', message });
    }
  }, []);

  // Orquestração de persistência (AC3/AC4/AC5). Transacção atómica via
  // `persistApprovedItems`; em sucesso, toast + fecho; em falha, `approvalError` com
  // o `parsed` preservado para "Tentar novamente" (zero entidades — rollback).
  const handleSave = useCallback(
    async (items: ApprovedItemPayload[]): Promise<void> => {
      // Lê o estado actual do ref (não do closure stale). Só `approving`/`approvalError`
      // têm id/parsed para guardar.
      const current = aiStateRef.current;
      if (current.kind !== 'approving' && current.kind !== 'approvalError') return;
      const { id, parsed } = current;
      setAiState({ kind: 'saving', id, parsed });

      const approved: ApprovedItem[] = items.map((it) => ({
        bucket: it.bucket,
        texto: it.texto,
      }));

      try {
        const count = await persistApprovedItems(
          approved,
          id,
          countProposed(parsed),
        );
        setToast(`${count} ${count === 1 ? 'item guardado' : 'itens guardados'}`);
        // Fecha o modal e repõe `idle` — reabrir via "B" começa do zero (sem estado
        // `saved` stale). O toast vive fora do modal (sinal de sucesso persistente 4s).
        setIsOpen(false);
        setAiState({ kind: 'idle' });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível guardar os itens — tenta novamente.';
        setAiState({ kind: 'approvalError', id, parsed, message });
      }
    },
    [],
  );

  return (
    <>
      <BrainDumpModal
        isOpen={isOpen}
        onClose={handleClose}
        onStructure={handleStructure}
        aiState={aiState}
        onSave={handleSave}
      />
      {toast !== null && (
        <div
          role="status"
          aria-live="polite"
          data-testid="brain-dump-toast"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            background: 'rgba(57, 255, 20, 0.12)',
            border: '1px solid rgba(57, 255, 20, 0.4)',
            borderRadius: 8,
            padding: '0.75rem 1.25rem',
            color: '#39FF14',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: '0 0 24px rgba(57, 255, 20, 0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
