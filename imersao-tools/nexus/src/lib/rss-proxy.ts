import type { FeedItem } from '../types';

export async function fetchFeed(feedUrl: string, sourceName: string): Promise<FeedItem[]> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    let contents: string = data.contents ?? '';

    // Handle base64-encoded responses (some feeds return data:...;base64,...)
    if (contents.startsWith('data:') && contents.includes(';base64,')) {
      const b64 = contents.split(';base64,')[1];
      try {
        contents = atob(b64);
      } catch {
        console.warn(`Base64 decode failed for ${sourceName}`);
      }
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(contents, 'text/xml');

    // Check for parse errors
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      console.warn(`XML parse error for ${sourceName}, trying fallback`);
      return parseFeedFallback(data.contents, sourceName);
    }

    // Try RSS <item> first, then Atom <entry>
    let items = xml.querySelectorAll('item');
    if (items.length === 0) {
      items = xml.querySelectorAll('entry');
    }

    const results: FeedItem[] = [];

    items.forEach((item, index) => {
      if (index >= 5) return;
      const title = item.querySelector('title')?.textContent?.trim() ?? '';

      // Get link — RSS vs Atom have different structures
      let link = '';

      // Atom: <link href="..." />
      const linkEl = item.querySelector('link');
      if (linkEl?.getAttribute('href')) {
        link = linkEl.getAttribute('href') ?? '';
      }

      // RSS: <link>url</link> — text content
      if (!link && linkEl?.textContent?.trim()) {
        link = linkEl.textContent.trim();
      }

      // RSS: sometimes link text is a sibling text node
      if (!link && linkEl?.nextSibling?.nodeType === 3) {
        link = linkEl.nextSibling.textContent?.trim() ?? '';
      }

      // Fallback: <guid>
      if (!link) {
        link = item.querySelector('guid')?.textContent?.trim() ?? '';
      }

      // Fallback: <id> (Atom)
      if (!link) {
        link = item.querySelector('id')?.textContent?.trim() ?? '';
      }

      // Get date — RSS uses pubDate, Atom uses published or updated
      const pubDate = item.querySelector('pubDate')?.textContent?.trim()
        ?? item.querySelector('published')?.textContent?.trim()
        ?? item.querySelector('updated')?.textContent?.trim()
        ?? '';

      if (title) {
        results.push({
          title,
          link: link || '#',
          source: sourceName,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
        });
      }
    });

    return results;
  } catch (error) {
    console.error(`Failed to fetch feed ${sourceName}:`, error);
    return [];
  }
}

function parseFeedFallback(content: string, sourceName: string): FeedItem[] {
  const results: FeedItem[] = [];
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/g;
  const linkRegex = /<link[^>]*href="([^"]*)"[^>]*>|<link>(.*?)<\/link>/g;
  let match;
  const titles: string[] = [];
  const links: string[] = [];

  while ((match = titleRegex.exec(content)) !== null) {
    titles.push((match[1] || match[2] || '').trim());
  }
  while ((match = linkRegex.exec(content)) !== null) {
    links.push((match[1] || match[2] || '').trim());
  }

  // Skip first title/link (channel/feed level)
  for (let i = 1; i < Math.min(titles.length, 6); i++) {
    if (titles[i]) {
      results.push({
        title: titles[i],
        link: links[i] || '#',
        source: sourceName,
        publishedAt: new Date(),
      });
    }
  }
  return results;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
