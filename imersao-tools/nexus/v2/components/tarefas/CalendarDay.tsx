'use client';

import type { CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tag, Task } from '@/types/db';
import { CalendarCard } from '@/components/tarefas/CalendarCard';
import type { CalendarDay as CalendarDayType } from '@/lib/tarefas/weekRange';

/**
 * Nexus v2 — CalendarDay (Story 2.5 — AC2 + AC6 + AC9)
 *
 * Coluna de um dia no calendário semanal. Drop target via `useDroppable({ id: day.iso })`.
 *
 * Visual:
 *   - Header: label PT-PT abreviado (JetBrains Mono 0.65rem) + número do dia.
 *   - Accent stripe top cyan 2px se `day.isToday === true`.
 *   - Glassmorphism (`rgba(255,255,255,0.025)` + border 0.08).
 *   - Drop zone: border glow cyan quando `isOver === true`.
 *   - Min-height 120px (R2 da story). Expande verticalmente se houver muitos chips.
 *
 * Acessibilidade (AC6):
 *   - `role="region"` + `aria-label` PT-PT longo (ex: "Segunda-feira, 12 de Maio, 3 tarefas").
 *
 * AC9: tolera dias vazios (sem placeholder text — "calendário vazio é normal").
 */

interface CalendarDayProps {
  day: CalendarDayType;
  tasks: Task[];
  tagsLookup: ReadonlyMap<string, Tag>;
  getProjectName: (projectId: string | null) => string | undefined;
  /** Overrides actuais (taskId → ISO) — apenas para verificar se o chip está em transição. */
  overridesRef: { current: Record<string, string> };
}

export function CalendarDay({
  day,
  tasks,
  tagsLookup,
  getProjectName,
  overridesRef,
}: CalendarDayProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: day.iso });

  const taskCount = tasks.length;

  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.025)',
    border: `1px solid ${isOver ? 'rgba(0, 245, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: 12,
    minHeight: 120,
    padding: '0.6rem',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: isOver ? '0 0 24px rgba(0, 245, 255, 0.25)' : 'none',
    gap: 8,
  };

  const accentStripeColor = day.isToday ? '#00F5FF' : 'transparent';
  const headerLabelColor = day.isToday ? '#00F5FF' : '#8892A4';
  const headerNumberColor = day.isToday ? '#F0F4FF' : '#F0F4FF';

  const taskCountLabel = `${taskCount} ${taskCount === 1 ? 'tarefa' : 'tarefas'}`;

  // IDs estáveis para o SortableContext (chips desta coluna)
  const taskIds = tasks.map((t) => t.id);

  return (
    <section
      ref={setNodeRef}
      role="region"
      aria-label={`${day.longLabel}, ${day.dayNumber} de ${day.monthLabel}, ${taskCountLabel}`}
      data-day-iso={day.iso}
      data-is-today={day.isToday ? 'true' : 'false'}
      style={containerStyle}
    >
      {/* Accent stripe top (isToday) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accentStripeColor,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      />

      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingBottom: 6,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: headerLabelColor,
              textTransform: 'uppercase',
            }}
          >
            {day.label}
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: headerNumberColor,
              lineHeight: 1,
            }}
          >
            {day.dayNumber}
          </span>
        </div>

        {taskCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: '#8892A4',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.1rem 0.4rem',
              borderRadius: 10,
              minWidth: 22,
              textAlign: 'center',
            }}
          >
            {taskCount}
          </span>
        )}
      </header>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
          }}
        >
          {tasks.map((task) => (
            <CalendarCard
              key={task.id}
              task={task}
              projectName={task.projectId !== null ? getProjectName(task.projectId) : undefined}
              tagsLookup={tagsLookup}
              isMoving={overridesRef.current[task.id] !== undefined}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
