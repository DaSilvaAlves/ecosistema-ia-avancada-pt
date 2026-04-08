import type { Theme, ThemeName } from '../types';

export const THEMES: Record<ThemeName, Theme> = {
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    bg: '#04040A',
    bgCard: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    accent: '#00F5FF',
    accentGlow: 'rgba(0,245,255,0.4)',
    text: '#F0F4FF',
    textSecondary: '#8892A4',
  },
  'warm-dark': {
    name: 'warm-dark',
    label: 'Warm Dark',
    bg: '#1a1410',
    bgCard: 'rgba(255,200,100,0.03)',
    border: 'rgba(255,184,0,0.1)',
    accent: '#FFB800',
    accentGlow: 'rgba(255,184,0,0.4)',
    text: '#F0F4FF',
    textSecondary: '#8892A4',
  },
  'deep-purple': {
    name: 'deep-purple',
    label: 'Deep Purple',
    bg: '#0d0618',
    bgCard: 'rgba(157,0,255,0.03)',
    border: 'rgba(157,0,255,0.1)',
    accent: '#9D00FF',
    accentGlow: 'rgba(157,0,255,0.4)',
    text: '#F0F4FF',
    textSecondary: '#8892A4',
  },
  arctic: {
    name: 'arctic',
    label: 'Arctic',
    bg: '#f0f4ff',
    bgCard: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.08)',
    accent: '#0066ff',
    accentGlow: 'rgba(0,102,255,0.3)',
    text: '#1a1a2e',
    textSecondary: '#4A5568',
  },
};

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--bg-card', theme.bgCard);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-secondary', theme.textSecondary);
}
