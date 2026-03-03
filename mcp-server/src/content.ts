interface Frontmatter {
  title: string;
  nav_title?: string;
  description?: string;
  order?: number;
  icon?: string;
  badge?: string;
  updated?: string;
  tags: string[];
}

const defaultFrontmatter: Frontmatter = {
  title: '',
  tags: [],
};

/**
 * Parse YAML frontmatter from .svx file content.
 * Adapted from src/lib/stores/editor.ts:162-221.
 */
export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const fm: Frontmatter = { ...defaultFrontmatter, tags: [] };

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    // No YAML frontmatter - try fallback title extraction
    const fallback = extractFallbackTitle(raw);
    if (fallback.title) fm.title = fallback.title;
    if (fallback.description) fm.description = fallback.description;
    return { frontmatter: fm, body: raw };
  }

  const yamlBlock = match[1];
  const body = match[2];

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    switch (key) {
      case 'title':
        fm.title = value;
        break;
      case 'description':
        fm.description = value;
        break;
      case 'order':
        fm.order = value ? parseInt(value, 10) : undefined;
        if (fm.order !== undefined && isNaN(fm.order)) fm.order = undefined;
        break;
      case 'tags': {
        const inner = value.replace(/^\[|\]$/g, '');
        fm.tags = inner
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        break;
      }
      case 'icon':
        fm.icon = value;
        break;
      case 'badge':
        fm.badge = value;
        break;
      case 'nav_title':
        fm.nav_title = value;
        break;
      case 'updated':
        fm.updated = value;
        break;
    }
  }

  return { frontmatter: fm, body };
}

/**
 * For legacy pages without YAML frontmatter, extract title from
 * <svelte:head><title> or first # Heading.
 */
function extractFallbackTitle(raw: string): { title?: string; description?: string } {
  let title: string | undefined;
  let description: string | undefined;

  // Try <svelte:head><title>...</title>
  const titleMatch = raw.match(/<svelte:head>[\s\S]*?<title>([^<]+)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1]
      .replace(/\s*[-–|]\s*Stake Engine Docs$/i, '')
      .replace(/\s*[-–|]\s*Stake Engine$/i, '')
      .trim();
  }

  // Try meta description
  const metaMatch = raw.match(
    /<meta\s+name="description"\s+content="([^"]+)"/
  );
  if (metaMatch) {
    description = metaMatch[1].trim();
  }

  // Fall back to first # Heading
  if (!title) {
    const headingMatch = raw.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    }
  }

  return { title, description };
}

/**
 * Clean .svx content for AI consumption:
 * - Remove script/style/svelte:head blocks
 * - Transform Callout components to plain text markers
 * - Strip wrapper components (keep inner content)
 * - Remove Svelte template syntax
 * - Keep markdown content
 */
export function cleanSvxContent(raw: string): string {
  let content = raw;

  // Remove <script> blocks (including multiline with const objects etc.)
  content = content.replace(/<script[\s\S]*?<\/script>/g, '');

  // Remove <style> blocks
  content = content.replace(/<style[\s\S]*?<\/style>/g, '');

  // Remove <svelte:head> blocks
  content = content.replace(/<svelte:head>[\s\S]*?<\/svelte:head>/g, '');

  // Remove SVG elements
  content = content.replace(/<svg[\s\S]*?<\/svg>/g, '');

  // Remove <button> elements
  content = content.replace(/<button[\s\S]*?<\/button>/g, '');

  // Transform <Callout type="info">text</Callout> → [INFO]: text
  content = content.replace(
    /<Callout\s+type="([^"]+)">([\s\S]*?)<\/Callout>/g,
    (_match, type: string, text: string) => {
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      return `[${type.toUpperCase()}]: ${cleanText}`;
    }
  );

  // Strip wrapper components - keep inner content
  // ApiTester, ApiParamTable, ApiResponseSection, ApiAiPrompt
  content = content.replace(/<ApiTester[\s\S]*?\/>/g, '');
  content = content.replace(/<ApiTester[\s\S]*?<\/ApiTester>/g, '');
  content = content.replace(/<ApiParamTable[\s\S]*?\/>/g, '');
  content = content.replace(/<ApiParamTable[\s\S]*?<\/ApiParamTable>/g, '');
  content = content.replace(/<ApiResponseSection[\s\S]*?\/>/g, '');
  content = content.replace(/<ApiResponseSection[\s\S]*?<\/ApiResponseSection>/g, '');
  content = content.replace(/<ApiAiPrompt[\s\S]*?\/>/g, '');
  content = content.replace(/<ApiAiPrompt[\s\S]*?<\/ApiAiPrompt>/g, '');

  // Strip wrapper components - keep content inside
  const wrapperComponents = ['Steps', 'Tabs', 'Collapsible', 'CodeGroup', 'Badge', 'ChecklistNode'];
  for (const comp of wrapperComponents) {
    content = content.replace(
      new RegExp(`<${comp}[^>]*>([\\s\\S]*?)<\\/${comp}>`, 'g'),
      '$1'
    );
    // Self-closing
    content = content.replace(new RegExp(`<${comp}[^>]*\\/>`, 'g'), '');
  }

  // Remove Svelte template syntax: {#if}, {/if}, {:else}, {#each}, {/each}, {#snippet}, {/snippet}
  content = content.replace(/\{[#/:][^}]+\}/g, '');

  // Remove Svelte expressions like {variable} but keep content in code blocks
  // Only remove single-line Svelte expressions outside code blocks
  content = content.replace(/\{[a-zA-Z_][a-zA-Z0-9_.]*\}/g, '');

  // Remove remaining HTML tags (div, span, br, img, etc.) but preserve content
  content = content.replace(/<\/?(?:div|span|br|img|p|a|strong|em|ul|ol|li|table|thead|tbody|tr|th|td|hr|details|summary)[^>]*>/gi, '');

  // Remove empty lines clusters (more than 2 consecutive)
  content = content.replace(/\n{3,}/g, '\n\n');

  // Trim
  content = content.trim();

  return content;
}
