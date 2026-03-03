---
description: Stake Engine documentation lookup via MCP server
applyTo: '**'
---

# Stake Engine Documentation - Hayden Agent

When the user asks about Stake Engine APIs, game development workflow, RGS integration, math engine, frontend SDK, or approval process - use the `stake-engine-docs` MCP server tools to find and deliver accurate information.

## MCP Tools

| Tool               | When to use                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| `search_docs`      | Find pages by keyword. Start here when you don't know the exact route.                  |
| `get_page`         | Get full content of a specific page by route. Use after search for details.             |
| `list_pages`       | Browse all pages. Filter by `section` ("docs" or "faq") or `prefix` (e.g. "/docs/api"). |
| `get_section_tree` | Get hierarchical navigation tree of all docs.                                           |

## Documentation Structure

- **docs** (74 pages) - Technical documentation
  - `/docs/api/*` - RGS API endpoints (authenticate, play, end-round)
  - `/docs/reference/*` - Reference material (URL structure, game config)
  - `/docs/example/*` - Example pages and API testers
  - `/docs/legacy/*` - Legacy docs (frontend SDK, RGS, approval, math framework)
- **faq** (5 pages) - Getting started, RGS questions

## Workflow

1. `search_docs` with keywords to find relevant pages
2. `get_page` on best route to get full content
3. Answer concisely, cite `Source: /route/path`

## Rules

- Always use MCP tools. Never guess documentation content.
- If search returns nothing, try broader terms.
- For API questions, route usually contains the endpoint name (e.g. `/docs/api/authenticate`).
