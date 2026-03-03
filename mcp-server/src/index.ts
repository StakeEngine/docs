#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { DocsIndex } from './types.js';
import { registerTools } from './tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadIndex(): DocsIndex {
  // Try multiple locations for the docs index
  const candidates = [
    resolve(__dirname, '..', 'data', 'docs-index.json'),
    resolve(__dirname, '..', '..', 'data', 'docs-index.json'),
  ];

  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, 'utf-8');
      return JSON.parse(raw) as DocsIndex;
    } catch {
      // Try next candidate
    }
  }

  throw new Error(
    `Could not find docs-index.json. Looked in:\n${candidates.map((c) => '  - ' + c).join('\n')}\nRun "pnpm run build:index" to generate it.`
  );
}

async function main() {
  const index = loadIndex();

  const server = new McpServer({
    name: 'stake-engine-docs',
    version: '1.0.0',
  });

  registerTools(server, index);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `Stake Engine Docs MCP server running - ${index.pageCount} pages indexed (generated ${index.generatedAt})`
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
