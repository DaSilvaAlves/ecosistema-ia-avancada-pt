'use client';

/**
 * Nexus v2 — MarkdownEditor (Story 5.2 — AC1/AC3/AC4/AC5/AC6)
 *
 * Editor markdown partilhado baseado em Tiptap 2 (ADR-3). Config restrita
 * (StarterKit + TaskList + TaskItem + Link + Placeholder + Markdown — arch §4.3/§16),
 * sem images (Epic 8). Reutilizado por Diário (5.3), Brain Dump (5.6) e Notas (5.9).
 *
 * Componente CONTROLADO: o pai detém o markdown (`value`) e recebe alterações via
 * `onChange`. Sem persistência, sem chamadas a repos/AI — só apresentação + emissão.
 *
 * Serialização markdown ⇄ documento via `tiptap-markdown` (`[D-5.2-SERIALIZE]`),
 * com a mesma config do helper puro `lib/editor/markdown.ts`. `bodyMarkdown: string`
 * é o contrato de dados (Story 5.1).
 *
 * SSR (Next 15 App Router): `immediatelyRender: false` evita hydration mismatch
 * (gotcha Tiptap + Next — ADR-1).
 *
 * Design system (`design-system-ia-avancada.md`): superfície glassmorphism, fundo
 * escuro, Inter no corpo + JetBrains Mono em código, cyan em links/foco, placeholder
 * Grey2. Nunca light mode.
 */
import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { createBaseEditorExtensions } from '@/lib/editor/extensions';

interface MarkdownEditorProps {
  /** Markdown actual — controlado pelo pai. */
  value: string;
  /** Emitido com o markdown serializado em cada alteração. */
  onChange: (markdown: string) => void;
  /** Texto de placeholder quando vazio. */
  placeholder?: string;
  /** Default true; false torna o editor read-only. */
  editable?: boolean;
  /** Rótulo acessível obrigatório (cada consumidor fornece o seu). */
  ariaLabel: string;
}

const EDITOR_CLASS = 'nexus-md-editor';

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  editable = true,
  ariaLabel,
}: MarkdownEditorProps): React.ReactElement {
  const editor = useEditor({
    extensions: [
      ...createBaseEditorExtensions(),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editable,
    immediatelyRender: false, // SSR-safe (Next 15 — ADR-1)
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // Sincroniza `value` externo → editor (sem emitir update — evita loop).
  // Guarda por comparação do markdown serializado: como o `onUpdate` já emitiu
  // este mesmo markdown, a comparação é igual e não há setContent redundante.
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Sincroniza `editable` → editor.
  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '0.75rem 0.9rem',
      }}
    >
      <style>{`
        .${EDITOR_CLASS} {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          line-height: 1.8;
          color: #F0F4FF;
          outline: none;
          min-height: 6rem;
        }
        .${EDITOR_CLASS} :focus { outline: none; }
        .${EDITOR_CLASS} a {
          color: #00F5FF;
          text-decoration: underline;
          cursor: pointer;
        }
        .${EDITOR_CLASS} code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85em;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 0.1em 0.35em;
        }
        .${EDITOR_CLASS} pre {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.7rem 0.9rem;
          overflow-x: auto;
        }
        .${EDITOR_CLASS} pre code {
          background: none;
          padding: 0;
        }
        .${EDITOR_CLASS} ul[data-type='taskList'] {
          list-style: none;
          padding-left: 0.2rem;
        }
        .${EDITOR_CLASS} ul[data-type='taskList'] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .${EDITOR_CLASS} p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #4A5568;
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}
