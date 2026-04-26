export interface QuoteFBlocoProps {
  quote: string;
  author?: string;
  authorRole?: string;
  date?: string;
  sourceFootnoteId: string;
  variant?: 'default' | 'dark' | 'inline';
}

const variantStyles = {
  default: {
    container: 'bg-pergaminho border-l-4 border-citrus-dark px-10 py-8 rounded-r-plate',
    quote: 'text-ink',
    quoteMark: 'text-citrus-dark',
    divider: 'bg-algarve-dark',
    author: 'text-ink',
    meta: 'text-algarve-dark',
    source: 'text-tinta'
  },
  dark: {
    container: 'bg-tinta border-l-4 border-solar px-10 py-8 rounded-r-plate',
    quote: 'text-solar',
    quoteMark: 'text-solar',
    divider: 'bg-pergaminho',
    author: 'text-pergaminho',
    meta: 'text-pergaminho opacity-80',
    source: 'text-pergaminho opacity-90'
  },
  inline: {
    container: 'border-l-2 border-citrus-dark pl-6 py-2',
    quote: 'text-ink',
    quoteMark: 'text-citrus-dark',
    divider: 'bg-algarve-dark',
    author: 'text-ink',
    meta: 'text-algarve-dark',
    source: 'text-tinta'
  }
} as const;

export const QuoteFBloco = ({
  quote,
  author,
  authorRole,
  date,
  sourceFootnoteId,
  variant = 'default'
}: QuoteFBlocoProps) => {
  const styles = variantStyles[variant];

  return (
    <figure className={styles.container}>
      <blockquote
        className={`font-display text-pull-quote italic font-normal m-0 ${styles.quote}`}
      >
        <span className={`${styles.quoteMark} font-semibold`} aria-hidden="true">«&nbsp;</span>
        {quote}
        <span className={`${styles.quoteMark} font-semibold`} aria-hidden="true">&nbsp;»</span>
      </blockquote>

      {(author || date) && (
        <>
          <hr className={`border-0 h-px w-16 mt-6 mb-3 opacity-30 ${styles.divider}`} />
          <figcaption>
            {author && (
              <p className={`font-sans text-base font-semibold m-0 ${styles.author}`}>
                {author}
              </p>
            )}
            {(authorRole || date) && (
              <p className={`font-sans text-body-s italic mt-0.5 m-0 ${styles.meta}`}>
                {authorRole && <span>{authorRole}</span>}
                {authorRole && date && <span aria-hidden="true"> · </span>}
                {date && <span>{date}</span>}
              </p>
            )}
          </figcaption>
        </>
      )}

      <p className={`font-mono text-mono-footnote tracking-wider mt-4 m-0 ${styles.source}`}>
        {sourceFootnoteId}
      </p>
    </figure>
  );
};
