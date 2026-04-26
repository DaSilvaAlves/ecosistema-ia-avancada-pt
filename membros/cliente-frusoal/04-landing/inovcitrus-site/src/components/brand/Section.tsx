export interface SectionProps {
  id: string;
  number: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}

export const Section = ({ id, number, title, intro, children }: SectionProps) => {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <div className="mb-8">
        <p className="font-mono text-mono-tag uppercase tracking-wider text-algarve-dark mb-2">
          §{number}
        </p>
        <h2 className="font-display text-display-l font-semibold text-ink m-0">
          {title}
        </h2>
        {intro && (
          <p className="font-sans text-body-l text-ink-muted mt-4 max-w-prose">
            {intro}
          </p>
        )}
        <hr className="hatch-divider mt-6" />
      </div>
      {children}
    </section>
  );
};
