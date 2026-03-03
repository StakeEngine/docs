# Stake Engine Docs Lookup

Search and retrieve Stake Engine documentation.

## Instructions

Use the `stake-engine-docs` MCP server tools to answer the user's question about Stake Engine.

**Workflow:**
1. Call `mcp__stake-engine-docs__search_docs` with keywords from the query: $ARGUMENTS
2. Read the top results and call `mcp__stake-engine-docs__get_page` on the most relevant route(s)
3. Answer the question concisely, citing the source route

If $ARGUMENTS is empty or says "help", call `mcp__stake-engine-docs__get_section_tree` and show the docs structure overview.

**Format your response as:**
- Direct answer with relevant details
- Code examples if applicable
- `Source: /route/path` at the end
