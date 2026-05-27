'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAccounts } from '@/hooks/useAccounts';
import {
  aggregateByAccountType,
  computeTotalPatrimony,
  type AccountTypeGroup,
} from '@/lib/financas/patrimonyAggregations';
import { formatCurrency } from '@/lib/financas/formatCurrency';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — Vista "Património" (Story 3.9 / FR20)
 *
 * Page read-only que mostra:
 *   - KPI Total do Património (`Σ balance` com sinal preservado, cor lime/magenta/white).
 *   - Acordeão por `Account.type` (Conta à ordem / Poupança / Dinheiro) com
 *     drilldown inline das contas individuais. Estado inicial: todos os grupos
 *     expandidos por defeito.
 *   - Badge "Descoberto" magenta em contas com `balance < 0`.
 *
 * Trace: Story 3.9 ACs 2-9; [AUTO-DECISIONS] A1-A7. Reutiliza `useAccounts`
 * (Story 3.1) + `patrimonyAggregations` (este módulo). Candidata a reuso pela
 * Story 3.11 (`consultar_balanço`).
 *
 * [AUTO-DECISION] A1: `Account` não tem `bankName` (`types/db.ts:98-104`) —
 * agrupar por `type`. Constitution Artigo IV.
 *
 * [AUTO-DECISION] A2: saldo de referência puro (`Account.balance`), sem cruzar
 * com transações. Saldo vivo fora de scope.
 *
 * [AUTO-DECISION] A3: sub-rota `/financas/patrimonio`, não tab. Simétrico a
 * `/financas/mes` e `/financas/cartoes`.
 *
 * NÃO modifica `components/ui/Header.tsx` — link de descoberta vive em
 * `app/(app)/financas/page.tsx` ([AUTO-DECISION] A7).
 */

const ROOT_STYLE: React.CSSProperties = {
  minHeight: '100dvh',
  background: '#04040A',
  color: '#F0F4FF',
  fontFamily: 'Inter, sans-serif',
};

const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
  padding: '1.5rem 1.5rem 4rem',
};

const SECTION_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.025)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(12px)',
  padding: '1.25rem 1.5rem',
  marginTop: '1.5rem',
};

interface KpiProps {
  totalCents: number;
  accountCount: number;
}

function TotalKpi({ totalCents, accountCount }: KpiProps): React.ReactElement {
  const kpiColor =
    totalCents > 0 ? '#39FF14' : totalCents < 0 ? '#FF006E' : '#F0F4FF';
  return (
    <section
      style={{ ...SECTION_STYLE, marginTop: '2rem' }}
      aria-label="Total do Património"
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#8892A4',
          textTransform: 'uppercase',
        }}
      >
        Total do Património
      </div>
      <div
        style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          color: kpiColor,
          marginTop: '0.4rem',
          fontFamily: 'JetBrains Mono, monospace',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatCurrency(totalCents)}
      </div>
      <div
        style={{
          marginTop: '0.4rem',
          color: '#8892A4',
          fontSize: '0.78rem',
        }}
      >
        {accountCount} {accountCount === 1 ? 'conta' : 'contas'}
      </div>
    </section>
  );
}

interface GroupSectionProps {
  group: AccountTypeGroup;
  isOpen: boolean;
  onToggle: () => void;
}

function GroupSection({
  group,
  isOpen,
  onToggle,
}: GroupSectionProps): React.ReactElement {
  const subtotalColor = group.subtotalCents >= 0 ? '#39FF14' : '#FF006E';
  const panelId = `patrimonio-panel-${group.type}`;
  const buttonId = `patrimonio-btn-${group.type}`;

  return (
    <section
      style={SECTION_STYLE}
      aria-labelledby={buttonId}
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: '#F0F4FF',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span
            aria-hidden
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              color: '#8892A4',
              minWidth: '0.85em',
            }}
          >
            {isOpen ? '▾' : '▸'}
          </span>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {group.labelPT}
          </span>
          <span
            style={{
              color: '#8892A4',
              fontSize: '0.78rem',
            }}
          >
            ({group.count} {group.count === 1 ? 'conta' : 'contas'})
          </span>
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: subtotalColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(group.subtotalCents)}
        </span>
      </button>

      {isOpen && (
        <div
          role="region"
          id={panelId}
          aria-labelledby={buttonId}
          style={{ marginTop: '1rem' }}
        >
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {group.accounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

interface AccountRowProps {
  account: Account;
}

function AccountRow({ account }: AccountRowProps): React.ReactElement {
  const isOverdraft = account.balance < 0;
  const balanceColor = isOverdraft ? '#FF006E' : '#F0F4FF';

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '0.5rem',
        padding: '0.55rem 0.75rem',
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.92rem',
            color: '#F0F4FF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {account.name}
        </span>
        {isOverdraft && (
          <span
            style={{
              fontSize: '0.6rem',
              fontFamily: 'JetBrains Mono, monospace',
              background: 'rgba(255, 0, 110, 0.12)',
              border: '1px solid rgba(255, 0, 110, 0.3)',
              color: '#FF006E',
              padding: '0.12rem 0.55rem',
              borderRadius: 16,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Descoberto
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: balanceColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatCurrency(account.balance)}
      </span>
    </li>
  );
}

export default function PatrimonioPage(): React.ReactElement {
  const router = useRouter();
  const accounts = useAccounts();

  const groups = useMemo(
    () => (accounts === undefined ? undefined : aggregateByAccountType(accounts)),
    [accounts],
  );
  const totalCents = useMemo(
    () => (accounts === undefined ? 0 : computeTotalPatrimony(accounts)),
    [accounts],
  );

  // Estado inicial: todos os grupos expandidos por defeito ([AUTO-DECISION] A4).
  // O Set guarda os tipos colapsados (modelo invertido) — assim, novos grupos
  // que apareçam após o mount começam expandidos sem necessidade de re-init.
  const [collapsed, setCollapsed] = useState<Set<Account['type']>>(() => new Set());

  function toggleGroup(type: Account['type']): void {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const isLoading = accounts === undefined;
  const isEmpty = !isLoading && accounts.length === 0;

  return (
    <main style={ROOT_STYLE}>
      <div style={CONTAINER_STYLE}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00F5FF',
                fontSize: '0.8rem',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                padding: 0,
                marginBottom: '0.5rem',
              }}
            >
              ← Voltar
            </button>
            <h1
              lang="pt-PT"
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#F0F4FF',
              }}
            >
              Património
            </h1>
          </div>
        </header>

        {isLoading ? (
          <section
            style={{ ...SECTION_STYLE, marginTop: '2rem' }}
            aria-label="A carregar"
          >
            <p
              style={{
                margin: 0,
                color: '#8892A4',
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              A carregar contas…
            </p>
          </section>
        ) : isEmpty ? (
          <>
            <TotalKpi totalCents={0} accountCount={0} />
            <section style={SECTION_STYLE} aria-label="Sem contas">
              <p
                style={{
                  margin: 0,
                  color: '#8892A4',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Sem contas registadas. Cria a primeira em{' '}
                <Link
                  href="/financas"
                  style={{ color: '#00F5FF', textDecoration: 'underline' }}
                >
                  Finanças
                </Link>
                .
              </p>
            </section>
          </>
        ) : (
          <>
            <TotalKpi totalCents={totalCents} accountCount={accounts.length} />
            {groups !== undefined &&
              groups.map((group) => (
                <GroupSection
                  key={group.type}
                  group={group}
                  isOpen={!collapsed.has(group.type)}
                  onToggle={() => toggleGroup(group.type)}
                />
              ))}
          </>
        )}
      </div>
    </main>
  );
}
