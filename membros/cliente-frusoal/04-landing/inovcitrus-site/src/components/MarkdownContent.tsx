interface MarkdownContentProps {
  html: string;
}

// Renderizador de conteúdo markdown convertido. As classes prose vêm do plugin
// @tailwindcss/typography com tokens customizados na paleta InovCitrus.

export const MarkdownContent = ({ html }: MarkdownContentProps) => (
  <div
    className="prose prose-lg max-w-prose
      prose-headings:font-sans prose-headings:tracking-tight prose-headings:text-ink
      prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:font-extrabold prose-h1:mb-2
      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-ink
      prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-ink
      prose-p:text-ink-muted prose-p:leading-relaxed
      prose-strong:text-ink prose-strong:font-bold
      prose-a:text-citrus-dark prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-4 prose-blockquote:border-citrus prose-blockquote:bg-surface-warm
      prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:not-italic
      prose-blockquote:text-ink-muted
      prose-table:text-sm prose-th:bg-surface-warm prose-th:text-ink
      prose-th:font-bold prose-td:border-surface-border
      prose-hr:border-surface-border
      prose-li:text-ink-muted
      prose-em:text-ink-muted prose-em:italic
      prose-code:text-citrus-dark prose-code:bg-surface-warm prose-code:px-1.5 prose-code:py-0.5
      prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);
