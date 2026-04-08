import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import Card from '../ui/Card';
import { usePomodoro } from '../../hooks/usePomodoro';

export default function PomodoroWidget() {
  const { state, toggle, reset } = usePomodoro();

  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalTime = state.isBreak ? 5 * 60 : 25 * 60;
  const progress = ((totalTime - state.timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card title={state.isBreak ? 'Pausa' : 'Focus'}>
      <div className="flex flex-col items-center gap-3">
        {/* Circular timer */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="3" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {display}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2.5 rounded-full transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              boxShadow: state.isRunning ? `0 0 20px var(--accent-glow)` : 'none',
            }}
            id="nexus-pomodoro-btn"
          >
            {state.isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Sessions */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Timer size={12} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {state.sessionsToday} {state.sessionsToday === 1 ? 'sessao' : 'sessoes'} hoje
          </span>
        </div>
      </div>
    </Card>
  );
}
