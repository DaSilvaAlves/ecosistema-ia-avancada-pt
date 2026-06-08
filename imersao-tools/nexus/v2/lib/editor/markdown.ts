/**
 * Nexus v2 — Helper puro de serialização markdown (Story 5.2 — AC2 / R5)
 *
 * Lógica de serialização markdown ⇄ documento Tiptap, isolada do componente React
 * (padrão `react-component-test-criteria.md`: lógica testável vive em `lib/**`).
 * Usa um editor headless (`@tiptap/core`) com a mesma config restrita do
 * `MarkdownEditor` (`createBaseEditorExtensions`) + a extensão `Markdown`
 * (`tiptap-markdown`, decisão `[D-5.2-SERIALIZE]`).
 *
 * `bodyMarkdown: string` é o contrato de dados (Story 5.1). Estas funções provam
 * o round-trip que satisfaz AC1 do epic ("markdown com formatação preservada") e
 * mitigam R5 (formatação perdida no round-trip), em especial as task lists.
 *
 * Headless: `@tiptap/core` cria um elemento destacado; corre em jsdom (vitest) e
 * no browser sem montar o componente. Cada chamada cria e destrói o editor.
 */
import { Editor } from '@tiptap/core';
import { createBaseEditorExtensions } from './extensions';

/**
 * Normaliza markdown fazendo o round-trip completo markdown → documento Tiptap →
 * markdown. Útil para testar fidelidade (idempotência) e para canonicalizar input
 * antes de persistir. Preserva cabeçalhos, negrito, itálico, listas, task lists
 * (checkbox marcado/desmarcado), links e blocos de código.
 */
export function normalizeMarkdown(input: string): string {
  const editor = new Editor({
    extensions: createBaseEditorExtensions(),
    content: input,
  });
  try {
    return editor.storage.markdown.getMarkdown();
  } finally {
    editor.destroy();
  }
}
