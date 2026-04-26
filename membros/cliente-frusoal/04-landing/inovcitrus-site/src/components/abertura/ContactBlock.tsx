import type { AberturaContact } from '@/data/abertura/types';

interface ContactBlockProps {
  contact: AberturaContact;
}

export const ContactBlock = ({ contact }: ContactBlockProps) => (
  <section
    className="max-w-prose mx-auto py-12 md:py-16"
    aria-labelledby="contact-heading"
  >
    <h2
      id="contact-heading"
      className="font-sans text-3xl md:text-4xl font-extrabold text-ink leading-tight tracking-tight mb-6"
    >
      {contact.heading}
    </h2>
    <div className="border-l-2 border-citrus pl-6 md:pl-8 py-2">
      <p className="font-sans text-xl md:text-2xl font-bold text-ink mb-1">
        {contact.name}
      </p>
      <p className="font-mono text-sm tracking-wider text-citrus-dark mb-4">
        {contact.brand}
      </p>
      {contact.phone && (
        <p className="text-base text-ink-muted mb-1">
          <a
            href={`tel:${contact.phone.replace(/\s+/g, '')}`}
            className="hover:text-citrus-dark"
          >
            {contact.phone}
          </a>
        </p>
      )}
      {contact.email && (
        <p className="text-base text-ink-muted mb-1">
          <a href={`mailto:${contact.email}`} className="hover:text-citrus-dark">
            {contact.email}
          </a>
        </p>
      )}
      {!contact.phone && !contact.email && (
        <p className="text-sm text-ink-subtle italic mb-1">
          {/* Placeholder visível para Eurico preencher antes do envio a Pedro */}
          [contacto a definir antes do envio]
        </p>
      )}
      <p className="text-sm text-ink-subtle italic mt-4">{contact.note}</p>
    </div>
  </section>
);
