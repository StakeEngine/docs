import type { DocPage, SearchResult } from './types.js';

const WEIGHTS = {
  titleExact: 15,
  titleTerm: 8,
  tagExact: 6,
  descriptionPhrase: 6,
  descriptionTerm: 4,
  routePath: 2,
  bodyTerm: 1,
  bodyTermCap: 5,
  phraseBonus: 5,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ');
}

function extractSnippet(body: string, terms: string[], maxLength = 200): string {
  const lower = body.toLowerCase();

  // Find the best position - where the most terms cluster
  let bestPos = 0;
  let bestCount = 0;

  for (let i = 0; i < lower.length; i += 50) {
    const window = lower.slice(i, i + maxLength);
    let count = 0;
    for (const term of terms) {
      if (window.includes(term)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestPos = i;
    }
  }

  // Extract snippet around best position
  let start = Math.max(0, bestPos - 20);
  let end = Math.min(body.length, start + maxLength);

  // Snap to word boundaries
  if (start > 0) {
    const spaceIdx = body.indexOf(' ', start);
    if (spaceIdx !== -1 && spaceIdx < start + 20) start = spaceIdx + 1;
  }
  if (end < body.length) {
    const spaceIdx = body.lastIndexOf(' ', end);
    if (spaceIdx > end - 20) end = spaceIdx;
  }

  let snippet = body.slice(start, end).replace(/\n+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < body.length) snippet = snippet + '...';

  return snippet;
}

export function searchDocs(
  pages: DocPage[],
  query: string,
  options: { section?: string; limit?: number } = {}
): SearchResult[] {
  const { section, limit = 10 } = options;
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter((t) => t.length > 1);

  if (terms.length === 0) return [];

  const isPhrase = terms.length > 1;
  const results: SearchResult[] = [];

  const filteredPages = section
    ? pages.filter((p) => p.section === section)
    : pages;

  for (const page of filteredPages) {
    let score = 0;
    const normalizedTitle = normalize(page.title);
    const normalizedDescription = normalize(page.description || '');
    const normalizedBody = normalize(page.body);
    const normalizedRoute = normalize(page.route);

    // Title exact phrase match
    if (isPhrase && normalizedTitle.includes(normalizedQuery)) {
      score += WEIGHTS.titleExact;
    }

    // Title individual terms
    for (const term of terms) {
      if (normalizedTitle.includes(term)) {
        score += WEIGHTS.titleTerm;
      }
    }

    // Tag exact match
    for (const tag of page.tags) {
      const normalizedTag = normalize(tag);
      for (const term of terms) {
        if (normalizedTag === term || normalizedTag.includes(term)) {
          score += WEIGHTS.tagExact;
        }
      }
    }

    // Description phrase match
    if (isPhrase && normalizedDescription.includes(normalizedQuery)) {
      score += WEIGHTS.descriptionPhrase;
    }

    // Description individual terms
    for (const term of terms) {
      if (normalizedDescription.includes(term)) {
        score += WEIGHTS.descriptionTerm;
      }
    }

    // Route path
    for (const term of terms) {
      if (normalizedRoute.includes(term)) {
        score += WEIGHTS.routePath;
      }
    }

    // Body term frequency (capped)
    for (const term of terms) {
      let count = 0;
      let pos = 0;
      while ((pos = normalizedBody.indexOf(term, pos)) !== -1) {
        count++;
        pos += term.length;
      }
      score += Math.min(count, WEIGHTS.bodyTermCap) * WEIGHTS.bodyTerm;
    }

    // Phrase bonus for body
    if (isPhrase && normalizedBody.includes(normalizedQuery)) {
      score += WEIGHTS.phraseBonus;
    }

    if (score > 0) {
      results.push({
        route: page.route,
        title: page.title,
        section: page.section,
        score,
        snippet: extractSnippet(page.body, terms),
        tags: page.tags,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
