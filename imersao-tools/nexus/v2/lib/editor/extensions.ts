/**
 * Nexus v2 — Configuração de extensões do editor markdown (Story 5.2 — AC1)
 *
 * Fonte ÚNICA da config restrita do Tiptap 2 (ADR-3 / architecture-v2.md §4.3/§16),
 * partilhada pelo componente `MarkdownEditor` (5.2) e pelo helper de serialização
 * (`lib/editor/markdown.ts`). Os 3 consumidores do editor (Diário 5.3, Brain Dump
 * 5.6, Notas 5.9) usam-na indirectamente via `MarkdownEditor`.
 *
 * Config restrita exacta (arch §16 — "extensions limitados"):
 *   StarterKit + TaskList + TaskItem + Link + Markdown.
 * SEM images (Epic 8 se necessário). O `Placeholder` é adicionado pelo componente
 * (depende de texto por-instância) e não afecta a serialização markdown.
 *
 * `[D-5.2-SERIALIZE]` (decisão @dev): a serialização markdown ⇄ documento usa
 * `tiptap-markdown` (extensão `Markdown`). Escolhida sobre `prosemirror-markdown`
 * puro porque faz serialize E parse de task lists (`- [ ]` / `- [x]`, FR42/FR47)
 * out-of-box, evitando serializers de nó custom + plugin markdown-it adicional.
 * `bodyMarkdown: string` é o contrato de dados (Story 5.1). html:false garante
 * markdown limpo (sem pass-through de HTML).
 */
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import type { Extensions } from '@tiptap/core';

/**
 * Cria uma nova lista de extensões base (sem Placeholder). Cada chamada devolve
 * instâncias novas — extensões do Tiptap não devem ser partilhadas entre editores.
 */
export function createBaseEditorExtensions(): Extensions {
  return [
    StarterKit,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Markdown.configure({
      html: false, // markdown limpo — sem pass-through de HTML
      tightLists: true,
      linkify: false,
      breaks: false,
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ];
}
