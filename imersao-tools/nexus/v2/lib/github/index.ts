/**
 * Nexus v2 — GitHub API (PORTADO de v1 `src/lib/github-api.ts`)
 *
 * Eventos do utilizador (push events últimos 7 dias) + open PRs.
 * Token recebido como argumento — guardado em `nexus_config.githubToken` (localStorage v1).
 * Em v2, Story 0.7 (Onboarding) vai pedir token e guardar em config user.
 */

const API = 'https://api.github.com';

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

interface GitHubUser {
  login: string;
}

interface GitHubEventRaw {
  id: string;
  type: string;
  repo: { name: string };
  payload: { commits?: Array<{ message: string }> };
  created_at: string;
}

interface GitHubSearch {
  total_count?: number;
}

export async function fetchGitHubData(token: string): Promise<GitHubData> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const userRes = await fetch(`${API}/user`, { headers });
  if (!userRes.ok) throw new Error(`GitHub auth failed: ${userRes.status}`);
  const user = (await userRes.json()) as GitHubUser;
  const username = user.login;

  const [eventsRes, prsRes] = await Promise.all([
    fetch(`${API}/users/${username}/events?per_page=30`, { headers }),
    fetch(`${API}/search/issues?q=author:${username}+type:pr+state:open&per_page=5`, {
      headers,
    }),
  ]);

  const eventsData = (await eventsRes.json()) as GitHubEventRaw[] | unknown;
  const prsData = (await prsRes.json()) as GitHubSearch;

  const events: GitHubEventRaw[] = Array.isArray(eventsData) ? (eventsData as GitHubEventRaw[]) : [];

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const pushEvents: GitHubEvent[] = events
    .filter((e) => e.type === 'PushEvent')
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      type: e.type,
      repo: e.repo.name,
      message: e.payload.commits?.[0]?.message ?? 'push',
      createdAt: e.created_at,
    }));

  const weeklyContributions = events.filter(
    (e) => new Date(e.created_at).getTime() > weekAgo,
  ).length;

  return {
    username,
    events: pushEvents,
    openPRs: prsData.total_count ?? 0,
    weeklyContributions,
  };
}
