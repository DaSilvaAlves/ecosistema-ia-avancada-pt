'use client';

import { useEffect, useState } from 'react';
import { Bell, MessageCircle, Calendar as CalendarIcon } from 'lucide-react';

/**
 * Nexus v2 — OnboardingModal (Story 0.7)
 *
 * 4 steps overlay fullscreen, abre se flag `nexus:onboarding:done` ausente.
 * Step 1: nome (default "Eurico"). Step 2: Web Push. Step 3: Google. Step 4: Telegram.
 * Steps 2-4 são saltáveis. Esc NÃO fecha (UX §1.1 [7]).
 *
 * Real OAuth/Push são stubs aqui — implementação real em Epic 4 (push) e Epic 6 (OAuth).
 */

const ONBOARDING_FLAG_KEY = 'nexus:onboarding:done';

interface OnboardingModalProps {
  onComplete?: () => void;
}

type StepNumber = 1 | 2 | 3 | 4;

export function OnboardingModal({ onComplete }: OnboardingModalProps): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<StepNumber>(1);
  const [name, setName] = useState('Eurico');
  const [pushDeclined, setPushDeclined] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Verifica flag no mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = window.localStorage.getItem(ONBOARDING_FLAG_KEY);
    if (done !== 'true') setOpen(true);
  }, []);

  // Bloqueia Esc (UX §1.1 [7])
  useEffect(() => {
    if (!open) return;
    function blockEsc(e: KeyboardEvent): void {
      if (e.key === 'Escape') e.preventDefault();
    }
    window.addEventListener('keydown', blockEsc);
    return () => window.removeEventListener('keydown', blockEsc);
  }, [open]);

  if (!open) return null;

  function next(): void {
    if (step < 4) setStep((step + 1) as StepNumber);
  }

  async function complete(): Promise<void> {
    setBusy(true);
    try {
      // POST stub — Epic 6 substitui por endpoint real persistido em KV
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pushDeclined }),
      }).catch(() => {
        // Endpoint pode não existir ainda — não bloqueia
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
      }
      setOpen(false);
      onComplete?.();
    } finally {
      setBusy(false);
    }
  }

  async function requestWebPush(): Promise<void> {
    if (typeof Notification === 'undefined') {
      setPushDeclined(true);
      next();
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setPushDeclined(true);
      } else {
        // Stub — Epic 4 implementa subscribe real
        await fetch('/api/push/subscribe', { method: 'POST' }).catch(() => null);
      }
      next();
    } catch {
      setPushDeclined(true);
      next();
    } finally {
      setBusy(false);
    }
  }

  async function validateTelegram(): Promise<void> {
    if (!telegramToken.trim()) {
      setTelegramError('Cola o token do BotFather.');
      return;
    }
    setBusy(true);
    setTelegramError(null);
    try {
      const resp = await fetch('/api/telegram/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken }),
      });
      if (!resp.ok) {
        setTelegramError('Token inválido. Verifica e tenta de novo.');
        return;
      }
      await complete();
    } catch {
      setTelegramError('Sem rede ou validação indisponível.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '32px 28px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <StepIndicator current={step} />

        {step === 1 && (
          <Step1
            id="onb-title"
            name={name}
            onNameChange={setName}
            onNext={next}
            busy={busy}
          />
        )}

        {step === 2 && (
          <Step2
            onActivate={requestWebPush}
            onSkip={() => {
              setPushDeclined(true);
              next();
            }}
            busy={busy}
          />
        )}

        {step === 3 && (
          <Step3
            onConnect={() => {
              // Stub — Epic 6 redirige para OAuth real
              window.location.href = '/api/google/oauth/google';
            }}
            onSkip={next}
            busy={busy}
          />
        )}

        {step === 4 && (
          <Step4
            token={telegramToken}
            onTokenChange={setTelegramToken}
            error={telegramError}
            onValidate={validateTelegram}
            onSkip={complete}
            busy={busy}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: StepNumber }): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 24,
      }}
    >
      {([1, 2, 3, 4] as StepNumber[]).map((n) => (
        <div
          key={n}
          aria-hidden="true"
          style={{
            width: n === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: n <= current ? '#00F5FF' : 'rgba(255,255,255,0.16)',
            transition: 'all 0.25s',
          }}
        />
      ))}
    </div>
  );
}

interface StepProps {
  busy: boolean;
}

function Step1({
  id,
  name,
  onNameChange,
  onNext,
  busy,
}: StepProps & {
  id: string;
  name: string;
  onNameChange: (v: string) => void;
  onNext: () => void;
}): React.ReactElement {
  return (
    <div>
      <h2
        id={id}
        style={{
          margin: '0 0 16px 0',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: '1.25rem',
          color: '#F0F4FF',
        }}
      >
        Olá. Vou ser o teu Nexus.
      </h2>
      <p style={{ margin: '0 0 16px 0', color: '#8892A4', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Como te chamas?
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
        aria-label="Nome"
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem',
          outline: 'none',
        }}
      />
      <PrimaryButton onClick={onNext} disabled={busy || !name.trim()}>
        Continuar
      </PrimaryButton>
    </div>
  );
}

function Step2({
  onActivate,
  onSkip,
  busy,
}: StepProps & { onActivate: () => void; onSkip: () => void }): React.ReactElement {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Bell size={24} color="#00F5FF" />
        <h2 style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#F0F4FF' }}>
          Preciso de notificar-te de lembretes
        </h2>
      </div>
      <p style={{ margin: '0 0 20px 0', color: '#8892A4', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Sem push, lembretes só aparecem quando estás na app.
      </p>
      <PrimaryButton onClick={onActivate} disabled={busy}>
        Activar Web Push
      </PrimaryButton>
      <GhostButton onClick={onSkip} disabled={busy}>
        Saltar
      </GhostButton>
    </div>
  );
}

function Step3({
  onConnect,
  onSkip,
  busy,
}: StepProps & { onConnect: () => void; onSkip: () => void }): React.ReactElement {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <CalendarIcon size={24} color="#00F5FF" />
        <h2 style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#F0F4FF' }}>
          Queres ligar Google Calendar / Gmail?
        </h2>
      </div>
      <p style={{ margin: '0 0 20px 0', color: '#8892A4', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Sincronização opcional — podes ligar mais tarde nas Definições.
      </p>
      <PrimaryButton onClick={onConnect} disabled={busy}>
        Ligar Google
      </PrimaryButton>
      <GhostButton onClick={onSkip} disabled={busy}>
        Saltar
      </GhostButton>
    </div>
  );
}

function Step4({
  token,
  onTokenChange,
  error,
  onValidate,
  onSkip,
  busy,
}: StepProps & {
  token: string;
  onTokenChange: (v: string) => void;
  error: string | null;
  onValidate: () => void;
  onSkip: () => void;
}): React.ReactElement {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <MessageCircle size={24} color="#00F5FF" />
        <h2 style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#F0F4FF' }}>
          Receber lembretes/briefing por Telegram?
        </h2>
      </div>
      <p style={{ margin: '0 0 12px 0', color: '#8892A4', fontSize: '0.85rem', lineHeight: 1.6 }}>
        1. Abre @BotFather no Telegram<br />
        2. Cria um bot novo (`/newbot`)<br />
        3. Cola aqui o token que ele te dá
      </p>
      <input
        type="text"
        value={token}
        onChange={(e) => onTokenChange(e.target.value)}
        placeholder="123456:ABC-DEF..."
        aria-label="Token Telegram"
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.025)',
          border: error ? '1px solid #FF006E' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#F0F4FF',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.85rem',
          outline: 'none',
        }}
      />
      {error && (
        <p role="alert" style={{ margin: '8px 0 0 0', color: '#FF006E', fontSize: '0.8rem' }}>
          {error}
        </p>
      )}
      <PrimaryButton onClick={onValidate} disabled={busy}>
        Validar e concluir
      </PrimaryButton>
      <GhostButton onClick={onSkip} disabled={busy}>
        Saltar
      </GhostButton>
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        marginTop: 20,
        padding: '12px 20px',
        background: disabled ? 'rgba(0,245,255,0.4)' : '#00F5FF',
        color: '#04040A',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: '0.95rem',
        border: 'none',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 0 20px rgba(0,245,255,0.4)',
        transition: '0.2s',
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        marginTop: 8,
        padding: '12px 20px',
        background: 'transparent',
        color: '#F0F4FF',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '0.9rem',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: '0.2s',
      }}
    >
      {children}
    </button>
  );
}
