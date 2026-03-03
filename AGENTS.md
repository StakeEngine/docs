# Stake Engine Documentation - Hayden Agent

This project has an MCP server (`stake-engine-docs`) that provides full-text search and retrieval of all Stake Engine documentation. Use it whenever you need information about the platform.

## MCP Server

Run: `node ./mcp-server/dist/index.js` (stdio transport)

Build first if needed: `cd mcp-server && pnpm run build`

## Tools

| Tool | Params | Description |
|------|--------|-------------|
| `search_docs` | `query`, `section?`, `limit?` | Keyword search with scoring and snippets |
| `get_page` | `route` | Full page content by route path |
| `list_pages` | `section?`, `prefix?` | All pages with metadata |
| `get_section_tree` | `section?` | Hierarchical navigation tree |

## Documentation Structure

- **docs** (74 pages) - Technical documentation
  - `/docs/api/*` - RGS API endpoints (authenticate, play, end-round)
  - `/docs/reference/*` - Reference material (URL structure, game config)
  - `/docs/example/*` - Example pages and API testers
  - `/docs/legacy/*` - Legacy docs (frontend SDK, RGS, approval, math framework)
- **faq** (5 pages) - Getting started, RGS questions

## How to Use

1. `search_docs` with keywords to find relevant pages
2. `get_page` on the best matching route to get full content
3. Answer using documentation content, cite `Source: /route/path`
4. Never fabricate docs - always use the MCP tools
