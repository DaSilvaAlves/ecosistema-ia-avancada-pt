import type { AberturaSources } from '@/data/abertura/types';

interface SourcesAccordionProps {
  sources: AberturaSources;
  toggleLabel: string; // localizado: "Ver todas as fontes" / "Show all sources" / etc.
}

export const SourcesAccordion = ({ sources, toggleLabel }: SourcesAccordionProps) => (
  <section
    id="fontes"
    className="max-w-content mx-auto py-12 md:py-16 scroll-mt-24"
    aria-labelledby="sources-heading"
  >
    <header className="max-w-prose mb-8">
      <h2
        id="sources-heading"
        className="font-sans text-3xl md:text-4xl font-extrabold text-ink leading-tight tracking-tight mb-4"
      >
        {sources.heading}
      </h2>
      <p className="text-base md:text-lg text-ink-muted leading-relaxed">
        {sources.intro}
      </p>
    </header>
    <details className="group rounded-md border border-surface-border bg-surface">
      <summary className="cursor-pointer list-none p-5 flex items-center justify-between text-ink hover:text-citrus-dark transition-colors">
        <span className="font-sans font-bold">{toggleLabel}</span>
        <span
          aria-hidden="true"
          className="font-mono text-citrus-dark transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <ol className="border-t border-surface-border list-none">
        {sources.lines.map(line => (
          <li
            key={line.id}
            className="px-5 py-3 border-b border-surface-border last:border-b-0 flex flex-col md:flex-row md:items-baseline md:gap-4 text-sm"
          >
            <span className="font-mono font-bold text-citrus-dark md:w-12 md:flex-shrink-0">
              {line.id}
            </span>
            <span className="flex-1 text-ink-muted">
              {line.url && line.url !== '#' ? (
                <a
                  href={line.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-citrus-dark hover:underline"
                >
                  {line.title}
                </a>
              ) : (
                line.title
              )}
            </span>
            <span className="font-mono text-xs text-ink-subtle md:flex-shrink-0">
              {line.date}
            </span>
          </li>
        ))}
      </ol>
    </details>
  </section>
);
