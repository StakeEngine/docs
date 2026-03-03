<script lang="ts">
	import type { ApiEndpoint, ApiParam } from '$lib/types/api';
	import { highlight } from '$lib/highlight';

	let { endpoint }: { endpoint: ApiEndpoint } = $props();

	const tabs = ['Prompt', 'Tool Schema', 'cURL'] as const;
	let active = $state(0);
	let copied = $state(false);

	let highlightedContent = $state<Record<number, string>>({});

	function groupParams(params: ApiParam[]): Record<string, ApiParam[]> {
		const groups: Record<string, ApiParam[]> = {};
		for (const p of params) {
			const key = p.location === 'path' ? 'Path' : p.location === 'query' ? 'Query' : 'Body';
			(groups[key] ??= []).push(p);
		}
		return groups;
	}

	function buildExampleBody(params: ApiParam[]): string {
		const bodyParams = params.filter((p) => p.location === 'body');
		if (bodyParams.length === 0) return '';
		const obj: Record<string, string> = {};
		for (const p of bodyParams) {
			obj[p.name] = p.example || `<${p.name}>`;
		}
		return JSON.stringify(obj, null, 2);
	}

	function formatJson(str: string): string {
		try {
			return JSON.stringify(JSON.parse(str), null, 2);
		} catch {
			return str;
		}
	}

	function generatePrompt(): string {
		const groups = groupParams(endpoint.params);
		let text = `## API Endpoint: ${endpoint.title}\n\n`;
		text += `${endpoint.description}\n\n`;
		text += `**Method:** ${endpoint.method}\n`;
		text += `**URL:** ${endpoint.baseUrl}${endpoint.path}\n`;

		if (endpoint.params.length > 0) {
			text += `\n### Request\n\n`;
			for (const [group, params] of Object.entries(groups)) {
				text += `**${group} Parameters:**\n\n`;
				for (const p of params) {
					text += `- \`${p.name}\` (${p.type}${p.required ? ', **required**' : ''}) - ${p.description}\n`;
				}
				text += '\n';
			}
		}

		const exampleBody = buildExampleBody(endpoint.params);
		if (exampleBody) {
			text += `Example request body:\n\n\`\`\`json\n${exampleBody}\n\`\`\`\n`;
		}

		for (const res of endpoint.responses) {
			text += `\n### Response - ${res.status} ${res.statusText}\n\n`;
			text += `${res.description}\n`;
			if (res.exampleBody) {
				text += `\n\`\`\`json\n${formatJson(res.exampleBody)}\n\`\`\`\n`;
			}
		}

		return text.trimEnd();
	}

	function slugify(path: string): string {
		return path
			.replace(/^\//, '')
			.replace(/[^a-zA-Z0-9]+/g, '_')
			.replace(/_+$/, '');
	}

	function generateToolSchema(): string {
		const bodyParams = endpoint.params.filter((p) => p.location === 'body');
		const queryParams = endpoint.params.filter((p) => p.location === 'query');
		const allParams = [...bodyParams, ...queryParams];

		const properties: Record<string, { type: string; description: string }> = {};
		const required: string[] = [];

		for (const p of allParams) {
			properties[p.name] = {
				type: p.type,
				description: p.description
			};
			if (p.required) required.push(p.name);
		}

		const schema = {
			type: 'function',
			function: {
				name: `${endpoint.method.toLowerCase()}_${slugify(endpoint.path)}`,
				description: endpoint.description,
				parameters: {
					type: 'object',
					properties,
					required
				}
			}
		};

		return JSON.stringify(schema, null, 2);
	}

	function generateCurl(): string {
		const bodyParams = endpoint.params.filter((p) => p.location === 'body');
		const queryParams = endpoint.params.filter((p) => p.location === 'query');

		let url = `${endpoint.baseUrl}${endpoint.path}`;

		if (queryParams.length > 0) {
			const qs = queryParams.map((p) => `${p.name}=${p.example || `<${p.name}>`}`).join('&');
			url += `?${qs}`;
		}

		let cmd = `curl -X ${endpoint.method} ${url}`;

		if (bodyParams.length > 0) {
			const body: Record<string, string> = {};
			for (const p of bodyParams) {
				body[p.name] = p.example || `<${p.name}>`;
			}
			cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`;
		}

		return cmd;
	}

	const rawContent: string[] = [generatePrompt(), generateToolSchema(), generateCurl()];
	const langs = ['markdown', 'json', 'bash'];

	$effect(() => {
		for (let i = 0; i < rawContent.length; i++) {
			const idx = i;
			highlight(rawContent[idx], langs[idx]).then((html) => {
				highlightedContent[idx] = html;
				highlightedContent = highlightedContent;
			});
		}
	});

	async function copyToClipboard() {
		const text = rawContent[active];
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.cssText = 'position:fixed;opacity:0';
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function openIn(service: 'chatgpt' | 'claude' | 'perplexity') {
		const text = encodeURIComponent(rawContent[active]);
		const urls = {
			chatgpt: `https://chat.openai.com/?q=${text}`,
			claude: `https://claude.ai/new?q=${text}`,
			perplexity: `https://www.perplexity.ai/search/new?q=${text}`
		};
		window.open(urls[service], '_blank');
	}
</script>

<div class="not-prose my-4 overflow-hidden rounded-lg border border-zinc-800">
	<div class="flex items-center border-b border-zinc-800 bg-zinc-900/50">
		{#each tabs as label, i}
			<button
				class="relative px-4 py-2.5 text-sm font-medium transition-colors {active === i
					? 'text-primary-400'
					: 'text-zinc-400 hover:text-zinc-200'}"
				onclick={() => (active = i)}
			>
				{label}
				{#if active === i}
					<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"></span>
				{/if}
			</button>
		{/each}

		<div class="ml-auto mr-2 flex items-center gap-1">
			<button
				class="ai-open-btn flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
				onclick={() => openIn('chatgpt')}
				title="Open in ChatGPT"
			>
				<img src="/icons/chatgpt.svg" alt="ChatGPT" class="h-5 w-5" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
			</button>
			<button
				class="ai-open-btn flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
				onclick={() => openIn('claude')}
				title="Open in Claude"
			>
				<img src="/icons/claude.svg" alt="Claude" class="h-5 w-5" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
			</button>
			<button
				class="ai-open-btn flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all"
				onclick={() => openIn('perplexity')}
				title="Open in Perplexity"
			>
				<img src="/icons/perplexity.svg" alt="Perplexity" class="h-5 w-5" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
			</button>

			<span class="mx-1 h-5 w-px bg-zinc-700"></span>

			<button
				class="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={copyToClipboard}
				title="Copy to clipboard"
			>
				{#if copied}
					<svg class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<div class="overflow-x-auto text-sm [&>pre]:!m-0 [&>pre]:!border-0 [&>pre]:!rounded-none">
		{#if highlightedContent[active]}
			{@html highlightedContent[active]}
		{/if}
	</div>
</div>

<style>
	.ai-open-btn img {
		opacity: 0.6;
		transition: opacity 0.15s;
	}
	.ai-open-btn:hover img {
		opacity: 1;
	}
</style>
