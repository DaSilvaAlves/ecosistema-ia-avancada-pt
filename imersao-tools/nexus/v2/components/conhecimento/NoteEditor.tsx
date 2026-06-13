'use client';

import { useEffect, useState } from 'react';
import type { KnowledgeNote, Tag } from '@/types/db';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — NoteEditor (Story 5.9 — AC3/AC10/AC11/AC12/AC13/AC14)
 *
 * Painel direito do master-detail (front-end-spec-v2.md §3.6): vista/edição de uma
 * nota. Dois modos:
 *   - 'view' (AC3): título + corpo markdown renderizado (read-only) + botão Editar.
 *   - 'edit' (AC10/AC11): título editável + `MarkdownEditor` (Tiptap 2, 5.2) +
 *     tag picker. Guardar emite `onSave` com `{ title, bodyMarkdown, tags }`.
 *
 * Tag picker (AC13/AC14): reutiliza a lista de `tags` (do `useTags`, Epic 2). O
 * utilizador adiciona/remove tags **da nota** (altera o array `tags` da nota, NÃO
 * a tabela `tags`). PROIBIDO delete de tag aqui (C4). A tag de sistema `decisao`
 * aparece como qualquer outra (AC14).
 *
 * Componente **controlado pelo parent** para o modo e a nota — o estado local
 * (draft) é semente da nota e emite no Guardar (padrão prop-driven 5.4/5.8). A
 * persistência (`updateKnowledgeNote`/`createKnowledgeNote`, `updatedAt`) é da
 * page.
 *
 * Estados de render: vazio (sem nota) / view / edit. Sem nota seleccionada mostra
 * o placeholder.
 */

export interface NoteDraft {
  title: string;
  bodyMarkdown: string;
  tags: string[];
}

interface NoteEditorProps {
  /** Nota seleccionada (view/edit); `null` quando se está a criar uma nota nova. */
  note: KnowledgeNote | null;
  /** `true` quando o painel está em modo de criação (nota nova, sem `note`). */
  creating: boolean;
  /** Modo de edição activo (criar começa sempre em edição). */
  editing: boolean;
  tags: Tag[] | undefined;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: NoteDraft) => Promise<void>;
  onDelete: (note: KnowledgeNote) => void;
}

export function NoteEditor({
  note,
  creating,
  editing,
  tags,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: NoteEditorProps): React.ReactElement {
  const [draft, setDraft] = useState<NoteDraft>(() => ({
    title: note?.title ?? '',
    bodyMarkdown: note?.bodyMarkdown ?? '',
    tags: note?.tags ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-semeia o draft quando a nota seleccionada muda ou se entra em criação.
  // `creating` força um draft vazio; caso contrário espelha a nota.
  useEffect(() => {
    setDraft({
      title: creating ? '' : note?.title ?? '',
      bodyMarkdown: creating ? '' : note?.bodyMarkdown ?? '',
      tags: creating ? [] : note?.tags ?? [],
    });
    setError(null);
  }, [note, creating]);

  function toggleTag(tagId: string): void {
    setDraft((prev) =>
      prev.tags.includes(tagId)
        ? { ...prev, tags: prev.tags.filter((t) => t !== tagId) }
        : { ...prev, tags: [...prev.tags, tagId] },
    );
  }

  async function handleSave(): Promise<void> {
    if (saving) return;
    if (draft.title.trim() === '') {
      setError('O título da nota é obrigatório.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({
        title: draft.title.trim(),
        bodyMarkdown: draft.bodyMarkdown,
        tags: draft.tags,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível guardar a nota. ${err.message}`
          : 'Não foi possível guardar a nota.',
      );
    } finally {
      setSaving(false);
    }
  }

  // Estado vazio — nem nota seleccionada nem criação em curso.
  if (note === null && !creating) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#8892A4',
        }}
      >
        Selecciona ou cria uma nota para a ver aqui.
      </div>
    );
  }

  const isEditing = editing || creating;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '1rem 1.25rem',
        overflowY: 'auto',
      }}
    >
      {isEditing ? (
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          aria-label="Título da nota"
          placeholder="Título da nota"
          style={{
            ...fieldInputStyle(),
            fontSize: '1.2rem',
            fontWeight: 700,
          }}
        />
      ) : (
        <h2
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#F0F4FF',
            letterSpacing: '-0.01em',
          }}
        >
          {note?.title}
        </h2>
      )}

      {/* Tags */}
      {tags !== undefined && tags.length > 0 && (
        <div
          role="group"
          aria-label="Tags da nota"
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          {tags.map((tag) => {
            const active = draft.tags.includes(tag.id);
            const shown = isEditing || active;
            if (!shown) return null;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={isEditing ? () => toggleTag(tag.id) : undefined}
                disabled={!isEditing}
                aria-pressed={isEditing ? active : undefined}
                aria-label={`Tag ${tag.name}${active ? ' (activa)' : ''}`}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  letterSpacing: '0.06em',
                  color: active ? '#04040A' : tag.color,
                  background: active ? tag.color : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${tag.color}`,
                  borderRadius: 20,
                  padding: '0.2rem 0.6rem',
                  cursor: isEditing ? 'pointer' : 'default',
                }}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      )}

      {error !== null && (
        <span
          role="alert"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#FF006E',
          }}
        >
          {error}
        </span>
      )}

      {/* Corpo markdown */}
      {isEditing ? (
        <MarkdownEditor
          value={draft.bodyMarkdown}
          onChange={(md) => setDraft((prev) => ({ ...prev, bodyMarkdown: md }))}
          placeholder="Escreve a nota em markdown…"
          ariaLabel="Corpo da nota"
        />
      ) : (
        <MarkdownEditor
          value={note?.bodyMarkdown ?? ''}
          onChange={() => undefined}
          editable={false}
          ariaLabel="Corpo da nota (leitura)"
        />
      )}

      {/* Acções */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
        {isEditing ? (
          <>
            {!creating && (
              <button
                type="button"
                onClick={onCancelEdit}
                style={secondaryBtnStyle}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}
            >
              {creating ? 'Criar nota' : 'Guardar'}
            </button>
          </>
        ) : (
          <>
            {note !== null && (
              <button
                type="button"
                onClick={() => onDelete(note)}
                aria-label={`Eliminar nota ${note.title}`}
                style={{
                  ...secondaryBtnStyle,
                  color: '#FF006E',
                  borderColor: 'rgba(255, 0, 110, 0.4)',
                }}
              >
                Eliminar
              </button>
            )}
            <button type="button" onClick={onStartEdit} style={primaryBtnStyle}>
              ✏️ Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#04040A',
  background: '#00F5FF',
  border: 'none',
  borderRadius: 6,
  padding: '0.5rem 1.1rem',
  cursor: 'pointer',
  boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
};

const secondaryBtnStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#F0F4FF',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 6,
  padding: '0.5rem 1.1rem',
  cursor: 'pointer',
};
