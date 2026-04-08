import { useState, useEffect, useCallback } from 'react';
import { Settings, Zap } from 'lucide-react';
import { loadConfig, saveConfig } from './lib/config';
import { THEMES, applyTheme } from './lib/themes';
import { useLocalStorage } from './hooks/useLocalStorage';
import GreetingWidget from './components/widgets/GreetingWidget';
import MorningBriefingWidget from './components/widgets/MorningBriefingWidget';
import TasksWidget from './components/widgets/TasksWidget';
import GitHubWidget from './components/widgets/GitHubWidget';
import LinksWidget from './components/widgets/LinksWidget';
import PomodoroWidget from './components/widgets/PomodoroWidget';
import NotesWidget from './components/widgets/NotesWidget';
import GoodnightWidget from './components/widgets/GoodnightWidget';
import OnboardingModal from './components/onboarding/OnboardingModal';
import SettingsModal from './components/layout/SettingsModal';
import type { NexusConfig, Task } from './types';

export default function App() {
  const [config, setConfig] = useState<NexusConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [tasks] = useLocalStorage<Task[]>('nexus_tasks', []);

  useEffect(() => {
    applyTheme(THEMES[config.theme]);
  }, [config.theme]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        document.getElementById('nexus-task-input')?.focus();
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        document.getElementById('nexus-pomodoro-btn')?.click();
      }
      if (e.key === 'Escape') {
        setShowSettings(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const updateConfig = useCallback((newConfig: NexusConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  if (!config.onboarded) {
    return <OnboardingModal config={config} onComplete={updateConfig} />;
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', sans-serif" }}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap size={18} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-bold tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>
            NEXUS
          </span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="px-6 pb-12 max-w-[1440px] mx-auto">
        <GreetingWidget name={config.name} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {/* Left — Briefing + Tasks (o core) */}
          <div className="space-y-5">
            <GoodnightWidget
              tasks={tasks}
              claudeApiKey={config.claudeApiKey}
              name={config.name}
            />
            <MorningBriefingWidget
              feeds={config.feeds}
              claudeApiKey={config.claudeApiKey}
              tasks={tasks}
              name={config.name}
            />
            <TasksWidget />
          </div>

          {/* Center — Notes + Links */}
          <div className="space-y-5">
            <NotesWidget />
            <LinksWidget
              links={config.quickLinks}
              onLinksChange={links => updateConfig({ ...config, quickLinks: links })}
            />
          </div>

          {/* Right — GitHub + Pomodoro */}
          <div className="space-y-5">
            <GitHubWidget token={config.githubToken} />
            <PomodoroWidget />
          </div>
        </div>
      </main>

      {showSettings && (
        <SettingsModal config={config} onSave={updateConfig} onClose={() => setShowSettings(false)} />
      )}

      <footer className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 py-2 text-[10px] opacity-30 hover:opacity-60 transition-opacity" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
        <span>N nova tarefa</span>
        <span>T timer</span>
        <span>ESC fechar</span>
      </footer>
    </div>
  );
}
