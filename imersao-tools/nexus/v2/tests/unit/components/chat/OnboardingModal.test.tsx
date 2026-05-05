import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '@/components/chat/OnboardingModal';

/**
 * Nexus v2 — OnboardingModal tests (Story 0.11)
 *
 * Story 0.11 (F.4) — Google OAuth real só chega em Epic 6. O botão "Ligar Google"
 * deve ficar desactivado com tooltip "Disponível em breve...". O botão "Saltar"
 * continua a fazer avançar para o Step 4. Este ficheiro também cobre regressões
 * mínimas dos Steps 1, 2 e 4 (smoke da Story 0.7 original).
 */

const ONBOARDING_FLAG_KEY = 'nexus:onboarding:done';

const ORIGINAL_LOCATION = window.location;

function clearOnboardingFlag(): void {
  window.localStorage.removeItem(ONBOARDING_FLAG_KEY);
}

function advanceToStep3(): void {
  // Step 1 — nome default "Eurico"
  const continuar = screen.getByRole('button', { name: /continuar/i });
  fireEvent.click(continuar);
  // Step 2 — saltar Web Push
  const saltarPush = screen.getByRole('button', { name: /saltar/i });
  fireEvent.click(saltarPush);
}

describe('OnboardingModal — Step 3 Google disable (Story 0.11 / F.4)', () => {
  beforeEach(() => {
    clearOnboardingFlag();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: ORIGINAL_LOCATION,
    });
  });

  it('Step 3: botão "Ligar Google" está desactivado', () => {
    render(<OnboardingModal />);
    advanceToStep3();
    const ligarGoogle = screen.getByRole('button', { name: /ligar google/i });
    expect(ligarGoogle).toBeDisabled();
    expect(ligarGoogle).toHaveAttribute('aria-disabled', 'true');
  });

  it('Step 3: botão "Ligar Google" tem tooltip "Disponível em breve..."', () => {
    render(<OnboardingModal />);
    advanceToStep3();
    const ligarGoogle = screen.getByRole('button', { name: /ligar google/i });
    expect(ligarGoogle).toHaveAttribute(
      'title',
      'Disponível em breve — integração Google Calendar/Gmail a chegar.'
    );
  });

  it('Step 3: clicar em "Ligar Google" não muda window.location.href', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: 'http://localhost/' },
    });
    render(<OnboardingModal />);
    advanceToStep3();
    const ligarGoogle = screen.getByRole('button', { name: /ligar google/i });
    fireEvent.click(ligarGoogle);
    expect(window.location.href).toBe('http://localhost/');
  });

  it('Step 3: "Saltar" avança para Step 4 (Telegram)', () => {
    render(<OnboardingModal />);
    advanceToStep3();
    const saltar = screen.getByRole('button', { name: /^saltar$/i });
    fireEvent.click(saltar);
    expect(screen.getByLabelText(/token telegram/i)).toBeInTheDocument();
  });
});

describe('OnboardingModal — smoke regressão (Story 0.7)', () => {
  beforeEach(() => {
    clearOnboardingFlag();
  });

  it('não renderiza nada se flag de onboarding já está done', () => {
    window.localStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
    const { container } = render(<OnboardingModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it('Step 1: input nome aparece com default "Eurico"', () => {
    render(<OnboardingModal />);
    const nome = screen.getByLabelText(/nome/i) as HTMLInputElement;
    expect(nome.value).toBe('Eurico');
  });
});
