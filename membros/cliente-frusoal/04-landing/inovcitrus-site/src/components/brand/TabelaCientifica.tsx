export interface CientificaColumn {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface CientificaFootnote {
  marker: string;
  text: string;
  sourceId?: string;
}

export interface TabelaCientificaProps {
  caption: string;
  columns: CientificaColumn[];
  rows: Record<string, string | number>[];
  footnotes?: CientificaFootnote[];
}

export const TabelaCientifica = ({
  caption,
  columns,
  rows,
  footnotes = []
}: TabelaCientificaProps) => {
  return (
    <div className="my-8">
      <table className="w-full border-collapse text-left">
        <caption className="font-mono text-mono-tag uppercase text-algarve-dark text-left pb-3 caption-top">
          {caption}
        </caption>
        <thead>
          <tr className="border-t-2 border-b-2 border-algarve-dark">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`font-mono text-mono-tag uppercase text-algarve-dark py-3 px-4 ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-surface-border hover:bg-pergaminho transition-colors duration-fast"
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={`font-sans text-body-s text-ink py-3 px-4 ${
                    col.align === 'right'
                      ? 'text-right tabular-nums'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {row[col.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footnotes.length > 0 && (
        <ol className="mt-4 space-y-1">
          {footnotes.map((fn) => (
            <li
              key={fn.marker}
              className="font-mono text-mono-footnote italic text-tinta"
            >
              <sup className="not-italic">{fn.marker}</sup> {fn.text}
              {fn.sourceId && (
                <span className="not-italic ml-2 font-medium">· {fn.sourceId}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
