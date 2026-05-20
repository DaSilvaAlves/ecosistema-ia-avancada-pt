'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTags } from '@/hooks/useTags';
import {
  createTag,
  updateTag,
  deleteTag,
  countTasksForTag,
} from '@/lib/db/repos/tags';
import { TagsHeader } from '@/components/tags/TagsHeader';
import { TagsGrid } from '@/components/tags/TagsGrid';
import { TagFormModal } from '@/components/tags/TagFormModal';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — Página /tags (Story 2.6 — Sistema de tags global / FR14)
 *
 * Rota: /tags — App Router page com 'use client' (Dexie via useLiveQuery
 * exige client component).
 *
 * Composição:
 *   1. <TagsHeader> — título "Tags" + input pesquisa + botão "+ Nova tag"
 *      + botão "Esc · Voltar"
 *   2. <TagsGrid> — grid responsivo de <TagCard>; skeleton loading;
 *      empty states (zero-total vs filter-vazio)
 *   3. <TagFormModal> (condicional) — create/edit mode com focus trap WAI-ARIA
 *
 * APIs consumidas: useTags (Story 2.6), createTag, updateTag, deleteTag
 * (com cascata atómica Story 2.6), countTasksForTag (Story 2.6).
 *
 * Decisões ratificadas pela @po (A1-A12):
 *   - A1: rota dedicada /tags (não modal/tab)
 *   - A2: layout grid de cards
 *   - A3: TagFormModal reutiliza padrão ProjectFormModal 100%
 *   - A4: paleta restrita 7 cores design system
 *   - A5: cascata atómica em deleteTag (já no repo)
 *   - A6: window.confirm PT-PT pré-delete com contagem
 *   - A8: contagem inline aqui via useLiveQuery + Promise.all
 *   - A10: pesquisa client-side via useMemo
 *   - A12: tagsLookup NÃO consolidado no hook — page só precisa de Tag[]
 */

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; tag: Tag };

export default function TagsPage(): React.ReactElement {
  const router = useRouter();
  const tags = useTags();

  // A8: Contagem de uso por tag — calculada inline via useLiveQuery + Promise.all.
  // Re-corre quando `tags` muda (Dexie liveQuery reactivo a inserts/updates/deletes).
  const taskCountsMap = useLiveQuery(async () => {
    if (tags === undefined || tags.length === 0) return {} as Record<string, number>;
    const pairs = await Promise.all(
      tags.map(async (t) => [t.id, await countTasksForTag(t.id)] as const),
    );
    return Object.fromEntries(pairs);
  }, [tags]);

  const taskCounts: Record<string, number> = taskCountsMap ?? {};

  // A10: Pesquisa client-side (case-insensitive, sobre `name`)
  const [search, setSearch] = useState('');

  const visibleTags = useMemo<Tag[] | undefined>(() => {
    if (tags === undefined) return undefined;
    const q = search.trim().toLowerCase();
    if (q === '') return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  // Estado do modal
  const [modalState, setModalState] = useState<ModalState>({ kind: 'closed' });

  // Toast primitivo PT-PT 4s (padrão Stories 2.4/2.5/2.8)
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (toast === null) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Escape global → router.back (precedente tarefas/page.tsx:113-120).
  // Suprimido quando o modal está aberto (modal trata o seu próprio Escape).
  useEffect(() => {
    if (modalState.kind !== 'closed') return;
    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, modalState.kind]);

  // ─── Handlers ──────────────────────────────────────────────────────

  function handleOpenCreate(): void {
    setModalState({ kind: 'create' });
  }

  function handleOpenEdit(tag: Tag): void {
    setModalState({ kind: 'edit', tag });
  }

  function handleCloseModal(): void {
    setModalState({ kind: 'closed' });
  }

  async function handleSubmit(input: Tag): Promise<void> {
    try {
      if (modalState.kind === 'create') {
        await createTag(input);
      } else if (modalState.kind === 'edit') {
        await updateTag(modalState.tag.id, { name: input.name, color: input.color });
      }
    } catch (err) {
      // Erro do repo (ex: duplicado case-insensitive) — toast PT-PT
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível guardar a tag. ${message}`);
      throw err; // re-throw: modal apanha em catch interno e NÃO chama onClose
    }
  }

  async function handleDelete(tag: Tag): Promise<void> {
    // A6: confirm PT-PT com contagem prévia (cascata-aware)
    let count = 0;
    try {
      count = await countTasksForTag(tag.id);
    } catch {
      // Defensivo — se count falhar, continua com 0
    }
    const confirmed = window.confirm(
      `Eliminar a tag «${tag.name}»? Será removida de ${count} ${count === 1 ? 'tarefa vinculada' : 'tarefas vinculadas'}.`,
    );
    if (!confirmed) return;

    try {
      await deleteTag(tag.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível eliminar a tag. ${message}`);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────

  const hasAnyTag = tags !== undefined && tags.length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TagsHeader search={search} onSearchChange={setSearch} onNewTag={handleOpenCreate} />

      <div style={{ paddingTop: '1rem' }}>
        <TagsGrid
          tags={visibleTags}
          taskCounts={taskCounts}
          hasAnyTag={hasAnyTag}
          search={search}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onNewTag={handleOpenCreate}
        />
      </div>

      {modalState.kind === 'create' && (
        <TagFormModal mode="create" onClose={handleCloseModal} onSubmit={handleSubmit} />
      )}
      {modalState.kind === 'edit' && (
        <TagFormModal
          mode="edit"
          initialValue={modalState.tag}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}

      {toast !== null && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 110, 0.92)',
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '0.7rem 1.2rem',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            maxWidth: '90vw',
            zIndex: 60,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
