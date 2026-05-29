'use client';

/**
 * Nexus v2 — FormField (Story 4.2 — D-3.5-3, AC1)
 *
 * Componente de campo de formulário partilhado. Extrai o padrão `Field`
 * (label + slot + helper + erro) que estava inline e duplicado nos modais de
 * finanças (`AccountFormModal`, `TransactionFormModal`, etc. — Stories 3.3-3.6).
 *
 * Sem estado interno (componente apresentacional — trivial pela
 * `react-component-test-criteria.md`). Os modais novos do Epic 4 usam-no; os
 * modais de finanças NÃO são refactorados nesta story (débito de housekeeping
 * registado na Story 4.2 — R4).
 *
 * Design system (`design-system-ia-avancada.md`): label em JetBrains Mono
 * uppercase Grey (`#8892A4`), erro em Magenta (`#FF006E`), helper em Grey2.
 *
 * O `<label htmlFor={id}>` liga ao input real passado em `children` (que deve
 * ter `id={id}`). Quando `error` está presente, renderiza um `<span
 * role="alert" id="{id}-error">` — o input pode referenciá-lo via
 * `aria-describedby={`${id}-error`}`.
 */

interface FormFieldProps {
  /** id do input real (passado em `children`) — liga `<label htmlFor>` e o id do erro. */
  id: string;
  label: string;
  required?: boolean;
  /** Texto auxiliar mostrado apenas quando não há erro. */
  helper?: string;
  /** Mensagem de erro PT-PT — quando presente, renderiza `<span role="alert">`. */
  error?: string;
  /** O input/select/textarea real. */
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  required,
  helper,
  error,
  children,
}: FormFieldProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#8892A4',
          textTransform: 'uppercase',
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: '#FF006E' }}>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {helper !== undefined && error === undefined && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.72rem',
            color: '#4A5568',
            fontStyle: 'italic',
          }}
        >
          {helper}
        </span>
      )}
      {error !== undefined && (
        <span
          id={`${id}-error`}
          role="alert"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#FF006E',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Estilo de input partilhado — extraído do `inputStyle()` inline dos modais de
 * finanças (D-3.5-3). Glassmorphism leve, texto White, sem outline nativo.
 */
export function fieldInputStyle(): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem',
    color: '#F0F4FF',
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    padding: '0.55rem 0.7rem',
    outline: 'none',
    width: '100%',
  };
}
