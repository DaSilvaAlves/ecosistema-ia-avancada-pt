import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { THEMES } from '../../lib/themes';
import type { NexusConfig, ThemeName } from '../../types';

interface SettingsModalProps {
  config: NexusConfig;
  onSave: (config: NexusConfig) => void;
  onClose: () => void;
}

export default function SettingsModal({ config, onSave, onClose }: SettingsModalProps) {
  const [name, setName] = useState(config.name);
  const [theme, setTheme] = useState<ThemeName>(config.theme);
  const [githubToken, setGithubToken] = useState(config.githubToken ?? '');
  const [claudeKey, setClaudeKey] = useState(config.claudeApiKey ?? '');

  function save() {
    onSave({
      ...config,
      name,
      theme,
      githubToken: githubToken || undefined,
      claudeApiKey: claudeKey || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,4,10,0.9)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Definicoes</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>Tema</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(THEMES).map(t => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: t.bg,
                  border: theme === t.name ? `2px solid ${t.accent}` : '2px solid transparent',
                }}
              >
                <div className="w-3 h-3 rounded-full mb-1" style={{ background: t.accent }} />
                <span className="text-xs" style={{ color: t.text }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="space-y-3">
          <label className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>API Keys</label>
          <input
            type="password"
            value={githubToken}
            onChange={e => setGithubToken(e.target.value)}
            placeholder="GitHub Token (ghp_...)"
            className="w-full text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="password"
            value={claudeKey}
            onChange={e => setClaudeKey(e.target.value)}
            placeholder="Anthropic API Key (sk-ant-...)"
            className="w-full text-sm px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        <button
          onClick={save}
          className="w-full text-sm font-medium py-2.5 rounded-xl transition-all"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
