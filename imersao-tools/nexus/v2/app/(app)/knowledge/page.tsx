'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useKnowledgeAreas } from '@/hooks/useKnowledgeAreas';
import { useTags } from '@/hooks/useTags';
import {
  createKnowledgeArea,
  updateKnowledgeArea,
  deleteKnowledgeArea,
} from '@/lib/db/repos/knowledge-areas';
import {
  createKnowledgeNotebook,
  updateKnowledgeNotebook,
  deleteKnowledgeNotebook,
  listNotebooksByArea,
  listAllNotebooks,
} from '@/lib/db/repos/knowledge-notebooks';
import {
  createKnowledgeNote,
  updateKnowledgeNote,
  deleteKnowledgeNote,
  listNotesByNotebook,
  listNotesByTag,
  searchNotes,
} from '@/lib/db/repos/knowledge-notes';
import { AreaTree } from '@/components/conhecimento/AreaTree';
import { AreaForm } from '@/components/conhecimento/AreaForm';
import { NotebookForm } from '@/components/conhecimento/NotebookForm';
import { NoteList } from '@/components/conhecimento/NoteList';
import { NoteEditor, type NoteDraft } from '@/components/conhecimento/NoteEditor';
import {
  KnowledgeSearchResults,
  type KnowledgeSearchResult,
} from '@/components/conhecimento/KnowledgeSearchResults';
import type {
  KnowledgeArea,
  KnowledgeNotebook,
  KnowledgeNote,
  Tag,
} from '@/types/db';

/**
 * Nexus v2 — Página /knowledge (Story 5.9 — FR51/FR52/FR54)
 *
 * Rota canónica `/knowledge` (C1 — NÃO `/conhecimento`; NavLink já em
 * Header.tsx:99) no route group `(app)` (C2). Vista master-detail de 2 painéis
 * (front-end-spec-v2.md §3.6): à esquerda `AreaTree` (árvore Áreas→Cadernos), ao
 * centro `NoteList` (notas do caderno seleccionado), à direita `NoteEditor` (nota).
 *
 * Orquestra os hooks Dexie reactivos (`useKnowledgeAreas`, `useTags`) e reads
 * pontuais via `useLiveQuery` (cadernos por área expandida, notas do caderno
 * seleccionado). O CRUD delega aos repos da 5.1 (AC18 — sem version bump).
 *
 * Confirmação de eliminação ([D-5.9-DELETE-CASCADE-UX]):
 *   - Área: quantificada (N cadernos + M notas) — 1+N reads informativos antes do
 *     `window.confirm`. A contagem NÃO é passada ao delete (atómico, usa o id).
 *   - Caderno: quantificada leve (M notas, 1 read).
 *   - Nota: simples (folha, sem cascata).
 *
 * Guards de sistema (C3): a `AreaTree` desactiva eliminar+renomear da área de
 * sistema e do `_inbox` via `SystemEntityGuard`. C4: zero delete de tag aqui.
 */

type AreaModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; area: KnowledgeArea };

type NotebookModalState =
  | { kind: 'closed' }
  | { kind: 'create'; areaId: string }
  | { kind: 'edit'; notebook: KnowledgeNotebook };

export default function KnowledgePage(): React.ReactElement {
  const router = useRouter();

  const areas = useKnowledgeAreas();
  const tags = useTags();

  const [expandedAreaIds, setExpandedAreaIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [selectedNotebook, setSelectedNotebook] =
    useState<KnowledgeNotebook | null>(null);
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [areaModal, setAreaModal] = useState<AreaModalState>({ kind: 'closed' });
  const [notebookModal, setNotebookModal] = useState<NotebookModalState>({
    kind: 'closed',
  });

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (toast === null) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // ─── Pesquisa (Story 5.10 — FR53) ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeNote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isSearchMode = searchQuery.trim() !== '';

  // Debounce 300ms (padrão 5.5 — sem biblioteca).
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  // Pesquisa com cancelamento de race (padrão 5.5). Só corre após o debounce —
  // NÃO está no caminho hot per-keystroke.
  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchNotes(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch((err) => {
        // searchNotes pode rejeitar (ex: Dexie indisponível). Não deixar a vista
        // presa em "loading" nem gerar unhandled rejection (CR Iter 1 CRITICAL).
        if (!cancelled) {
          setSearchResults([]);
          const message = err instanceof Error ? err.message : 'Erro desconhecido';
          setToast(`Não foi possível pesquisar. ${message}`);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Mapa global notebookId → { nome do caderno, nome da área } para resolver o
  // breadcrumb da pesquisa sem reads Dexie no caminho hot (R3, AC5). Read único
  // reactivo (re-corre só quando cadernos/áreas mudam, não por keystroke).
  const allNotebooks = useLiveQuery(() => listAllNotebooks(), []);
  const breadcrumbByNotebook = useMemo<
    Map<string, { areaName: string; notebookName: string }>
  >(() => {
    const areaNames = new Map<string, string>();
    (areas ?? []).forEach((a) => areaNames.set(a.id, a.name));
    const map = new Map<string, { areaName: string; notebookName: string }>();
    (allNotebooks ?? []).forEach((nb) => {
      map.set(nb.id, {
        notebookName: nb.name,
        areaName: areaNames.get(nb.areaId) ?? 'Área desconhecida',
      });
    });
    return map;
  }, [areas, allNotebooks]);

  // Resultados de pesquisa com breadcrumb pré-resolvido (componente puro).
  const searchResultsWithBreadcrumb = useMemo<KnowledgeSearchResult[]>(
    () =>
      searchResults.map((note) => {
        const crumb = breadcrumbByNotebook.get(note.notebookId);
        return {
          note,
          areaName: crumb?.areaName ?? 'Área desconhecida',
          notebookName: crumb?.notebookName ?? 'Caderno desconhecido',
        };
      }),
    [searchResults, breadcrumbByNotebook],
  );

  // Cadernos por área expandida (read reactivo). Re-corre quando o conjunto de
  // áreas expandidas muda.
  const expandedKey = useMemo(
    () => Array.from(expandedAreaIds).sort().join(','),
    [expandedAreaIds],
  );
  const notebooksByArea = useLiveQuery(async () => {
    const map = new Map<string, KnowledgeNotebook[]>();
    for (const areaId of expandedAreaIds) {
      map.set(areaId, await listNotebooksByArea(areaId));
    }
    return map;
  }, [expandedKey]);

  // Notas do caderno seleccionado (read reactivo), filtradas por tag (AC15).
  const notes = useLiveQuery(async () => {
    if (selectedNotebook === null) return undefined;
    if (tagFilter !== null) {
      const byTag = await listNotesByTag(tagFilter);
      return byTag.filter((n) => n.notebookId === selectedNotebook.id);
    }
    return listNotesByNotebook(selectedNotebook.id);
  }, [selectedNotebook?.id ?? null, tagFilter]);

  const tagsLookup = useMemo<Map<string, Tag>>(() => {
    const map = new Map<string, Tag>();
    (tags ?? []).forEach((t) => map.set(t.id, t));
    return map;
  }, [tags]);

  // Escape global → em modo pesquisa, limpa a query (volta ao master-detail,
  // AC3/AC6); caso contrário `router.back` (precedente tarefas/page.tsx).
  // Suprimido quando um modal está aberto (o modal trata o seu próprio Escape) E
  // quando se está a criar/editar uma nota — caso contrário o Escape fecharia a
  // vista e perderia o rascunho da nota em curso (CR Iter 1 F1). Nesses estados o
  // utilizador sai via Cancelar/Guardar no `NoteEditor`, não via Escape global.
  useEffect(() => {
    if (
      areaModal.kind !== 'closed' ||
      notebookModal.kind !== 'closed' ||
      creatingNote ||
      editingNote
    )
      return;
    function handleEscape(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return;
      if (isSearchMode) {
        setSearchQuery('');
        return;
      }
      router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    router,
    areaModal.kind,
    notebookModal.kind,
    creatingNote,
    editingNote,
    isSearchMode,
  ]);

  // ─── Áreas ─────────────────────────────────────────────────────────

  function handleToggleArea(areaId: string): void {
    setExpandedAreaIds((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  async function handleSubmitArea(input: KnowledgeArea): Promise<void> {
    try {
      if (areaModal.kind === 'create') {
        await createKnowledgeArea(input);
      } else if (areaModal.kind === 'edit') {
        await updateKnowledgeArea(areaModal.area.id, {
          name: input.name,
          color: input.color,
          icon: input.icon,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível guardar a área. ${message}`);
      throw err;
    }
  }

  async function handleDeleteArea(area: KnowledgeArea): Promise<void> {
    // [D-5.9-DELETE-CASCADE-UX] Opção B — quantificação prévia (informativa). A
    // contagem NUNCA é passada ao delete (atómico, usa o id).
    let notebookCount = 0;
    let noteCount = 0;
    try {
      const notebooks = await listNotebooksByArea(area.id);
      notebookCount = notebooks.length;
      const noteCounts = await Promise.all(
        notebooks.map(async (nb) => (await listNotesByNotebook(nb.id)).length),
      );
      noteCount = noteCounts.reduce((sum, n) => sum + n, 0);
    } catch {
      // Defensivo — se a contagem falhar, segue sem números (mensagem genérica).
      notebookCount = -1;
      noteCount = -1;
    }
    const scopeText =
      notebookCount < 0
        ? 'Esta acção é irreversível e apaga também os seus cadernos e notas.'
        : `Vais apagar a área «${area.name}», ${notebookCount} ${notebookCount === 1 ? 'caderno' : 'cadernos'} e ${noteCount} ${noteCount === 1 ? 'nota' : 'notas'}. Esta acção é irreversível.`;
    const confirmed = window.confirm(scopeText);
    if (!confirmed) return;

    try {
      await deleteKnowledgeArea(area.id);
      setExpandedAreaIds((prev) => {
        const next = new Set(prev);
        next.delete(area.id);
        return next;
      });
      // Se o caderno seleccionado pertencia a esta área, limpa a selecção.
      if (selectedNotebook && selectedNotebook.areaId === area.id) {
        setSelectedNotebook(null);
        setSelectedNote(null);
        setCreatingNote(false);
        setEditingNote(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível eliminar a área. ${message}`);
    }
  }

  // ─── Cadernos ──────────────────────────────────────────────────────

  async function handleSubmitNotebook(input: KnowledgeNotebook): Promise<void> {
    try {
      if (notebookModal.kind === 'create') {
        await createKnowledgeNotebook(input);
        // Garante que a área pai está expandida para mostrar o novo caderno.
        setExpandedAreaIds((prev) => new Set(prev).add(input.areaId));
      } else if (notebookModal.kind === 'edit') {
        await updateKnowledgeNotebook(notebookModal.notebook.id, {
          name: input.name,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível guardar o caderno. ${message}`);
      throw err;
    }
  }

  async function handleDeleteNotebook(notebook: KnowledgeNotebook): Promise<void> {
    // [D-5.9-DELETE-CASCADE-UX] quantificada leve — só notas (1 read).
    let noteCount = -1;
    try {
      noteCount = (await listNotesByNotebook(notebook.id)).length;
    } catch {
      noteCount = -1;
    }
    const scopeText =
      noteCount < 0
        ? `Eliminar o caderno «${notebook.name}»? Apaga também as suas notas.`
        : `Vais apagar o caderno «${notebook.name}» e ${noteCount} ${noteCount === 1 ? 'nota' : 'notas'}.`;
    const confirmed = window.confirm(scopeText);
    if (!confirmed) return;

    try {
      await deleteKnowledgeNotebook(notebook.id);
      if (selectedNotebook?.id === notebook.id) {
        setSelectedNotebook(null);
        setSelectedNote(null);
        setCreatingNote(false);
        setEditingNote(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível eliminar o caderno. ${message}`);
    }
  }

  function handleSelectNotebook(notebook: KnowledgeNotebook): void {
    setSelectedNotebook(notebook);
    setSelectedNote(null);
    setCreatingNote(false);
    setEditingNote(false);
    setTagFilter(null);
  }

  // ─── Notas ─────────────────────────────────────────────────────────

  function handleSelectNote(note: KnowledgeNote): void {
    setSelectedNote(note);
    setCreatingNote(false);
    setEditingNote(false);
  }

  function handleCreateNote(): void {
    setSelectedNote(null);
    setCreatingNote(true);
    setEditingNote(false);
  }

  async function handleSaveNote(draft: NoteDraft): Promise<void> {
    if (selectedNotebook === null) {
      throw new Error('Nenhum caderno seleccionado.');
    }
    // createKnowledgeNote/updateKnowledgeNote podem lançar (ex: caderno removido
    // entretanto, validação). Mesmo padrão de falha consistente das handlers de
    // área/caderno (CR Iter 1 do PR #70): toast + re-throw para o NoteEditor
    // poder reagir, sem alterar `selectedNote` no caminho de falha.
    try {
      const now = Date.now();
      if (creatingNote) {
        const created = await createKnowledgeNote({
          id: crypto.randomUUID(),
          notebookId: selectedNotebook.id,
          title: draft.title,
          bodyMarkdown: draft.bodyMarkdown,
          tags: draft.tags,
          updatedAt: now,
        });
        setSelectedNote(created);
        setCreatingNote(false);
        setEditingNote(false);
      } else if (selectedNote !== null) {
        await updateKnowledgeNote(selectedNote.id, {
          title: draft.title,
          bodyMarkdown: draft.bodyMarkdown,
          tags: draft.tags,
          updatedAt: now,
        });
        setSelectedNote({
          ...selectedNote,
          title: draft.title,
          bodyMarkdown: draft.bodyMarkdown,
          tags: draft.tags,
          updatedAt: now,
        });
        setEditingNote(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível guardar a nota. ${message}`);
      throw err;
    }
  }

  async function handleDeleteNote(note: KnowledgeNote): Promise<void> {
    // [D-5.9-DELETE-CASCADE-UX] confirmação simples (folha, sem cascata). Notas
    // dentro do `_inbox` SÃO elimináveis (a nota não é entidade de sistema — AC12).
    const confirmed = window.confirm(
      `Eliminar a nota «${note.title}»? Esta acção é irreversível.`,
    );
    if (!confirmed) return;
    try {
      await deleteKnowledgeNote(note.id);
      if (selectedNote?.id === note.id) {
        setSelectedNote(null);
        setEditingNote(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setToast(`Não foi possível eliminar a nota. ${message}`);
    }
  }

  // ─── Pesquisa: navegação para a nota ───────────────────────────────

  // Fecha o modo pesquisa e navega para a nota no master-detail: expande a área,
  // selecciona o caderno e selecciona a nota (AC5/T5.5). Usa os dados já em
  // memória (`searchResults`, `allNotebooks`) — sem reads Dexie extra.
  function handleSelectSearchResult(noteId: string): void {
    const note = searchResults.find((n) => n.id === noteId);
    if (note === undefined) return;
    const notebook = (allNotebooks ?? []).find((nb) => nb.id === note.notebookId);
    setSearchQuery('');
    if (notebook !== undefined) {
      setExpandedAreaIds((prev) => new Set(prev).add(notebook.areaId));
      setSelectedNotebook(notebook);
      setTagFilter(null);
    }
    setSelectedNote(note);
    setCreatingNote(false);
    setEditingNote(false);
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#F0F4FF',
            letterSpacing: '-0.01em',
          }}
        >
          Conhecimento
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            role="search"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span aria-hidden="true" style={{ fontSize: '0.85rem' }}>
              🔍
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Pesquisar nas notas"
              placeholder="Pesquisar notas…"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                color: '#F0F4FF',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: '0.4rem 0.7rem',
                width: 220,
                maxWidth: '40vw',
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar Conhecimento"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#8892A4',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 6,
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
            }}
          >
            ESC · VOLTAR
          </button>
        </div>
      </header>

      {isSearchMode ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          <KnowledgeSearchResults
            results={searchResultsWithBreadcrumb}
            query={debouncedQuery}
            // `isLoading` também enquanto o debounce está pendente (query imediata
            // ainda não propagou) — evita um flash do estado "empty" nos primeiros
            // ~300ms de digitação.
            isLoading={isSearching || searchQuery.trim() !== debouncedQuery.trim()}
            onSelect={handleSelectSearchResult}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <AreaTree
            areas={areas}
            expandedAreaIds={expandedAreaIds}
            notebooksByArea={notebooksByArea ?? new Map()}
            selectedNotebookId={selectedNotebook?.id ?? null}
            onToggleArea={handleToggleArea}
            onSelectNotebook={handleSelectNotebook}
            onCreateArea={() => setAreaModal({ kind: 'create' })}
            onEditArea={(area) => setAreaModal({ kind: 'edit', area })}
            onDeleteArea={handleDeleteArea}
            onCreateNotebook={(area) =>
              setNotebookModal({ kind: 'create', areaId: area.id })
            }
            onEditNotebook={(notebook) =>
              setNotebookModal({ kind: 'edit', notebook })
            }
            onDeleteNotebook={handleDeleteNotebook}
          />

          <NoteList
            notes={notes}
            hasNotebookSelected={selectedNotebook !== null}
            selectedNoteId={selectedNote?.id ?? null}
            tagsLookup={tagsLookup}
            tags={tags}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />

          <NoteEditor
            note={selectedNote}
            creating={creatingNote}
            editing={editingNote}
            tags={tags}
            onStartEdit={() => setEditingNote(true)}
            onCancelEdit={() => setEditingNote(false)}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
          />
        </div>
      )}

      {areaModal.kind === 'create' && (
        <AreaForm
          mode="create"
          onClose={() => setAreaModal({ kind: 'closed' })}
          onSubmit={handleSubmitArea}
        />
      )}
      {areaModal.kind === 'edit' && (
        <AreaForm
          mode="edit"
          initialValue={areaModal.area}
          onClose={() => setAreaModal({ kind: 'closed' })}
          onSubmit={handleSubmitArea}
        />
      )}

      {notebookModal.kind === 'create' && (
        <NotebookForm
          mode="create"
          areaId={notebookModal.areaId}
          onClose={() => setNotebookModal({ kind: 'closed' })}
          onSubmit={handleSubmitNotebook}
        />
      )}
      {notebookModal.kind === 'edit' && (
        <NotebookForm
          mode="edit"
          areaId={notebookModal.notebook.areaId}
          initialValue={notebookModal.notebook}
          onClose={() => setNotebookModal({ kind: 'closed' })}
          onSubmit={handleSubmitNotebook}
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
