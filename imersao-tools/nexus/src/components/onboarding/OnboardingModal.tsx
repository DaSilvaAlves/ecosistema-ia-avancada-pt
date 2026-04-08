import { useState } from 'react';
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { THEMES } from '../../lib/themes';
import { DEFAULT_FEEDS } from '../../lib/config';
import type { NexusConfig, ThemeName, FeedSource } from '../../types';

interface OnboardingModalProps {
  config: NexusConfig;
  onComplete: (config: NexusConfig) => void;
}

export default function OnboardingModal({ config, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(config.name);
  const [feeds, setFeeds] = useState<FeedSource[]>(config.feeds);
  const [theme, setTheme] = useState<ThemeName>(config.theme);
  const [githubToken, setGithubToken] = useState(config.githubToken ?? '');
  const [claudeKey, setClaudeKey] = useState(config.claudeApiKey ?? '');

  const steps = [
    // Step 0: Name
    <div key="name" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
        Como te chamas?
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Para a saudacao matinal.
      </p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="O teu nome"
        autoFocus
        className="w-full text-lg px-4 py-3 rounded-xl bg-transparent outline-none"
        style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </div>,

    // Step 1: Feeds
    <div key="feeds" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
        Que feeds acompanhas?
      </h2>
      <div className="space-y-2">
        {feeds.map(feed => (
          <label key={feed.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={feed.enabled}
              onChange={() => setFeeds(prev => prev.map(f => f.id === feed.id ? { ...f, enabled: !f.enabled } : f))}
              className="accent-[var(--accent)]"
            />
            <span className="text-sm" style={{ color: 'var(--text)' }}>{feed.name}</span>
          </label>
        ))}
      </div>
    </div>,

    // Step 2: Theme
    <div key="theme" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
        Escolhe o tema
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(THEMES).map(t => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className="p-4 rounded-xl text-left transition-all"
            style={{
              background: t.bg,
              border: theme === t.name ? `2px solid ${t.accent}` : '2px solid transparent',
              boxShadow: theme === t.name ? `0 0 20px ${t.accentGlow}` : 'none',
            }}
          >
            <div className="w-4 h-4 rounded-full mb-2" style={{ background: t.accent }} />
            <span className="text-sm font-medium" style={{ color: t.text }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: API Keys
    <div key="keys" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--text)' }}>
        API Keys (opcional)
      </h2>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Guardadas apenas no teu browser. Podes saltar e configurar depois.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>GitHub Token</label>
          <input
            type="password"
            value={githubToken}
            onChange={e => setGithubToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Anthropic API Key</label>
          <input
            type="password"
            value={claudeKey}
            onChange={e => setClaudeKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>
    </div>,
  ];

  function finish() {
    onComplete({
      ...config,
      name,
      theme,
      feeds,
      githubToken: githubToken || undefined,
      claudeApiKey: claudeKey || undefined,
      onboarded: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,4,10,0.95)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 space-y-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap size={20} style={{ color: 'var(--accent)' }} />
          <span className="text-lg font-black" style={{ color: 'var(--text)' }}>Nexus</span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            {step + 1}/{steps.length}
          </span>
        </div>

        {/* Step content */}
        {steps[step]}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={14} /> Anterior
            </button>
          ) : (
            <button
              onClick={finish}
              className="text-xs transition-colors hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
            >
              Saltar tudo
            </button>
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Seguinte <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                boxShadow: `0 0 20px var(--accent-glow)`,
              }}
            >
              <Zap size={14} /> Iniciar Nexus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
