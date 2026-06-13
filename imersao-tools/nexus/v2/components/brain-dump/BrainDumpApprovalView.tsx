'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BRAIN_DUMP_BUCKETS,
  type BrainDumpBucket,
  type BrainDumpItem,
  type BrainDumpParsed,
} from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — BrainDumpApprovalView (Story 5.8 — FR49, AC2/AC5/AC6)
 *
 * Controlos interactivos de aprovação item-a-item dos 4 buckets propostos (FE [6]):
 * checkbox por item (default marcado — todos seleccionados), edição inline (✏️) do
 * `texto`, rejeição (✗) que desmarca, controlos bulk por bucket (✓ todas / ✗
 * nenhuma), contador dinâmico e botão fixo "Guardar N itens seleccionados".
 *
 * Componente presentational: o estado de selecção/edição é **local React** (eixo (a)
 * `internal-state-contract-gate.md` — o `parsedOutput` em Dexie NUNCA é tocado; só as
 * entidades criadas levam o texto editado, preservando auditabilidade proposto-vs-
 * guardado). A persistência é delegada ao `onSave(items)` (orquestrado pelo
 * `BrainDumpLauncher` via `persistApprovedItems`).
 *
 * Decisões ratificadas (Aria, 12/06/2026):
 * - `[D-5.8-EDIT-INLINE]`: input in-place de uma linha; texto editado é o que
 *   persiste; editado para vazio/whitespace → tratado como desmarcado (não persiste).
 * - `[D-5.8-STATUS-TRANSITION]`: o contador conta itens marcados COM texto não-vazio.
 *
 * Design system (`design-system-ia-avancada.md`): fundo #04040A, glassmorphism,
 * cores dos buckets da paleta canónica (tarefas Cyan, projectos Purple, ideias Gold,
 * decisões Magenta). a11y: `role="checkbox"`/`aria-checked`, `aria-label` nos botões
 * ✏️/✗ e bulk, contador `aria-live`, overlay `saving` `role="status"`.
 */

/** Cores/labels de UI por bucket — espelham `BUCKET_META` da 5.7 (paleta canónica). */
const BUCKET_META: Record<BrainDumpBucket, { label: string; color: string }> = {
  tarefas: { label: 'Tarefas propostas', color: '#00F5FF' },
  projectos: { label: 'Projectos propostos', color: '#9D00FF' },
  ideias: { label: 'Ideias soltas', color: '#FFB800' },
  decisoes: { label: 'Decisões a tomar', color: '#FF006E' },
};

/** Estado local de um item de aprovação (id estável do `parsedOutput` + edição). */
interface ItemState {
  bucket: BrainDumpBucket;
  id: string;
  /** Texto actual (editado in-place se editado; inicia como `item.texto`). */
  texto: string;
  /** Seleccionado para guardar (default true). */
  checked: boolean;
}

/** Item aprovado emitido ao guardar (bucket + texto final). */
export interface ApprovedItemPayload {
  bucket: BrainDumpBucket;
  texto: string;
}

interface BrainDumpApprovalViewProps {
  /** Output re-validado (`BrainDumpParsedSchema.safeParse`) — só leitura de proposta. */
  parsed: BrainDumpParsed;
  /** `true` enquanto a persistência corre (botão desactivado + overlay). */
  saving: boolean;
  /** Persiste os itens aprovados (delegado ao orquestrador). */
  onSave: (items: ApprovedItemPayload[]) => void;
}

/** Constrói o estado inicial: todos os itens marcados, texto = `item.texto`. */
function buildInitialState(parsed: BrainDumpParsed): ItemState[] {
  const state: ItemState[] = [];
  for (const bucket of BRAIN_DUMP_BUCKETS) {
    for (const item of parsed[bucket] as BrainDumpItem[]) {
      state.push({ bucket, id: item.id, texto: item.texto, checked: true });
    }
  }
  return state;
}

export function BrainDumpApprovalView({
  parsed,
  saving,
  onSave,
}: BrainDumpApprovalViewProps): React.ReactElement {
  // Estado de selecção/edição local — `parsedOutput` (Dexie) INTOCADO (`[D-5.8-EDIT]`).
  const [items, setItems] = useState<ItemState[]>(() => buildInitialState(parsed));
  // Item em edição inline (id) — null quando nenhum.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Contador dinâmico: itens marcados COM texto não-vazio (`[D-5.8-STATUS-TRANSITION]`
  // / `[D-5.8-EDIT-INLINE]`: editado para vazio conta como desmarcado).
  const selectedCount = useMemo(
    () => items.filter((it) => it.checked && it.texto.trim().length > 0).length,
    [items],
  );

  function toggleChecked(id: string): void {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)),
    );
  }

  function rejectItem(id: string): void {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: false } : it)),
    );
  }

  function setBucketAll(bucket: BrainDumpBucket, checked: boolean): void {
    setItems((prev) =>
      prev.map((it) => (it.bucket === bucket ? { ...it, checked } : it)),
    );
  }

  function commitEdit(id: string, texto: string): void {
    // `[D-5.8-EDIT-INLINE]` (vazio→desmarca): o texto é sempre trimado; se ficar
    // vazio/whitespace, o item é desmarcado (`checked: false`) — coerente com o
    // contador (`selectedCount` deixa de o contar) e com a persistência (que filtra
    // texto vazio). Sem desmarcar, o item ficaria `checked` com texto vazio e o
    // contador diria N mas guardaria N-1 (finding CR Iter 1).
    const trimmed = texto.trim();
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, texto: trimmed, checked: trimmed.length > 0 && it.checked }
          : it,
      ),
    );
    setEditingId(null);
  }

  function handleSave(): void {
    if (saving || selectedCount === 0) return;
    const approved: ApprovedItemPayload[] = items
      .filter((it) => it.checked && it.texto.trim().length > 0)
      .map((it) => ({ bucket: it.bucket, texto: it.texto.trim() }));
    onSave(approved);
  }

  return (
    <div
      data-testid="brain-dump-approval"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}
    >
      <div
        data-testid="brain-dump-approval-buckets"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
        }}
      >
        {BRAIN_DUMP_BUCKETS.map((bucket) => (
          <ApprovalBucketSection
            key={bucket}
            bucket={bucket}
            items={items.filter((it) => it.bucket === bucket)}
            editingId={editingId}
            saving={saving}
            onToggle={toggleChecked}
            onReject={rejectItem}
            onStartEdit={setEditingId}
            onCommitEdit={commitEdit}
            onBulk={setBucketAll}
          />
        ))}
      </div>

      <button
        type="button"
        data-testid="brain-dump-save-button"
        onClick={handleSave}
        disabled={saving || selectedCount === 0}
        aria-disabled={saving || selectedCount === 0 || undefined}
        aria-live="polite"
        aria-label={`Guardar ${selectedCount} ${
          selectedCount === 1 ? 'item seleccionado' : 'itens seleccionados'
        }`}
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: selectedCount > 0 && !saving ? '#04040A' : '#4A5568',
          background:
            selectedCount > 0 && !saving ? '#39FF14' : 'rgba(255, 255, 255, 0.04)',
          border:
            selectedCount > 0 && !saving
              ? 'none'
              : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          padding: '0.75rem 1.4rem',
          cursor: selectedCount > 0 && !saving ? 'pointer' : 'not-allowed',
          boxShadow:
            selectedCount > 0 && !saving ? '0 0 20px rgba(57, 255, 20, 0.35)' : 'none',
          transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        Guardar {selectedCount}{' '}
        {selectedCount === 1 ? 'item seleccionado' : 'itens seleccionados'}
      </button>
    </div>
  );
}

interface ApprovalBucketSectionProps {
  bucket: BrainDumpBucket;
  items: ItemState[];
  editingId: string | null;
  saving: boolean;
  onToggle: (id: string) => void;
  onReject: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, texto: string) => void;
  onBulk: (bucket: BrainDumpBucket, checked: boolean) => void;
}

function ApprovalBucketSection({
  bucket,
  items,
  editingId,
  saving,
  onToggle,
  onReject,
  onStartEdit,
  onCommitEdit,
  onBulk,
}: ApprovalBucketSectionProps): React.ReactElement {
  const { label, color } = BUCKET_META[bucket];

  return (
    <section
      data-testid={`brain-dump-approval-bucket-${bucket}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0.7rem 0.9rem',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#F0F4FF',
            flex: 1,
          }}
        >
          {label}{' '}
          <span
            data-testid={`brain-dump-approval-count-${bucket}`}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.78rem',
              fontWeight: 700,
              color,
            }}
          >
            ({items.length})
          </span>
        </span>
        {items.length > 0 && (
          <span style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => onBulk(bucket, true)}
              disabled={saving}
              aria-label={`Seleccionar todas as ${label.toLowerCase()}`}
              style={bulkButtonStyle(saving)}
            >
              ✓ todas
            </button>
            <button
              type="button"
              onClick={() => onBulk(bucket, false)}
              disabled={saving}
              aria-label={`Não seleccionar nenhuma das ${label.toLowerCase()}`}
              style={bulkButtonStyle(saving)}
            >
              ✗ nenhuma
            </button>
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '0 0.9rem 0.7rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {items.map((item) => (
            <ApprovalItemRow
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              saving={saving}
              color={color}
              onToggle={onToggle}
              onReject={onReject}
              onStartEdit={onStartEdit}
              onCommitEdit={onCommitEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface ApprovalItemRowProps {
  item: ItemState;
  isEditing: boolean;
  saving: boolean;
  color: string;
  onToggle: (id: string) => void;
  onReject: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, texto: string) => void;
}

function ApprovalItemRow({
  item,
  isEditing,
  saving,
  color,
  onToggle,
  onReject,
  onStartEdit,
  onCommitEdit,
}: ApprovalItemRowProps): React.ReactElement {
  const [draft, setDraft] = useState(item.texto);

  // Nome acessível do item: o `texto` editado para vazio (item desmarcado por
  // `[D-5.8-EDIT-INLINE]`) deixaria os `aria-label` vazios — fallback PT-PT mantém
  // os controlos nomeados (a11y / AC6).
  const itemLabel = item.texto.trim().length > 0 ? item.texto : '(item sem texto)';

  // Resync do draft com o `texto` actual ao (re)entrar em edição: o commit trima o
  // texto no estado do pai, mas o `draft` local manter-se-ia com o valor antigo
  // não-trimado — ao reabrir o editor, o input mostraria o valor desactualizado
  // (CR Iter 1 minor). Resincroniza ao alternar para modo de edição.
  useEffect(() => {
    if (isEditing) setDraft(item.texto);
  }, [isEditing, item.texto]);

  function commit(): void {
    // O trim (e o desmarcar quando vazio) vive em `commitEdit` no pai — fonte única.
    onCommitEdit(item.id, draft);
  }

  return (
    <li
      data-testid={`brain-dump-approval-item-${item.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: item.checked ? 1 : 0.45,
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={itemLabel}
        disabled={saving}
        onClick={() => onToggle(item.id)}
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          borderRadius: 4,
          border: `1.5px solid ${item.checked ? color : 'rgba(255,255,255,0.25)'}`,
          background: item.checked ? color : 'transparent',
          color: '#04040A',
          fontSize: '0.7rem',
          fontWeight: 900,
          lineHeight: 1,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {item.checked ? '✓' : ''}
      </button>

      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={draft}
          data-testid={`brain-dump-approval-edit-${item.id}`}
          aria-label={`Editar texto do item`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: '0.3rem 0.5rem',
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            color: '#D8DEF0',
            lineHeight: 1.5,
            textDecoration: item.checked ? 'none' : 'line-through',
          }}
        >
          {item.texto}
        </span>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={() => onStartEdit(item.id)}
          disabled={saving}
          aria-label={`Editar item: ${itemLabel}`}
          style={iconButtonStyle(saving)}
        >
          ✏️
        </button>
      )}
      <button
        type="button"
        onClick={() => onReject(item.id)}
        disabled={saving}
        aria-label={`Rejeitar item: ${itemLabel}`}
        style={iconButtonStyle(saving)}
      >
        ✗
      </button>
    </li>
  );
}

function bulkButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: '#8892A4',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: '0.2rem 0.6rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

function iconButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.85rem',
    background: 'transparent',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    padding: '0.15rem',
    lineHeight: 1,
  };
}
