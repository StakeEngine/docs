import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocPage, DocsIndex, SectionTreeNode } from './types.js';
import { searchDocs } from './search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadAgentPrompt(): string {
  // Try src/ first (dev), then dist/ parent (built)
  const candidates = [
    resolve(__dirname, 'hayden.md'),
    resolve(__dirname, '..', 'src', 'hayden.md'),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, 'utf-8');
    } catch {
      // next
    }
  }
  throw new Error(`Could not find hayden.md. Looked in:\n${candidates.map((c) => '  - ' + c).join('\n')}`);
}

interface TreeBuildNode {
  name: string;
  route: string;
  title: string;
  childMap: Map<string, TreeBuildNode>;
}

function buildSectionTree(pages: DocPage[], section?: string): SectionTreeNode[] {
  const filtered = section ? pages.filter((p) => p.section === section) : pages;

  const root = new Map<string, TreeBuildNode>();

  for (const page of filtered) {
    const parts = page.route.split('/').filter(Boolean);
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      currentPath += '/' + parts[i];
      const isLast = i === parts.length - 1;

      if (!currentLevel.has(parts[i])) {
        currentLevel.set(parts[i], {
          name: parts[i],
          route: currentPath,
          title: parts[i].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          childMap: new Map(),
        });
      }

      const node = currentLevel.get(parts[i])!;

      if (isLast) {
        node.title = page.title;
        node.route = page.route;
      }

      currentLevel = node.childMap;
    }
  }

  function toTree(map: Map<string, TreeBuildNode>): SectionTreeNode[] {
    const nodes: SectionTreeNode[] = [];
    for (const node of map.values()) {
      nodes.push({
        name: node.name,
        route: node.route,
        title: node.title,
        children: toTree(node.childMap),
      });
    }
    nodes.sort((a, b) => a.route.localeCompare(b.route));
    return nodes;
  }

  return toTree(root);
}

export function registerTools(server: McpServer, index: DocsIndex): void {
  const { pages } = index;

  // Load agent prompt from hayden.md and interpolate variables
  const prompt = loadAgentPrompt().replace(/\{\{pageCount\}\}/g, String(index.pageCount));

  server.resource(
    'agent-prompt',
    'stake-engine-docs://agent-prompt',
    { mimeType: 'text/plain', description: 'Hayden agent system prompt for working with Stake Engine documentation' },
    async () => ({
      contents: [
        {
          uri: 'stake-engine-docs://agent-prompt',
          mimeType: 'text/plain',
          text: prompt,
        },
      ],
    })
  );

  // Agent prompt also as a prompt template
  server.prompt(
    'hayden',
    'Stake Engine documentation agent - provides system instructions for AI to effectively search and retrieve docs',
    { question: z.string().optional().describe('Optional question to answer using the docs') },
    ({ question }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: question
              ? `${prompt}\n\n---\n\nAnswer this question using the documentation tools: ${question}`
              : prompt,
          },
        },
      ],
    })
  );

  // search_docs
  server.tool(
    'search_docs',
    'Search Stake Engine documentation by keyword. Returns scored results with snippets.',
    {
      query: z.string().describe('Search query (keywords or phrase)'),
      section: z.enum(['docs', 'faq']).optional().describe('Filter to a section: "docs" or "faq"'),
      limit: z.number().min(1).max(50).optional().describe('Max results to return (default 10)'),
    },
    async ({ query, section, limit }) => {
      const results = searchDocs(pages, query, { section, limit });

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No results found for "${query}"${section ? ` in section "${section}"` : ''}.`,
            },
          ],
        };
      }

      const text = results
        .map(
          (r, i) =>
            `${i + 1}. **${r.title}** (${r.route})\n   Score: ${r.score} | Section: ${r.section}${r.tags.length > 0 ? ` | Tags: ${r.tags.join(', ')}` : ''}\n   ${r.snippet}`
        )
        .join('\n\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Found ${results.length} result(s) for "${query}":\n\n${text}`,
          },
        ],
      };
    }
  );

  // get_page
  server.tool(
    'get_page',
    'Get full content of a documentation page by its route path.',
    {
      route: z.string().describe('Route path, e.g. "/docs/api/play" or "/faq/getting-started/how-do-i-start"'),
    },
    async ({ route }) => {
      // Normalize route
      const normalized = route.startsWith('/') ? route : '/' + route;
      const page = pages.find((p) => p.route === normalized);

      if (!page) {
        // Try partial match
        const partial = pages.filter((p) => p.route.includes(normalized));
        if (partial.length > 0) {
          const suggestions = partial.slice(0, 5).map((p) => `  - ${p.route} (${p.title})`).join('\n');
          return {
            content: [
              {
                type: 'text' as const,
                text: `Page "${normalized}" not found. Did you mean:\n${suggestions}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Page "${normalized}" not found. Use list_pages to see available routes.`,
            },
          ],
        };
      }

      const header = [
        `# ${page.title}`,
        `Route: ${page.route}`,
        `Section: ${page.section}`,
        page.description ? `Description: ${page.description}` : null,
        page.tags.length > 0 ? `Tags: ${page.tags.join(', ')}` : null,
        page.updated ? `Updated: ${page.updated}` : null,
        '---',
      ]
        .filter(Boolean)
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `${header}\n\n${page.body}`,
          },
        ],
      };
    }
  );

  // list_pages
  server.tool(
    'list_pages',
    'List all documentation pages with metadata. Optionally filter by section or route prefix.',
    {
      section: z.enum(['docs', 'faq']).optional().describe('Filter to a section'),
      prefix: z.string().optional().describe('Filter by route prefix, e.g. "/docs/api"'),
    },
    async ({ section, prefix }) => {
      let filtered = pages;

      if (section) {
        filtered = filtered.filter((p) => p.section === section);
      }
      if (prefix) {
        const normalizedPrefix = prefix.startsWith('/') ? prefix : '/' + prefix;
        filtered = filtered.filter((p) => p.route.startsWith(normalizedPrefix));
      }

      if (filtered.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No pages found${section ? ` in section "${section}"` : ''}${prefix ? ` with prefix "${prefix}"` : ''}.`,
            },
          ],
        };
      }

      const text = filtered
        .map((p) => {
          const parts = [p.route, p.title];
          if (p.description) parts.push(p.description);
          if (p.tags.length > 0) parts.push(`[${p.tags.join(', ')}]`);
          return parts.join(' | ');
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `${filtered.length} page(s):\n\n${text}`,
          },
        ],
      };
    }
  );

  // get_section_tree
  server.tool(
    'get_section_tree',
    'Get hierarchical navigation tree of documentation pages.',
    {
      section: z.enum(['docs', 'faq']).optional().describe('Filter to a section'),
    },
    async ({ section }) => {
      const tree = buildSectionTree(pages, section);

      function renderTree(nodes: SectionTreeNode[], indent = 0): string {
        return nodes
          .map((node) => {
            const prefix = '  '.repeat(indent) + '- ';
            const line = `${prefix}${node.title} (${node.route})`;
            if (node.children.length > 0) {
              return line + '\n' + renderTree(node.children, indent + 1);
            }
            return line;
          })
          .join('\n');
      }

      const text = renderTree(tree);

      return {
        content: [
          {
            type: 'text' as const,
            text: text || 'No pages found.',
          },
        ],
      };
    }
  );
}
