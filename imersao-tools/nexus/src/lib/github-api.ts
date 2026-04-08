import type { GitHubData, GitHubEvent } from '../types';

const API = 'https://api.github.com';

export async function fetchGitHubData(token: string): Promise<GitHubData> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const userRes = await fetch(`${API}/user`, { headers });
    if (!userRes.ok) throw new Error(`GitHub auth failed: ${userRes.status}`);
    const user = await userRes.json();
    const username = user.login;

    const [eventsRes, prsRes] = await Promise.all([
      fetch(`${API}/users/${username}/events?per_page=30`, { headers }),
      fetch(`${API}/search/issues?q=author:${username}+type:pr+state:open&per_page=5`, { headers }),
    ]);

    const eventsData = await eventsRes.json();
    const prsData = await prsRes.json();

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const events: GitHubEvent[] = (Array.isArray(eventsData) ? eventsData : [])
      .filter((e: { type: string }) => e.type === 'PushEvent')
      .slice(0, 5)
      .map((e: { id: string; type: string; repo: { name: string }; payload: { commits?: Array<{ message: string }> }; created_at: string }) => ({
        id: e.id,
        type: e.type,
        repo: e.repo.name,
        message: e.payload.commits?.[0]?.message ?? 'push',
        createdAt: e.created_at,
      }));

    const weeklyContributions = (Array.isArray(eventsData) ? eventsData : [])
      .filter((e: { created_at: string }) => new Date(e.created_at).getTime() > weekAgo)
      .length;

    return {
      username,
      events,
      openPRs: prsData.total_count ?? 0,
      weeklyContributions,
    };
  } catch (error) {
    console.error('Failed to fetch GitHub data:', error);
    throw error;
  }
}
