import { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, X } from 'lucide-react';
import Card from '../ui/Card';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Note } from '../../types';

const MAX_NOTES = 3;

export default function NotesWidget() {
  const [notes, setNotes] = useLocalStorage<Note[]>('nexus_notes', [
    { id: '1', content: '', updatedAt: Date.now() },
  ]);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? '');
  const debounceRef = useRef<number | null>(null);

  const activeNote = notes.find(n => n.id === activeId);

  useEffect(() => {
    if (!activeId && notes.length > 0) {
      setActiveId(notes[0].id);
    }
  }, [activeId, notes]);

  function updateContent(content: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setNotes(prev => prev.map(n =>
        n.id === activeId ? { ...n, content, updatedAt: Date.now() } : n
      ));
    }, 1000);

    // Immediate visual update without persisting
    setNotes(prev => prev.map(n =>
      n.id === activeId ? { ...n, content } : n
    ));
  }

  function addNote() {
    if (notes.length >= MAX_NOTES) return;
    const note: Note = { id: crypto.randomUUID(), content: '', updatedAt: Date.now() };
    setNotes(prev => [...prev, note]);
    setActiveId(note.id);
  }

  function removeNote(id: string) {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      if (activeId === id && next.length > 0) {
        setActiveId(next[0].id);
      }
      return next;
    });
  }

  return (
    <Card title="Notas">
      <div className="space-y-2">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {notes.map((note, i) => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className="group flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all"
              style={{
                background: activeId === note.id ? 'var(--accent)' : 'transparent',
                color: activeId === note.id ? 'var(--bg)' : 'var(--text-secondary)',
                border: activeId === note.id ? 'none' : '1px solid var(--border)',
              }}
            >
              <StickyNote size={10} />
              {i + 1}
              {notes.length > 1 && (
                <span
                  onClick={e => { e.stopPropagation(); removeNote(note.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          ))}
          {notes.length < MAX_NOTES && (
            <button
              onClick={addNote}
              className="p-1 rounded-md hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Editor */}
        <textarea
          value={activeNote?.content ?? ''}
          onChange={e => updateContent(e.target.value)}
          placeholder="Ideias, lembretes, links..."
          className="w-full h-32 text-sm bg-transparent outline-none resize-none rounded-lg p-3"
          style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>
    </Card>
  );
}
