/**
 * Nexus v2 — RestoreSettings component tests (Story 9.7, AC9)
 *
 * `react-component-test-criteria.md`: 4 estados de render distintos → teste de
 * componente obrigatório. 1 cenário por estado + 1 cenário de cancelamento:
 *   C1 — `idle`         → input + botão "Importar dados" desactivado (sem ficheiro).
 *   C2 — `a-importar`   → loading enquanto a importação corre.
 *   C3 — `sucesso`      → confirmação Lime com contagem + botão "Recarregar página".
 *   C4 — `erro`         → mensagem PT-PT mapeada por RestoreError.reason.
 *   C5 — `cancelamento` → confirmDestructive=false NÃO chama restoreZip, fica idle.
 *
 * Props injectáveis (`restoreZip`/`confirmDestructive`/`reloadPage`) evitam tocar
 * Dexie real, `window.confirm` real e recarregar a página (padrão BackupSettings).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestoreSettings } from '@/components/settings/RestoreSettings';
import { RestoreError, type RestoreSummary } from '@/lib/backup/restore';

function makeZipFile(): File {
  return new File([new Uint8Array([1, 2, 3])], 'nexus-backup.zip', {
    type: 'application/zip',
  });
}

function selectFile(): void {
  const input = screen.getByLabelText(/Ficheiro de backup/i);
  fireEvent.change(input, { target: { files: [makeZipFile()] } });
}

describe('RestoreSettings — estados de render (AC9)', () => {
  it('C1 — idle: input presente e botão "Importar dados" desactivado sem ficheiro', () => {
    render(<RestoreSettings />);
    expect(screen.getByLabelText(/Ficheiro de backup/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar dados/i })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('C2 — a-importar: mostra loading enquanto a importação corre', async () => {
    let resolveRestore: ((summary: RestoreSummary) => void) | undefined;
    const pending = new Promise<RestoreSummary>((resolve) => {
      resolveRestore = resolve;
    });
    const restoreZip = vi.fn(() => pending);
    const confirmDestructive = vi.fn(() => true);

    render(
      <RestoreSettings restoreZip={restoreZip} confirmDestructive={confirmDestructive} />,
    );

    selectFile();
    fireEvent.click(screen.getByRole('button', { name: /Importar dados/i }));

    expect(await screen.findByText(/A importar o backup/i)).toBeInTheDocument();
    expect(confirmDestructive).toHaveBeenCalledOnce();
    expect(restoreZip).toHaveBeenCalledOnce();

    // Resolve a importação e aguarda o flush final do UI (a-importar → sucesso)
    // DENTRO de act(...), tornando o teste determinístico e silenciando o aviso
    // React `act(...)` (REC-9.7-ACT-FLUSH — Architect Gate).
    resolveRestore?.({ tablesRestored: 22, rowsRestored: 100 });
    expect(await screen.findByText(/22 tabelas/i)).toBeInTheDocument();
  });

  it('C3 — sucesso: confirmação Lime com contagem + botão "Recarregar página"', async () => {
    const restoreZip = vi.fn(async (): Promise<RestoreSummary> => ({
      tablesRestored: 22,
      rowsRestored: 137,
    }));
    const confirmDestructive = vi.fn(() => true);
    const reloadPage = vi.fn();

    render(
      <RestoreSettings
        restoreZip={restoreZip}
        confirmDestructive={confirmDestructive}
        reloadPage={reloadPage}
      />,
    );

    selectFile();
    fireEvent.click(screen.getByRole('button', { name: /Importar dados/i }));

    const status = await screen.findByText(/22 tabelas/i);
    expect(status).toHaveTextContent(/22 tabelas/i);
    expect(status).toHaveTextContent(/137 registos/i);

    const reloadButton = screen.getByRole('button', { name: /Recarregar página/i });
    fireEvent.click(reloadButton);
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it('C4 — erro: mensagem PT-PT distinta mapeada por RestoreError.reason', async () => {
    const restoreZip = vi.fn(async (): Promise<RestoreSummary> => {
      throw new RestoreError('version-mismatch');
    });
    const confirmDestructive = vi.fn(() => true);

    render(
      <RestoreSettings restoreZip={restoreZip} confirmDestructive={confirmDestructive} />,
    );

    selectFile();
    fireEvent.click(screen.getByRole('button', { name: /Importar dados/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/versão incompatível/i);
    expect(alert).toHaveTextContent(/não foram alterados|nao foram alterados/i);
    // CTA de retentar disponível.
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('C5 — cancelamento: confirmDestructive=false NÃO chama restoreZip e fica idle', () => {
    const restoreZip = vi.fn(async (): Promise<RestoreSummary> => ({
      tablesRestored: 0,
      rowsRestored: 0,
    }));
    const confirmDestructive = vi.fn(() => false);

    render(
      <RestoreSettings restoreZip={restoreZip} confirmDestructive={confirmDestructive} />,
    );

    selectFile();
    fireEvent.click(screen.getByRole('button', { name: /Importar dados/i }));

    // A confirmação foi pedida, mas a importação NÃO foi disparada (AC9).
    expect(confirmDestructive).toHaveBeenCalledOnce();
    expect(restoreZip).not.toHaveBeenCalled();
    // Permanece em idle: sem loading, sem sucesso, sem erro.
    expect(screen.queryByText(/A importar o backup/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar dados/i })).toBeInTheDocument();
  });
});
