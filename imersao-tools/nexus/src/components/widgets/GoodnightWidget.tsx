import { useState } from 'react';
import { Moon, Sun, Check, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Note, NightSnapshot } from '../../types';

interface GoodnightWidgetProps {
  tasks: Task[];
  claudeApiKey?: string;
  name: string;
}

const SNAPSHOT_KEY = 'nexus_night_snapshot';

export default function GoodnightWidget({ tasks, claudeApiKey, name }: GoodnightWidgetProps) {
  const [notes] = useLocalStorage<Note[]>('nexus_notes', []);
  const [snapshot, setSnapshot] = useLocalStorage<NightSnapshot | null>(SNAPSHOT_KEY, null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const hasTodaySnapshot = snapshot?.date === today;

  // Check if it's "night mode" (after 21:00 or before 07:00)
  const hour = new Date().getHours();
  const isNightTime = hour >= 21 || hour < 7;

  async function doGoodnight() {
    setSaving(true);

    const inProgress = tasks
      .filter(t => t.status === 'in-progress' && !t.done)
      .map(t => ({ text: t.text, context: t.context ?? '', list: t.list, priority: t.priority }));

    const pending = tasks
      .filter(t => !t.done && t.status !== 'in-progress')
      .map(t => ({ text: t.text, dueDate: t.dueDate, priority: t.priority }));

    const completedToday = tasks.filter(t => {
      if (!t.done || !t.lastWorkedAt) return false;
      return new Date(t.lastWorkedAt).toISOString().slice(0, 10) === today;
    }).length;

    const noteContents = notes
      .filter(n => n.content.trim())
      .map(n => n.content.trim());

    // Get pomodoro sessions
    let pomodoroSessions = 0;
    try {
      const pomo = localStorage.getItem('nexus_pomodoro');
      if (pomo) {
        const parsed = JSON.parse(pomo);
        if (parsed.lastResetDate === today) pomodoroSessions = parsed.sessionsToday;
      }
    } catch { /* ignore */ }

    const snap: NightSnapshot = {
      timestamp: Date.now(),
      date: today,
      tasksInProgress: inProgress,
      tasksPending: pending,
      tasksCompletedToday: completedToday,
      notes: noteContents,
      pomodoroSessions,
    };

    // Generate AI briefing if key available
    if (claudeApiKey) {
      setGenerating(true);
      try {
        const inProgressText = inProgress.length > 0
          ? `Tarefas a meio:\n${inProgress.map(t => `- ${t.text}${t.context ? ` (onde parou: ${t.context})` : ''}`).join('\n')}`
          : 'Nenhuma tarefa a meio.';

        const pendingText = pending.length > 0
          ? `Tarefas pendentes:\n${pending.map(t => `- [${t.priority}] ${t.text}${t.dueDate ? ` (prazo: ${t.dueDate})` : ''}`).join('\n')}`
          : 'Nenhuma tarefa pendente.';

        const notesText = noteContents.length > 0
          ? `Notas activas:\n${noteContents.map(n => `- ${n.slice(0, 100)}`).join('\n')}`
          : '';

        const prompt = `Es o assistente pessoal do ${name}. Ele vai dormir agora. Gera um briefing para quando ele acordar amanha.

Estado actual:
- ${completedToday} tarefas concluidas hoje
- ${pomodoroSessions} sessoes de foco hoje

${inProgressText}

${pendingText}

${notesText}

Gera um briefing matinal em PT-PT com:
1. Resumo do que fez hoje (1 frase)
2. O que ficou a meio e onde parou (se houver contexto)
3. Por onde comecar amanha — a tarefa mais urgente/importante primeiro
4. Lembrete de prazos proximos (se houver)

Tom: directo, pratico, sem floreados. Maximo 5-6 frases. Comeca com "Bom dia, ${name}."`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          snap.briefing = data.content?.[0]?.text ?? '';
        }
      } catch (err) {
        console.error('Briefing generation error:', err);
      } finally {
        setGenerating(false);
      }
    }

    setSnapshot(snap);
    setSaving(false);
  }

  // Morning view — show last night's snapshot
  if (hasTodaySnapshot && snapshot.briefing && !isNightTime) {
    return (
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sun size={14} style={{ color: '#FFB800' }} />
            <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#FFB800', fontFamily: "'JetBrains Mono', monospace" }}>
              Briefing matinal
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {snapshot.briefing}
          </p>
          {snapshot.tasksInProgress.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                A meio
              </span>
              {snapshot.tasksInProgress.map((t, i) => (
                <div key={i} className="text-xs px-2 py-1.5 rounded-md" style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
                  <span style={{ color: 'var(--text)' }}>{t.text}</span>
                  {t.context && (
                    <span className="block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Onde paraste: {t.context}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Night view — show goodnight button
  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Moon size={14} style={{ color: '#9D00FF' }} />
          <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#9D00FF', fontFamily: "'JetBrains Mono', monospace" }}>
            {hasTodaySnapshot ? 'Sessao guardada' : 'Fim do dia'}
          </h3>
        </div>

        {hasTodaySnapshot ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs" style={{ color: '#39FF14' }}>
              <Check size={12} /> Snapshot guardado as {new Date(snapshot.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[10px] space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
              <p>{snapshot.tasksCompletedToday} tarefas concluidas</p>
              <p>{snapshot.tasksInProgress.length} a meio</p>
              <p>{snapshot.tasksPending.length} pendentes</p>
              <p>{snapshot.pomodoroSessions} sessoes de foco</p>
            </div>
            {snapshot.briefing && (
              <p className="text-xs leading-relaxed mt-2 pt-2" style={{ color: 'var(--text)', borderTop: '1px solid var(--border)' }}>
                {snapshot.briefing}
              </p>
            )}
            <button
              onClick={doGoodnight}
              disabled={saving || generating}
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Actualizar snapshot
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Guarda o estado do teu dia. Amanha o Nexus diz-te por onde comecar.
            </p>
            <button
              onClick={doGoodnight}
              disabled={saving || generating}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(157,0,255,0.3), rgba(0,245,255,0.15))',
                border: '1px solid rgba(157,0,255,0.3)',
                color: 'var(--text)',
                boxShadow: '0 0 30px rgba(157,0,255,0.15)',
              }}
            >
              {generating ? (
                <>
                  <Sparkles size={16} className="animate-pulse" /> A gerar briefing...
                </>
              ) : saving ? (
                <>A guardar...</>
              ) : (
                <>
                  <Moon size={16} /> Boa noite
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
