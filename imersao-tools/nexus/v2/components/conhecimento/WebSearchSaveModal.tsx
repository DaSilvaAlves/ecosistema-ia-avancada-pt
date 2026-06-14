'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KnowledgeArea, KnowledgeNotebook } from '@/types/db';
import type { WebSearchResult } from '@/lib/shared/web-search-ddg';
import { fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — WebSearchSaveModal (Story 5.11 — FR55, AC5)
 *
 * Modal para guardar um resultado de pesquisa web como nota
 * (`[D-5.11-MANUAL-SAVE]`). Pré-preenche `title` ← título do resultado,
 * `bodyMarkdown` ← excerto + fonte em markdown; o `sourceUrl` é o URL do
 * resultado (não editável — é a fonte, AC5). O utilizador escolhe a área e o
 * caderno de destino (selectors em cascata, análogos ao fluxo do `NoteEditor`).
 *
 * Prop-driven: a persistência (`createKnowledgeNote`) é da `page.tsx` via
 * `onSubmit`; o modal só recolhe os dados e emite. `onSubmit` pode lançar (ex:
 * caderno removido entretanto — `createKnowledgeNote` valida) — o modal mostra a
 * mensagem de erro e NÃO fecha, deixando o utilizador tentar de novo
 * (internal-state-contract-gate.md eixo c — falha não silenciosa).
 */

export interface WebSearchNoteDraft {
  notebookId: string;
  title: string;
  bodyMarkdown: string;
  sourceUrl: string;
}

interface WebSearchSaveModalProps {
  result: WebSearchResult;
  areas: KnowledgeArea[] | undefined;
  notebooks: KnowledgeNotebook[] | undefined;
  onClose: () => void;
  onSubmit: (draft: WebSearchNoteDraft) => Promise<void>;
}

/** Compõe o corpo markdown inicial a partir do resultado (excerto + fonte). */
function buildInitialBody(result: WebSearchResult): string {
  const parts: string[] = [];
  if (result.excerpt.trim() !== '') parts.push(result.excerpt.trim());
  parts.push(`Fonte: ${result.url}`);
  return parts.join('\n\n');
}

export function WebSearchSaveModal({
  result,
  areas,
  notebooks,
  onClose,
  onSubmit,
}: WebSearchSaveModalProps): React.ReactElement {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('');
  const [title, setTitle] = useState<string>(result.title);
  const [bodyMarkdown, setBodyMarkdown] = useState<string>(() =>
    buildInitialBody(result),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-semeia título/corpo quando o resultado-alvo muda (modal reutilizado).
  useEffect(() => {
    setTitle(result.title);
    setBodyMarkdown(buildInitialBody(result));
    setError(null);
  }, [result]);

  // Cadernos da área seleccionada (filtra a lista global já em memória).
  const notebooksOfArea = useMemo<KnowledgeNotebook[]>(
    () =>
      (notebooks ?? [])
        .filter((nb) => nb.areaId === selectedAreaId)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT')),
    [notebooks, selectedAreaId],
  );

  // Ao mudar de área, limpa o caderno seleccionado (pode já não pertencer).
  function handleAreaChange(areaId: string): void {
    setSelectedAreaId(areaId);
    setSelectedNotebookId('');
  }

  // Escape fecha o modal.
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(): Promise<void> {
    if (saving) return;
    if (title.trim() === '') {
      setError('O título da nota é obrigatório.');
      return;
    }
    if (selectedNotebookId === '') {
      setError('Escolhe um caderno de destino.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        notebookId: selectedNotebookId,
        title: title.trim(),
        bodyMarkdown,
        sourceUrl: result.url,
      });
      // Sucesso — o parent fecha o modal (ou já o fechou). Não fechamos aqui para
      // evitar duplo-fecho; o parent controla a visibilidade.
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

  const hasAreas = (areas ?? []).length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Guardar resultado como nota"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 4, 10, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 70,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 92vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          backdropFilter: 'blur(12px)',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#F0F4FF',
          }}
        >
          Guardar como nota
        </h2>

        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            color: '#8892A4',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Título da nota"
            style={fieldInputStyle()}
          />
        </label>

        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            color: '#8892A4',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          Área
          <select
            value={selectedAreaId}
            onChange={(e) => handleAreaChange(e.target.value)}
            aria-label="Área de destino"
            style={fieldInputStyle()}
          >
            <option value="">Escolhe uma área…</option>
            {(areas ?? []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            color: '#8892A4',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          Caderno
          <select
            value={selectedNotebookId}
            onChange={(e) => setSelectedNotebookId(e.target.value)}
            aria-label="Caderno de destino"
            disabled={selectedAreaId === ''}
            style={fieldInputStyle()}
          >
            <option value="">
              {selectedAreaId === ''
                ? 'Escolhe primeiro uma área'
                : 'Escolhe um caderno…'}
            </option>
            {notebooksOfArea.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.name}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.78rem',
            color: '#8892A4',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          Conteúdo
          <textarea
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            aria-label="Conteúdo da nota"
            rows={5}
            style={{ ...fieldInputStyle(), resize: 'vertical', lineHeight: 1.5 }}
          />
        </label>

        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.68rem',
            color: '#8892A4',
            wordBreak: 'break-all',
          }}
        >
          Fonte: {result.url}
        </span>

        {!hasAreas && (
          <span
            role="status"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.78rem',
              color: '#FFB800',
            }}
          >
            Ainda não tens áreas. Cria uma área e um caderno antes de guardar notas.
          </span>
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

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#F0F4FF',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '0.5rem 1.1rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#04040A',
              background: '#00F5FF',
              border: 'none',
              borderRadius: 6,
              padding: '0.5rem 1.1rem',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
            }}
          >
            Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}
