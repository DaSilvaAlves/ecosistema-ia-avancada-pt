'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { usePomodoro } from '@/hooks/usePomodoro';
import { WidgetCard } from './WidgetCard';
import { formatDuration } from '@/lib/shared/format';

/**
 * Nexus v2 — PomodoroWidget (Story 0.8, portado de v1 + extensão UX)
 *
 * Timer Pomodoro com hook portado. Suporta "Ligar a tarefa?" via dropdown
 * Dexie reactivo. Se DB vazia (Story 0.3 deixa schema vazio), mostra
 * "Sem tarefas ainda" sem crash.
 */

export function PomodoroWidget(): React.ReactElement {
  const { state, toggle, reset } = usePomodoro();
  const [taskLinkOpen, setTaskLinkOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const tasks = useLiveQuery(() => db.tasks.where('status').notEqual('done').toArray(), []);

  const time = formatDuration(state.timeLeft);
  const label = state.isBreak ? 'Pausa' : 'Trabalho';

  return (
    <WidgetCard title="Pomodoro">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: state.isRunning ? '#00F5FF' : '#F0F4FF',
            letterSpacing: '0.05em',
          }}
        >
          {time}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8892A4',
          }}
        >
          {label} · {state.sessionsToday} hoje
        </span>
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          <button
            type="button"
            onClick={toggle}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: state.isRunning ? 'transparent' : '#00F5FF',
              color: state.isRunning ? '#F0F4FF' : '#04040A',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: state.isRunning ? '1px solid rgba(255,255,255,0.16)' : 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {state.isRunning ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reiniciar"
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: '#8892A4',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setTaskLinkOpen((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8892A4',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.75rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {taskLinkOpen ? '▾' : '▸'} Ligar a tarefa?
        </button>

        {taskLinkOpen && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 6,
              fontSize: '0.8rem',
            }}
          >
            {tasks === undefined && <span style={{ color: '#4A5568' }}>A carregar...</span>}
            {tasks && tasks.length === 0 && (
              <span style={{ color: '#4A5568' }}>Sem tarefas ainda</span>
            )}
            {tasks && tasks.length > 0 && (
              <select
                value={selectedTaskId ?? ''}
                onChange={(e) => setSelectedTaskId(e.target.value || null)}
                aria-label="Tarefa a ligar"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  color: '#F0F4FF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.8rem',
                }}
              >
                <option value="">— sem tarefa —</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
