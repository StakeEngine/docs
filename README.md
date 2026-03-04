# Stake Engine Docs

Documentation site for the Stake Engine game development platform

## Setup

```sh
pnpm install
```

## Development

```sh
pnpm dev
```

## Build

```sh
pnpm build
```

## MCP Server

The `mcp-server/` directory contains a Model Context Protocol server that lets AI assistants search and retrieve documentation content.

### Tools provided

| Tool | Description |
|---|---|
| `search_docs` | Keyword search across all docs, returns scored results with snippets |
| `get_page` | Fetch full page content by route path |
| `list_pages` | List pages with optional section/prefix filter |
| `get_section_tree` | Get hierarchical navigation tree |

### Build the server

```sh
cd mcp-server
pnpm install
pnpm build        # builds the search index + compiles TS
```

### Configure in Claude Code

Add to your `.claude/settings.json` (project or global):

```json
{
  "mcpServers": {
    "stake-engine-docs": {
      "command": "node",
      "args": ["/absolute/path/to/stake-engine-docs/mcp-server/dist/index.js"]
    }
  }
}
```

### Configure in Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stake-engine-docs": {
      "command": "node",
      "args": ["/absolute/path/to/stake-engine-docs/mcp-server/dist/index.js"]
    }
  }
}
```

After configuring, the AI assistant can search docs with `search_docs`, retrieve full pages with `get_page`, and browse the doc tree with `get_section_tree`.
