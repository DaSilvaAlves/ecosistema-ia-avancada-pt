import { useState } from 'react';
import { Plus, Trash2, Check, Calendar, Clock, MessageSquare, Play, Pause, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task } from '../../types';

const LISTS = ['Hoje', 'Esta semana', 'Pessoal'];
const PRIORITY_COLORS = { high: '#FF006E', medium: '#FFB800', low: '#39FF14' };
const PRIORITY_LABELS = { high: 'Alta', medium: 'Media', low: 'Baixa' };
const STATUS_CONFIG = {
  'todo': { label: 'Por fazer', color: 'var(--text-secondary)', icon: null },
  'in-progress': { label: 'A fazer', color: '#00F5FF', icon: Play },
  'blocked': { label: 'Bloqueada', color: '#FF006E', icon: AlertTriangle },
  'done': { label: 'Feita', color: '#39FF14', icon: Check },
};

function formatDueDate(dateStr?: string): string {
  if (!dateStr) return '';
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d atrasada`;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanha';
  if (diff < 7) return due.toLocaleDateString('pt-PT', { weekday: 'short' });
  return due.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

function getDueDateColor(dateStr?: string): string {
  if (!dateStr) return 'var(--text-secondary)';
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '#FF006E';
  if (diff === 0) return '#FFB800';
  return 'var(--text-secondary)';
}

export default function TasksWidget() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('nexus_tasks', []);
  const [activeList, setActiveList] = useState(LISTS[0]);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [contextInput, setContextInput] = useState('');

  const filtered = tasks
    .filter(t => t.list === activeList)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      // In-progress first
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
      // Blocked second
      if (a.status === 'blocked' && b.status !== 'blocked') return -1;
      if (b.status === 'blocked' && a.status !== 'blocked') return 1;
      // Then by due date
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      const pri = { high: 0, medium: 1, low: 2 };
      return pri[a.priority] - pri[b.priority];
    });

  const doneCount = filtered.filter(t => t.done).length;
  const totalCount = filtered.length;
  const inProgressCount = filtered.filter(t => t.status === 'in-progress').length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  function addTask() {
    if (!input.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: input.trim(),
      done: false,
      priority,
      list: activeList,
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
      status: 'todo',
    };
    setTasks(prev => [task, ...prev]);
    setInput('');
    setDueDate('');
    setShowDateInput(false);
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      return {
        ...t,
        done: nowDone,
        status: nowDone ? 'done' as const : 'todo' as const,
        lastWorkedAt: Date.now(),
      };
    }));
  }

  function setTaskStatus(id: string, status: Task['status']) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status, done: status === 'done', lastWorkedAt: Date.now() } : t
    ));
  }

  function saveContext(id: string) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, context: contextInput, lastWorkedAt: Date.now() } : t
    ));
    setEditingContext(null);
    setContextInput('');
  }

  function removeTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function clearDone() {
    setTasks(prev => prev.filter(t => t.list !== activeList || !t.done));
  }

  return (
    <Card title="Tarefas">
      <div className="space-y-3">
        {/* List tabs */}
        <div className="flex gap-1">
          {LISTS.map(list => {
            const count = tasks.filter(t => t.list === list && !t.done).length;
            return (
              <button
                key={list}
                onClick={() => setActiveList(list)}
                className="text-xs px-2.5 py-1 rounded-full transition-all font-medium flex items-center gap-1"
                style={{
                  background: activeList === list ? 'var(--accent)' : 'transparent',
                  color: activeList === list ? 'var(--bg)' : 'var(--text-secondary)',
                  border: activeList === list ? 'none' : '1px solid var(--border)',
                }}
              >
                {list}
                {count > 0 && (
                  <span className="text-[9px] px-1 rounded-full" style={{ background: activeList === list ? 'rgba(0,0,0,0.2)' : 'var(--border)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
            </div>
            {inProgressCount > 0 && (
              <p className="text-[10px] flex items-center gap-1" style={{ color: '#00F5FF', fontFamily: "'JetBrains Mono', monospace" }}>
                <Play size={8} fill="currentColor" /> {inProgressCount} em curso
              </p>
            )}
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Nova tarefa..."
              className="flex-1 text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              id="nexus-task-input"
            />
            <button
              onClick={addTask}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: 'var(--bg)', boxShadow: '0 0 12px var(--accent-glow)' }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full transition-all font-medium"
                  style={{
                    background: priority === p ? PRIORITY_COLORS[p] + '22' : 'transparent',
                    color: priority === p ? PRIORITY_COLORS[p] : 'var(--text-secondary)',
                    border: `1px solid ${priority === p ? PRIORITY_COLORS[p] + '44' : 'var(--border)'}`,
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDateInput(!showDateInput)}
              className="p-1 rounded transition-colors hover:bg-white/5"
              style={{ color: dueDate ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              <Calendar size={13} />
            </button>
            {showDateInput && (
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="text-xs px-2 py-0.5 rounded-lg bg-transparent outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', colorScheme: 'dark' }}
              />
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {filtered.map(task => {
            const statusConf = STATUS_CONFIG[task.status ?? 'todo'];
            return (
              <div key={task.id} className="rounded-lg group transition-colors hover:bg-white/5">
                <div className="flex items-start gap-2 px-2 py-2">
                  <button onClick={() => toggleTask(task.id)} className="shrink-0 mt-0.5">
                    <div
                      className="w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center transition-all"
                      style={{
                        borderColor: task.done ? 'var(--accent)' : PRIORITY_COLORS[task.priority],
                        background: task.done ? 'var(--accent)' : 'transparent',
                      }}
                    >
                      {task.done && <Check size={11} strokeWidth={3} style={{ color: 'var(--bg)' }} />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm leading-snug ${task.done ? 'line-through opacity-30' : ''}`} style={{ color: 'var(--text)' }}>
                      {task.text}
                    </span>

                    {/* Status + Due date row */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Status pills */}
                      {!task.done && (
                        <div className="flex gap-0.5">
                          {(['todo', 'in-progress', 'blocked'] as const).map(s => {
                            const conf = STATUS_CONFIG[s];
                            const active = (task.status ?? 'todo') === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setTaskStatus(task.id, s)}
                                className="text-[9px] px-1.5 py-0.5 rounded transition-all"
                                style={{
                                  background: active ? conf.color + '22' : 'transparent',
                                  color: active ? conf.color : 'var(--text-secondary)',
                                  border: `1px solid ${active ? conf.color + '44' : 'transparent'}`,
                                  opacity: active ? 1 : 0.5,
                                }}
                              >
                                {conf.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock size={9} style={{ color: getDueDateColor(task.dueDate) }} />
                          <span className="text-[10px] font-medium" style={{ color: getDueDateColor(task.dueDate), fontFamily: "'JetBrains Mono', monospace" }}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Context — "onde parei" */}
                    {task.context && editingContext !== task.id && (
                      <div
                        className="mt-1.5 text-xs px-2 py-1.5 rounded-md cursor-pointer hover:opacity-80"
                        style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)', color: 'var(--text-secondary)' }}
                        onClick={() => { setEditingContext(task.id); setContextInput(task.context ?? ''); }}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--accent)' }}>
                          Onde parei
                        </span>
                        {task.context}
                      </div>
                    )}

                    {/* Context edit */}
                    {editingContext === task.id && (
                      <div className="mt-1.5 space-y-1">
                        <textarea
                          value={contextInput}
                          onChange={e => setContextInput(e.target.value)}
                          placeholder="Onde paraste? O que falta fazer?"
                          autoFocus
                          className="w-full text-xs px-2 py-1.5 rounded-md bg-transparent outline-none resize-none"
                          style={{ border: '1px solid var(--accent)', color: 'var(--text)', minHeight: '48px' }}
                        />
                        <div className="flex gap-1">
                          <button onClick={() => saveContext(task.id)} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
                            Guardar
                          </button>
                          <button onClick={() => setEditingContext(null)} className="text-[10px] px-2 py-0.5 rounded" style={{ color: 'var(--text-secondary)' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!task.done && !task.context && editingContext !== task.id && (
                      <button
                        onClick={() => { setEditingContext(task.id); setContextInput(''); }}
                        title="Onde parei"
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <MessageSquare size={12} />
                      </button>
                    )}
                    <button onClick={() => removeTask(task.id)} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: '#FF006E' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>
              Sem tarefas. Adiciona uma acima.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs pt-1" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {doneCount}/{totalCount} completas
          </span>
          {doneCount > 0 && (
            <button onClick={clearDone} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              <Trash2 size={11} /> Limpar feitas
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
