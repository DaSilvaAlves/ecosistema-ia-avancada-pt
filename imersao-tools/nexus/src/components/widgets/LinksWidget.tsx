import { useState } from 'react';
import { Github, Triangle, Database, Mail, Bot, Users, Plus, X, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import type { QuickLink } from '../../types';

interface LinksWidgetProps {
  links: QuickLink[];
  onLinksChange: (links: QuickLink[]) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  github: <Github size={18} />,
  triangle: <Triangle size={18} />,
  database: <Database size={18} />,
  mail: <Mail size={18} />,
  bot: <Bot size={18} />,
  users: <Users size={18} />,
};

export default function LinksWidget({ links, onLinksChange }: LinksWidgetProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  function addLink() {
    if (!newName.trim() || !newUrl.trim()) return;
    const link: QuickLink = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
      icon: 'external-link',
    };
    onLinksChange([...links, link]);
    setNewName('');
    setNewUrl('');
    setShowForm(false);
  }

  function removeLink(id: string) {
    onLinksChange(links.filter(l => l.id !== id));
  }

  return (
    <Card title="Links rapidos">
      <div className="grid grid-cols-3 gap-2">
        {links.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:scale-105"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px var(--accent-glow)`;
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); removeLink(link.id); }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: '#FF006E', color: '#fff' }}
            >
              <X size={10} />
            </button>
            <span style={{ color: 'var(--accent)' }}>
              {ICON_MAP[link.icon] ?? <ExternalLink size={18} />}
            </span>
            <span className="text-[11px] font-medium truncate w-full text-center">
              {link.name}
            </span>
          </a>
        ))}

        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all hover:bg-white/5"
            style={{ border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}
          >
            <Plus size={18} />
            <span className="text-[11px]">Adicionar</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome"
            className="w-full text-xs px-3 py-2 rounded-lg bg-transparent outline-none"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLink()}
              placeholder="URL"
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-transparent outline-none"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button onClick={addLink} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
              OK
            </button>
            <button onClick={() => setShowForm(false)} className="px-2 py-1 rounded-lg text-xs" style={{ color: 'var(--text-secondary)' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
