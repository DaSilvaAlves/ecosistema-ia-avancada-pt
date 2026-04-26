export interface FichaPragaSection {
  title: string;
  content: string | string[];
  type?: 'paragraph' | 'list';
}

export interface FichaPragaMetadata {
  label: string;
  value: string;
}

export interface FichaPragaProps {
  plateId: string;
  category: string;
  commonName: string;
  scientificName: string;
  metadata?: FichaPragaMetadata[];
  sections: FichaPragaSection[];
  sourceFootnoteIds: string[];
}

export const FichaPraga = ({
  plateId,
  category,
  commonName,
  scientificName,
  metadata = [],
  sections,
  sourceFootnoteIds
}: FichaPragaProps) => {
  return (
    <article className="bg-surface-warm border border-algarve-dark rounded-plate p-8 md:p-10 max-w-prose">
      <p className="font-mono text-mono-tag uppercase text-algarve-dark mb-3">
        {plateId} · {category}
      </p>

      <h1 className="font-display text-display-l font-semibold text-ink m-0">
        {commonName}
      </h1>
      <p className="font-mono text-mono-code italic text-tinta mt-1 mb-6">
        {scientificName}
      </p>

      {metadata.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-6">
          {metadata.map((m) => (
            <div key={m.label} className="contents">
              <dt className="font-mono text-mono-footnote uppercase tracking-wider text-algarve-dark">
                {m.label}
              </dt>
              <dd className="font-sans text-body-s text-ink m-0">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <hr className="border-0 border-t-2 border-algarve-dark opacity-50 my-6" />

      {sections.map((section) => (
        <section key={section.title} className="mb-6 last:mb-0">
          <h2 className="font-sans text-body-s font-bold uppercase tracking-wider text-algarve-dark m-0 mb-2">
            {section.title}
          </h2>
          <hr className="hatch-divider mb-3" />
          {section.type === 'list' && Array.isArray(section.content) ? (
            <ul className="font-sans text-body-m text-ink space-y-1.5 m-0 pl-5 list-disc marker:text-citrus-dark">
              {section.content.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-body-m text-ink m-0">
              {Array.isArray(section.content)
                ? section.content.join(' ')
                : section.content}
            </p>
          )}
        </section>
      ))}

      <hr className="border-0 border-t-2 border-algarve-dark opacity-50 my-6" />

      <p className="font-mono text-mono-footnote text-tinta tracking-wider">
        Fontes · {sourceFootnoteIds.join(' ')}
      </p>
    </article>
  );
};
