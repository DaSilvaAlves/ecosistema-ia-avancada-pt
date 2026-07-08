'use client';

import { useCallback, useState } from 'react';
import { backupFileName, buildBackupZip } from '@/lib/backup/export';

/**
 * Nexus v2 — Definições de Backup (Story 9.6, T3)
 *
 * Botão "Exportar dados" na página `/settings` (secção "Backup"). Dispara o
 * export client-side (`buildBackupZip`) e o download do ZIP resultante.
 *
 * Máquina de estados de render (`react-component-test-criteria.md` → ≥3 estados →
 * teste de componente obrigatório; 4 estados aqui):
 *   - `idle`       — botão "Exportar dados" activo.
 *   - `a-exportar` — loading enquanto o ZIP é montado (`aria-live`, botão desactivado).
 *   - `sucesso`    — confirmação PT-PT (Lime) + botão para exportar novamente.
 *   - `erro`       — mensagem PT-PT (Magenta) + CTA de retentar.
 *
 * Export inteiramente client-side e read-only (AC6/AC11): não escreve em Dexie,
 * não chama endpoints servidor. As strings PT-PT vivem AQUI, no componente.
 * Props injectáveis (`buildZip`/`fileName`/`triggerDownload`) para teste, sem
 * tocar o DOM real nem a base de dados (padrão `GoogleCalendarSettings.tsx`).
 *
 * Design system (`design-system-ia-avancada.md`): fundo `#04040A`, glassmorphism,
 * Inter, Cyan `#00F5FF`, Lime `#39FF14`, Magenta `#FF006E`.
 *
 * Trace: AC1, AC5, AC6, AC10.
 */

type RenderState = 'idle' | 'a-exportar' | 'sucesso' | 'erro';

/** Dispara o download do Blob no browser (default de `triggerDownload`). */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface BackupSettingsProps {
  /** Monta o ZIP de backup. Default: `buildBackupZip` (base de dados real). */
  buildZip?: () => Promise<Blob>;
  /** Gera o nome do ficheiro de download. Default: `backupFileName`. */
  fileName?: () => string;
  /** Dispara o download. Default: cria `<a download>` sintético e revoga a URL. */
  triggerDownload?: (blob: Blob, fileName: string) => void;
}

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  padding: '1.25rem',
  fontFamily: 'Inter, sans-serif',
  color: '#F0F4FF',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const PRIMARY_BUTTON_STYLE: React.CSSProperties = {
  background: '#00F5FF',
  boxShadow: '0 0 20px rgba(0,245,255,0.4)',
  color: '#04040A',
  padding: '0.65rem 1.4rem',
  borderRadius: 6,
  border: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  cursor: 'pointer',
  alignSelf: 'flex-start',
  transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

export function BackupSettings({
  buildZip = buildBackupZip,
  fileName = backupFileName,
  triggerDownload = downloadBlob,
}: BackupSettingsProps = {}): React.ReactElement {
  const [state, setState] = useState<RenderState>('idle');

  const handleExport = useCallback(async () => {
    setState('a-exportar');
    try {
      const blob = await buildZip();
      triggerDownload(blob, fileName());
      setState('sucesso');
    } catch (err) {
      // Diagnóstico: preserva a causa real da falha para debugging (CR minor).
      console.error('[backup] falha ao exportar backup:', err);
      setState('erro');
    }
  }, [buildZip, fileName, triggerDownload]);

  const exporting = state === 'a-exportar';

  return (
    <section style={CARD_STYLE} aria-labelledby="backup-heading">
      <h3 id="backup-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
        Backup
      </h3>

      <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}>
        Exporta todos os teus dados (tarefas, finanças, hábitos, diário, notas e
        mais) num único ficheiro ZIP. Uma cópia portátil que podes guardar fora do
        browser.
      </p>

      {state === 'sucesso' && (
        <span
          role="status"
          aria-live="polite"
          style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: 'rgba(57,255,20,0.08)',
            border: '1px solid rgba(57,255,20,0.2)',
            borderRadius: 20,
            color: '#39FF14',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            padding: '0.3rem 0.8rem',
          }}
        >
          Backup exportado
        </span>
      )}

      {state === 'erro' && (
        <p
          role="alert"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#FF006E' }}
        >
          Não foi possível exportar o backup. Tenta novamente dentro de momentos.
        </p>
      )}

      {exporting && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A exportar o backup…
        </p>
      )}

      <button
        type="button"
        style={PRIMARY_BUTTON_STYLE}
        onClick={handleExport}
        disabled={exporting}
        aria-disabled={exporting}
      >
        {state === 'sucesso' ? 'Exportar novamente' : 'Exportar dados'}
      </button>
    </section>
  );
}
