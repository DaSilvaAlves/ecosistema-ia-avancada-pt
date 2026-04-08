export interface NexusConfig {
  name: string;
  theme: ThemeName;
  feeds: FeedSource[];
  quickLinks: QuickLink[];
  githubToken?: string;
  claudeApiKey?: string;
  onboarded: boolean;
}

export type ThemeName = 'midnight' | 'warm-dark' | 'deep-purple' | 'arctic';

export interface Theme {
  name: ThemeName;
  label: string;
  bg: string;
  bgCard: string;
  border: string;
  accent: string;
  accentGlow: string;
  text: string;
  textSecondary: string;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface FeedItem {
  title: string;
  link: string;
  source: string;
  publishedAt: Date;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  list: string;
  createdAt: number;
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'blocked' | 'done';
  context?: string; // "onde parei" — free text
  lastWorkedAt?: number; // timestamp of last interaction
}

export interface NightSnapshot {
  timestamp: number;
  date: string; // YYYY-MM-DD
  tasksInProgress: Array<{ text: string; context: string; list: string; priority: string }>;
  tasksPending: Array<{ text: string; dueDate?: string; priority: string }>;
  tasksCompletedToday: number;
  notes: string[];
  pomodoroSessions: number;
  briefing?: string; // AI-generated morning briefing
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: string;
  message: string;
  createdAt: string;
}

export interface GitHubData {
  username: string;
  events: GitHubEvent[];
  openPRs: number;
  weeklyContributions: number;
}

export interface Note {
  id: string;
  content: string;
  updatedAt: number;
}

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionsToday: number;
  lastResetDate: string;
}
