'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Nexus v2 — Login page (Story 0.6)
 *
 * Glass card 480px central, fundo #04040A, logo NEXUS.
 * Loading state: spinner Cyan + "A validar...".
 * Erro: shake animation + texto Magenta.
 *
 * Conforme front-end-spec-v2.md §1.1 steps [3]-[5b].
 */

export default function LoginPage(): React.ReactElement {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const cardRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!password || loading) return;

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (resp.ok) {
        router.push('/');
        router.refresh();
        return;
      }

      const data = (await resp.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Password incorrecta. Verifica no Vercel.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } catch {
      setError('Sem rede — não foi possível contactar o servidor.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#04040A',
      }}
    >
      <form
        ref={cardRef}
        onSubmit={handleSubmit}
        aria-labelledby="login-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: shake ? 'nexus-shake 0.4s' : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <span style={{ color: '#00F5FF', fontSize: '28px', fontWeight: 800 }}>⚡</span>
          <h1
            id="login-title"
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: '1.6rem',
              letterSpacing: '0.05em',
              color: '#F0F4FF',
            }}
          >
            NEXUS
          </h1>
        </div>

        <label
          htmlFor="password"
          style={{
            display: 'block',
            marginBottom: '8px',
            color: '#8892A4',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
          }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: '#F0F4FF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />

        {error && (
          <p
            role="alert"
            data-testid="login-error"
            style={{
              marginTop: '12px',
              marginBottom: 0,
              color: '#FF006E',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px 20px',
            background: loading || !password ? 'rgba(0,245,255,0.4)' : '#00F5FF',
            color: '#04040A',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(0,245,255,0.4)',
            transition: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {loading ? 'A validar...' : 'Entrar'}
        </button>

        <p
          style={{
            marginTop: '20px',
            marginBottom: 0,
            textAlign: 'center',
            color: '#4A5568',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.05em',
          }}
        >
          single-user · configurado em env Vercel
        </p>
      </form>

      <style>{`
        @keyframes nexus-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </main>
  );
}
