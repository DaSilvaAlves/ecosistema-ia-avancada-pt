interface IdentitySidebarSection {
  id: string;
  number: string;
  label: string;
}

export interface IdentitySidebarProps {
  sections: IdentitySidebarSection[];
  ariaLabel?: string;
}

export const IdentitySidebar = ({
  sections,
  ariaLabel = 'Navegação do sistema visual'
}: IdentitySidebarProps) => {
  return (
    <nav
      aria-label={ariaLabel}
      className="lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
    >
      <p className="font-mono text-mono-tag uppercase tracking-wider text-algarve-dark mb-4">
        Sistema Visual · v1.0
      </p>
      <ol className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group flex items-baseline gap-3 py-1 text-ink-muted hover:text-citrus-dark transition-colors duration-fast border-l-2 border-transparent hover:border-citrus-dark pl-3 -ml-3"
            >
              <span className="font-mono text-mono-footnote text-algarve-dark group-hover:text-citrus-dark">
                {section.number}
              </span>
              <span className="font-sans text-body-s">{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};
