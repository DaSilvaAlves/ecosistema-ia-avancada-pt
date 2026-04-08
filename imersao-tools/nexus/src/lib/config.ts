import type { NexusConfig, FeedSource, QuickLink } from '../types';

const STORAGE_KEY = 'nexus_config';

export const DEFAULT_FEEDS: FeedSource[] = [
  { id: 'hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage?count=5', enabled: true },
  { id: 'tc', name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', enabled: true },
  { id: 'tv', name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', enabled: true },
];

export const DEFAULT_LINKS: QuickLink[] = [
  { id: '1', name: 'GitHub', url: 'https://github.com', icon: 'github' },
  { id: '2', name: 'Vercel', url: 'https://vercel.com', icon: 'triangle' },
  { id: '3', name: 'Supabase', url: 'https://supabase.com', icon: 'database' },
  { id: '4', name: 'Gmail', url: 'https://mail.google.com', icon: 'mail' },
  { id: '5', name: 'Claude', url: 'https://claude.ai', icon: 'bot' },
  { id: '6', name: 'Comunidade', url: 'https://comunidade.avancada.expressia.pt', icon: 'users' },
];

export const DEFAULT_CONFIG: NexusConfig = {
  name: '',
  theme: 'midnight',
  feeds: DEFAULT_FEEDS,
  quickLinks: DEFAULT_LINKS,
  onboarded: false,
};

export function loadConfig(): NexusConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: NexusConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}
