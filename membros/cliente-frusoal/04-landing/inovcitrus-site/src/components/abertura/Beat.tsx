import type { AberturaBeat } from '@/data/abertura/types';

interface BeatProps {
  beat: AberturaBeat;
  isClimax?: boolean; // beat 6 — destaque visual subtil
}

export const Beat = ({ beat, isClimax = false }: BeatProps) => (
  <section
    className={`max-w-prose mx-auto py-8 md:py-12 ${
      isClimax
        ? 'border-l-2 border-citrus pl-6 md:pl-8 -ml-0 md:-ml-8 bg-surface-warm/40 rounded-r-md'
        : ''
    }`}
    aria-labelledby={`beat-${beat.number}-title`}
  >
    <span
      className="font-mono text-xs tracking-widest text-citrus-dark uppercase block mb-2"
      aria-hidden="true"
    >
      {String(beat.number).padStart(2, '0')}
    </span>
    <h2
      id={`beat-${beat.number}-title`}
      className="font-sans text-2xl md:text-3xl font-bold text-ink leading-snug tracking-tight mb-5"
    >
      {beat.heading}
    </h2>
    <div className="space-y-4">
      {beat.paragraphs.map((p, idx) => (
        <p
          key={idx}
          className="text-base md:text-lg text-ink-muted leading-relaxed"
        >
          {p}
        </p>
      ))}
    </div>
  </section>
);
