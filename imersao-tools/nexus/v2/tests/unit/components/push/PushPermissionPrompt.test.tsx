/**
 * Nexus v2 — PushPermissionPrompt component tests (Story 4.7, AC12)
 *
 * `react-component-test-criteria.md`: o componente tem 3 estados de render
 * distintos (≥3) → teste de componente obrigatório, 1 cenário por estado:
 *   C1 — `default`  → botão "Activar notificações"; clicar → subscribe().
 *   C2 — `granted` + subscrito → badge "Notificações activas" + "Desactivar".
 *   C3 — `denied`   → mensagem de bloqueio, sem botão.
 *
 * `usePushSubscription` é mockado (vi.mock) — testamos só o render por estado.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks/usePushSubscription', () => ({
  usePushSubscription: vi.fn(),
}));

import { PushPermissionPrompt } from '@/components/push/PushPermissionPrompt';
import { usePushSubscription } from '@/hooks/usePushSubscription';

const usePushMock = vi.mocked(usePushSubscription);

const subscribe = vi.fn();
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PushPermissionPrompt', () => {
  it('C1 — estado default: botão "Activar notificações" chama subscribe()', () => {
    usePushMock.mockReturnValue({
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      subscribe,
      unsubscribe,
    });

    render(<PushPermissionPrompt />);
    const button = screen.getByRole('button', { name: 'Activar notificações' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('C2 — granted + subscrito: badge "Notificações activas" + botão "Desactivar"', () => {
    usePushMock.mockReturnValue({
      permission: 'granted',
      isSubscribed: true,
      isLoading: false,
      subscribe,
      unsubscribe,
    });

    render(<PushPermissionPrompt />);
    expect(screen.getByText('Notificações activas')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Desactivar' });
    fireEvent.click(button);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('C3 — denied: mensagem de bloqueio, sem botão', () => {
    usePushMock.mockReturnValue({
      permission: 'denied',
      isSubscribed: false,
      isLoading: false,
      subscribe,
      unsubscribe,
    });

    render(<PushPermissionPrompt />);
    expect(
      screen.getByText(/O teu browser bloqueou as notificações/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
