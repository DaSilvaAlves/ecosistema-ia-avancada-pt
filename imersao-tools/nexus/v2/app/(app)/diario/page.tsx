'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import {
  createJournalEntry,
  getJournalEntryByDate,
  updateJournalEntry,
  deleteJournalEntry,
} from '@/lib/db/repos/journal-entries';
import { getLast6MonthsRange, type Mood } from '@/lib/diario/mood-heatmap';
import { MoodHeatmap } from '@/components/diario/MoodHeatmap';
import { JournalEntriesList } from '@/components/diario/JournalEntriesList';
import { JournalEntryModal } from '@/components/diario/JournalEntryModal';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — Página /diario (Story 5.3 — FR42/FR44)
 *
 * Rota: /diario — App Router page com 'use client' (Dexie via useLiveQuery exige
 * client component). Camada de UI sobre os repos/hooks da Story 5.1 e o
 * `MarkdownEditor` da Story 5.2. Não reimplementa data access.
 *
 * Composição (AC1):
 *   1. Cabeçalho — título "Diário" + botão "+ Nova entrada / Editar hoje".
 *   2. Heatmap de mood (~6 meses) — clicar num dia abre/cria a entrada (AC3).
 *   3. Lista de entradas recentes — clicar abre para edição.
 *   4. Modal CRUD (editor 5.2 + selector de mood + data) — AC2.
 *
 * 1 entrada por dia (FR42, R1): `getJournalEntryByDate` decide criar-vs-editar na
 * persistência. O heatmap/lista usam a janela de 6 meses (`useJournalEntries(range)`).
 */

/** Data de hoje em `YYYY-MM-DD` (UTC, coerente com a derivação da 4.2/5.1). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type ModalState = { date: string; existingEntry: JournalEntry | undefined } | null;

export default function DiarioPage(): React.ReactElement {
  const router = useRouter();

  // `today` calculado uma só vez (estável entre renders) — evita off-by-one e
  // recomputar o range a cada update do useLiveQuery.
  const [today] = useState(todayISO);
  const range = useMemo(() => getLast6MonthsRange(today), [today]);
  const entries = useJournalEntries(range);

  const [modal, setModal] = useState<ModalState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openerEl, setOpenerEl] = useState<HTMLElement | null>(null);

  // Escape global → router.back (só com o modal fechado; o modal trata o seu Escape).
  useEffect(() => {
    function handleEscape(e: KeyboardEvent): void {
      if (modal !== null) return;
      if (e.key === 'Escape') router.back();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [router, modal]);

  // Auto-dismiss do toast de erro após 4s.
  useEffect(() => {
    if (errorMessage === null) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  function rememberOpener(): void {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) setOpenerEl(active);
    }
  }

  function closeModal(): void {
    setModal(null);
    if (openerEl !== null) {
      setTimeout(() => openerEl.focus(), 0);
      setOpenerEl(null);
    }
  }

  // Abre o modal para um dia: procura a entrada existente na janela carregada.
  const openDay = useCallback(
    (date: string): void => {
      rememberOpener();
      const existingEntry = entries?.find((e) => e.date === date);
      setModal({ date, existingEntry });
    },
    [entries],
  );

  // Botão do cabeçalho — entrada de hoje (criar ou editar).
  const handleNewOrEditToday = useCallback((): void => {
    openDay(today);
  }, [openDay, today]);

  // Persistência (R1): o parent decide create vs update por data, via
  // `getJournalEntryByDate` — robusto mesmo que a data tenha sido alterada no modal.
  const handleSubmit = useCallback(
    async (input: { id: string; date: string; mood: Mood; bodyMarkdown: string }): Promise<void> => {
      try {
        const existing = await getJournalEntryByDate(input.date);
        if (existing !== undefined) {
          await updateJournalEntry(existing.id, {
            mood: input.mood,
            bodyMarkdown: input.bodyMarkdown,
          });
        } else {
          await createJournalEntry({
            id: input.id,
            date: input.date,
            mood: input.mood,
            bodyMarkdown: input.bodyMarkdown,
          });
        }
      } catch (error) {
        console.error('Erro ao guardar entrada de diário', error);
        setErrorMessage('Erro ao guardar a entrada — tenta novamente.');
        throw error;
      }
    },
    [],
  );

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteJournalEntry(id);
    } catch (error) {
      console.error('Erro ao apagar entrada de diário', error);
      setErrorMessage('Erro ao apagar a entrada — tenta novamente.');
      throw error;
    }
  }, []);

  const todayEntryExists = entries?.some((e) => e.date === today) ?? false;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem 1.5rem 1rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#F0F4FF',
          }}
        >
          Diário
        </h1>
        <button
          type="button"
          onClick={handleNewOrEditToday}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#04040A',
            background: '#00F5FF',
            border: 'none',
            borderRadius: 6,
            padding: '0.55rem 1.2rem',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)',
          }}
        >
          {todayEntryExists ? 'Editar hoje' : '+ Nova entrada'}
        </button>
      </header>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          padding: '0 1.5rem 1.5rem',
          flex: 1,
        }}
      >
        <section aria-label="Heatmap de humor">
          <MoodHeatmap entries={entries} todayISO={today} onSelectDay={openDay} />
        </section>

        <section aria-label="Entradas de diário" style={{ flex: 1 }}>
          <h2
            style={{
              margin: '0 0 12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: '#F0F4FF',
            }}
          >
            Entradas recentes
          </h2>
          <JournalEntriesList entries={entries} onSelect={openDay} />
        </section>
      </div>

      {modal !== null && (
        <JournalEntryModal
          date={modal.date}
          existingEntry={modal.existingEntry}
          minDate={range.from}
          maxDate={today}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}

      {errorMessage !== null && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            padding: '0.7rem 1.2rem',
            background: 'rgba(255, 0, 110, 0.15)',
            border: '1px solid rgba(255, 0, 110, 0.4)',
            borderRadius: 8,
            color: '#FF006E',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
