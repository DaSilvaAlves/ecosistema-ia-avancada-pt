export interface ContrastBadgeProps {
  ratio: number;
  scale?: 'normal' | 'large';
}

const getCompliance = (ratio: number, scale: 'normal' | 'large') => {
  if (scale === 'large') {
    if (ratio >= 4.5) return { level: 'AAA', color: 'pomar' as const };
    if (ratio >= 3) return { level: 'AA', color: 'pomar' as const };
    return { level: 'FAIL', color: 'critico' as const };
  }
  if (ratio >= 7) return { level: 'AAA', color: 'pomar' as const };
  if (ratio >= 4.5) return { level: 'AA', color: 'pomar' as const };
  return { level: 'FAIL', color: 'critico' as const };
};

export const ContrastBadge = ({ ratio, scale = 'normal' }: ContrastBadgeProps) => {
  const { level, color } = getCompliance(ratio, scale);
  const bgClass = color === 'pomar' ? 'bg-pomar text-ink' : 'bg-critico text-surface-warm';

  return (
    <span
      className={`inline-flex items-center gap-1 ${bgClass} font-mono text-mono-tag uppercase rounded-badge px-2 py-0.5`}
      title={`Ratio ${ratio.toFixed(2)} · ${scale === 'large' ? 'Large text' : 'Normal text'}`}
    >
      <span className="opacity-80">{ratio.toFixed(1)}</span>
      <span aria-hidden="true">·</span>
      <span className="font-bold">{level}</span>
    </span>
  );
};
