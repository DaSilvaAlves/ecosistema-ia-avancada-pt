/**
 * Nexus v2 — BackupSettings component tests (Story 9.6, AC10)
 *
 * `react-component-test-criteria.md`: ≥3 estados de render distintos → teste de
 * componente obrigatório. 4 estados, 1 cenário por estado:
 *   C1 — `idle`       → botão "Exportar dados".
 *   C2 — `a-exportar` → estado de loading enquanto o ZIP é montado.
 *   C3 — `sucesso`    → confirmação + download disparado com o nome correcto (AC5).
 *   C4 — `erro`       → mensagem PT-PT quando o export falha.
 *
 * Props injectáveis (`buildZip`/`fileName`/`triggerDownload`) evitam tocar a base
 * de dados real e o DOM de download (padrão `GoogleCalendarSettings.tsx`).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackupSettings } from '@/components/settings/BackupSettings';

describe('BackupSettings — estados de render (AC10)', () => {
  it('C1 — idle: mostra botão "Exportar dados"', () => {
    render(<BackupSettings />);
    expect(
      screen.getByRole('button', { name: /Exportar dados/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('C2 — a-exportar: mostra estado de loading enquanto o ZIP é montado', async () => {
    // buildZip que nunca resolve → o estado a-exportar permanece visível.
    let resolveZip: (() => void) | undefined;
    const pending = new Promise<Blob>((resolve) => {
      resolveZip = () => resolve(new Blob(['x'], { type: 'application/zip' }));
    });
    const buildZip = vi.fn(() => pending);
    const triggerDownload = vi.fn();

    render(<BackupSettings buildZip={buildZip} triggerDownload={triggerDownload} />);

    fireEvent.click(screen.getByRole('button', { name: /Exportar dados/i }));

    expect(await screen.findByText(/A exportar o backup/i)).toBeInTheDocument();
    // Botão desactivado durante o export (evita duplo clique).
    expect(screen.getByRole('button', { name: /Exportar dados/i })).toBeDisabled();

    resolveZip?.();
  });

  it('C3 — sucesso: confirma e dispara o download com o nome de ficheiro (AC5)', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' });
    const buildZip = vi.fn(async () => blob);
    const triggerDownload = vi.fn();
    const fileName = vi.fn(() => 'nexus-backup-2026-07-09T14-30-00.zip');

    render(
      <BackupSettings buildZip={buildZip} fileName={fileName} triggerDownload={triggerDownload} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Exportar dados/i }));

    expect(await screen.findByText(/Backup exportado/i)).toBeInTheDocument();
    expect(triggerDownload).toHaveBeenCalledWith(
      blob,
      'nexus-backup-2026-07-09T14-30-00.zip',
    );
    // Após sucesso, o botão permite exportar novamente.
    expect(
      screen.getByRole('button', { name: /Exportar novamente/i }),
    ).toBeEnabled();
  });

  it('C4 — erro: mostra mensagem PT-PT quando o export falha', async () => {
    const buildZip = vi.fn(async () => {
      throw new Error('falha simulada');
    });
    const triggerDownload = vi.fn();

    render(<BackupSettings buildZip={buildZip} triggerDownload={triggerDownload} />);

    fireEvent.click(screen.getByRole('button', { name: /Exportar dados/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Não foi possível exportar|Nao foi possivel exportar/i);
    // Não disparou download em caso de falha.
    expect(triggerDownload).not.toHaveBeenCalled();
  });
});
