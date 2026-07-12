'use client';

import { useCallback, useState } from 'react';
import {
  restoreFromZip,
  RestoreError,
  type RestoreErrorReason,
  type RestoreSummary,
} from '@/lib/backup/restore';

/**
 * Nexus v2 — Definições de Restore/Import (Story 9.7)
 *
 * Cartão "Importar dados" na página `/settings` (secção "Backup"), a seguir ao
 * `BackupSettings` da Story 9.6. Recebe um ZIP de backup, confirma de forma
 * DESTRUTIVA com o utilizador e restaura todas as tabelas Dexie.
 *
 * Máquina de estados de render (`react-component-test-criteria.md` → ≥3 estados →
 * teste de componente obrigatório; 4 estados aqui):
 *   - `idle`       — input de ficheiro + botão "Importar dados" (desactivado até
 *                    haver ficheiro seleccionado).
 *   - `a-importar` — loading durante a importação (`aria-live`, botão desactivado).
 *   - `sucesso`    — confirmação PT-PT (Lime) com contagem de tabelas + botão
 *                    "Recarregar página" (rede de segurança, AC8).
 *   - `erro`       — mensagem PT-PT (Magenta) mapeada por `RestoreError.reason` +
 *                    CTA de retentar.
 *
 * CONFIRMAÇÃO DESTRUTIVA (AC5): antes de qualquer chamada a `restoreZip`, o
 * utilizador vê um `window.confirm` explícito PT-PT (mesmo padrão de
 * `TaskKebabMenu.tsx` L145). Cancelar → permanece `idle` SEM escrever (AC9).
 * `window.confirm` nativo é decisão aceite (débito REC-9.7-CONFIRM-MODAL, Baixa).
 *
 * Props injectáveis (`restoreZip`/`confirmDestructive`/`reloadPage`) para teste,
 * sem tocar Dexie real, `window.confirm` real nem recarregar a página (padrão
 * `BackupSettings.tsx`).
 *
 * Design system (`design-system-ia-avancada.md`): fundo `#04040A`, glassmorphism,
 * Inter, Cyan `#00F5FF`, Lime `#39FF14`, Magenta `#FF006E`.
 *
 * Trace: AC1, AC5, AC8, AC9.
 */

type RenderState = 'idle' | 'a-importar' | 'sucesso' | 'erro';

/** Texto exacto da confirmação destrutiva (AC5). */
export const CONFIRM_MESSAGE =
  'Isto vai SUBSTITUIR todos os teus dados actuais pelos dados deste backup. ' +
  'Esta acção não pode ser desfeita. Continuar?';

/** Mensagens PT-PT distintas por causa de falha (AC eixo c — sem genérico ambíguo). */
const ERROR_MESSAGES: Record<RestoreErrorReason, string> = {
  'missing-json':
    'Este ficheiro não é um backup válido do Nexus (não contém os dados esperados). Os teus dados actuais não foram alterados.',
  'invalid-format':
    'O ficheiro de backup está corrompido ou não é um formato reconhecível. Os teus dados actuais não foram alterados.',
  'name-mismatch':
    'Este backup pertence a outra base de dados. Restauro cancelado — os teus dados actuais não foram alterados.',
  'version-mismatch':
    'Este backup foi feito com uma versão incompatível da app. Restauro cancelado — os teus dados actuais não foram alterados.',
  'transaction-failed':
    'Ocorreu um erro a meio da importação. Os teus dados actuais foram mantidos intactos — nada foi alterado.',
};

export interface RestoreSettingsProps {
  /** Restaura a partir do ZIP. Default: `restoreFromZip` (base de dados real). */
  restoreZip?: (zipBlob: Blob) => Promise<RestoreSummary>;
  /** Confirmação destrutiva. Default: `window.confirm`. Devolve `true` para prosseguir. */
  confirmDestructive?: (message: string) => boolean;
  /** Recarrega a página (rede de segurança do sucesso). Default: `window.location.reload`. */
  reloadPage?: () => void;
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

const DISABLED_BUTTON_STYLE: React.CSSProperties = {
  ...PRIMARY_BUTTON_STYLE,
  background: '#4A5568',
  boxShadow: 'none',
  color: '#8892A4',
  cursor: 'not-allowed',
};

export function RestoreSettings({
  restoreZip = restoreFromZip,
  confirmDestructive = (message) => window.confirm(message),
  reloadPage = () => window.location.reload(),
}: RestoreSettingsProps = {}): React.ReactElement {
  const [state, setState] = useState<RenderState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [errorReason, setErrorReason] = useState<RestoreErrorReason | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    // Seleccionar um novo ficheiro volta ao ponto de partida (limpa sucesso/erro).
    setState('idle');
    setSummary(null);
    setErrorReason(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    // AC5/AC9: confirmação destrutiva ANTES de qualquer chamada a restoreZip.
    // Cancelar → permanece idle SEM escrever nada.
    if (!confirmDestructive(CONFIRM_MESSAGE)) {
      return;
    }

    setState('a-importar');
    try {
      const result = await restoreZip(file);
      setSummary(result);
      setState('sucesso');
    } catch (err) {
      // Diagnóstico: preserva a causa real para debugging.
      console.error('[restore] falha ao importar backup:', err);
      const reason: RestoreErrorReason =
        err instanceof RestoreError ? err.reason : 'transaction-failed';
      setErrorReason(reason);
      setState('erro');
    }
  }, [file, confirmDestructive, restoreZip]);

  const importing = state === 'a-importar';
  const canImport = file !== null && !importing;

  return (
    <section style={CARD_STYLE} aria-labelledby="restore-heading">
      <h3 id="restore-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
        Importar dados
      </h3>

      <p style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}>
        Restaura os teus dados a partir de um ficheiro ZIP de backup. Isto{' '}
        <strong style={{ color: '#FF006E' }}>substitui</strong> todos os dados
        actuais pelos do backup — a acção não pode ser desfeita.
      </p>

      <input
        type="file"
        accept=".zip"
        aria-label="Ficheiro de backup"
        onChange={handleFileChange}
        disabled={importing}
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          color: '#F0F4FF',
        }}
      />

      {state === 'sucesso' && summary && (
        <>
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
            Backup restaurado — {summary.tablesRestored} tabelas, {summary.rowsRestored} registos
          </span>
          <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={reloadPage}>
            Recarregar página
          </button>
        </>
      )}

      {state === 'erro' && errorReason && (
        <p
          role="alert"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#FF006E' }}
        >
          {ERROR_MESSAGES[errorReason]}
        </p>
      )}

      {importing && (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, lineHeight: 1.8, fontSize: '0.95rem', color: '#8892A4' }}
        >
          A importar o backup…
        </p>
      )}

      {state !== 'sucesso' && (
        <button
          type="button"
          style={canImport ? PRIMARY_BUTTON_STYLE : DISABLED_BUTTON_STYLE}
          onClick={handleImport}
          disabled={!canImport}
          aria-disabled={!canImport}
        >
          {state === 'erro' ? 'Tentar novamente' : 'Importar dados'}
        </button>
      )}
    </section>
  );
}
