<script lang="ts">
	import { canUndo, canRedo, undo, redo } from '$lib/stores/editor';

	let { textarea }: { textarea: HTMLTextAreaElement | undefined } = $props();
	let showComponents = $state(false);

	function wrap(before: string, after: string) {
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selected = text.slice(start, end);

		const replacement = before + (selected || 'text') + after;
		textarea.value = text.slice(0, start) + replacement + text.slice(end);

		if (selected) {
			textarea.selectionStart = start;
			textarea.selectionEnd = start + replacement.length;
		} else {
			textarea.selectionStart = start + before.length;
			textarea.selectionEnd = start + before.length + 4;
		}

		textarea.focus();
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}

	function insertPrefix(prefix: string) {
		if (!textarea) return;
		const start = textarea.selectionStart;
		const text = textarea.value;
		const lineStart = text.lastIndexOf('\n', start - 1) + 1;

		textarea.value = text.slice(0, lineStart) + prefix + text.slice(lineStart);
		textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
		textarea.focus();
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}

	function insertSnippet(snippet: string) {
		if (!textarea) return;
		const start = textarea.selectionStart;
		const text = textarea.value;

		textarea.value = text.slice(0, start) + snippet + text.slice(start);
		textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
		textarea.focus();
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}

	/**
	 * Inserts a component snippet. If the body already has a <script> block,
	 * the import is added inside it. Otherwise a new <script> block is prepended.
	 */
	function insertComponent(importLine: string, usage: string) {
		if (!textarea) return;
		let text = textarea.value;
		const cursorPos = textarea.selectionStart;

		// Check if import already exists
		const hasImport = text.includes(importLine);

		if (!hasImport) {
			const scriptMatch = text.match(new RegExp('<script[^>]*>([\\s\\S]*?)<\\/script>'));
			if (scriptMatch) {
				// Add import inside existing script block
				const scriptEnd = text.indexOf('<' + '/script>');
				const insertAt = scriptEnd;
				const importInsert = importLine + '\n';
				text = text.slice(0, insertAt) + importInsert + text.slice(insertAt);
				// Adjust cursor for added text
				const offset = cursorPos > insertAt ? importInsert.length : 0;
				textarea.value = text;
				// Now insert usage at adjusted cursor
				const usagePos = cursorPos + offset;
				textarea.value = text.slice(0, usagePos) + usage + text.slice(usagePos);
				textarea.selectionStart = textarea.selectionEnd = usagePos + usage.length;
			} else {
				// Create new script block at the very top of body
				const scriptBlock = '<script>\n' + importLine + '\n<' + '/script>\n\n';
				text = scriptBlock + text;
				textarea.value = text;
				// Insert usage at end
				const usagePos = text.length;
				textarea.value = text.slice(0, usagePos) + '\n' + usage;
				textarea.selectionStart = textarea.selectionEnd = usagePos + 1 + usage.length;
			}
		} else {
			// Import exists, just insert usage at cursor
			textarea.value = text.slice(0, cursorPos) + usage + text.slice(cursorPos);
			textarea.selectionStart = textarea.selectionEnd = cursorPos + usage.length;
		}

		textarea.focus();
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
		showComponents = false;
	}

	const markdownButtons = [
		{ label: 'B', title: 'Bold (Cmd+B)', action: () => wrap('**', '**') },
		{ label: 'I', title: 'Italic (Cmd+I)', action: () => wrap('*', '*') },
		{ label: '`', title: 'Inline Code', action: () => wrap('`', '`') },
		{ label: 'H2', title: 'Heading 2', action: () => insertPrefix('## ') },
		{ label: 'H3', title: 'Heading 3', action: () => insertPrefix('### ') },
		{ label: '[]', title: 'Link', action: () => wrap('[', '](url)') },
		{ label: '- ', title: 'List Item', action: () => insertPrefix('- ') },
		{ label: '1.', title: 'Numbered List', action: () => insertPrefix('1. ') },
		{
			label: '```',
			title: 'Code Block',
			action: () => insertSnippet('\n```ts\n// code\n```\n')
		},
		{
			label: '|T|',
			title: 'Table',
			action: () =>
				insertSnippet('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| cell     | cell     | cell     |\n')
		}
	];

	interface ComponentSnippet {
		label: string;
		description: string;
		color: string;
		importLine: string;
		usage: string;
	}

	const componentSnippets: ComponentSnippet[] = [
		{
			label: 'Callout Info',
			description: 'Blue info callout box',
			color: 'text-blue-400',
			importLine: "import Callout from '$lib/components/docs/Callout.svelte';",
			usage: '\n<Callout type="info">\n  Info message here.\n</Callout>\n'
		},
		{
			label: 'Callout Warning',
			description: 'Amber warning callout box',
			color: 'text-amber-400',
			importLine: "import Callout from '$lib/components/docs/Callout.svelte';",
			usage: '\n<Callout type="warning">\n  Warning message here.\n</Callout>\n'
		},
		{
			label: 'Callout Danger',
			description: 'Red danger callout box',
			color: 'text-red-400',
			importLine: "import Callout from '$lib/components/docs/Callout.svelte';",
			usage: '\n<Callout type="danger">\n  Danger message here.\n</Callout>\n'
		},
		{
			label: 'Callout Tip',
			description: 'Green tip callout box',
			color: 'text-primary-400',
			importLine: "import Callout from '$lib/components/docs/Callout.svelte';",
			usage: '\n<Callout type="tip">\n  Tip message here.\n</Callout>\n'
		},
		{
			label: 'Badge',
			description: 'Inline status badge pill',
			color: 'text-emerald-400',
			importLine: "import Badge from '$lib/components/docs/Badge.svelte';",
			usage: '<Badge type="new" />'
		},
		{
			label: 'Tabs',
			description: 'Tabbed content panels',
			color: 'text-purple-400',
			importLine: "import Tabs from '$lib/components/docs/Tabs.svelte';",
			usage: `\n<Tabs items={["Tab 1", "Tab 2"]}>
  {#snippet tab0()}
    First tab content.
  {/snippet}
  {#snippet tab1()}
    Second tab content.
  {/snippet}
</Tabs>\n`
		},
		{
			label: 'Steps',
			description: 'Numbered step-by-step guide',
			color: 'text-cyan-400',
			importLine: "import Steps from '$lib/components/docs/Steps.svelte';",
			usage: `\n<Steps>
  {#snippet step1()}
    First step description.
  {/snippet}
  {#snippet step2()}
    Second step description.
  {/snippet}
  {#snippet step3()}
    Third step description.
  {/snippet}
</Steps>\n`
		},
		{
			label: 'Collapsible',
			description: 'Expandable/collapsible section',
			color: 'text-zinc-300',
			importLine: "import Collapsible from '$lib/components/docs/Collapsible.svelte';",
			usage: '\n<Collapsible title="Click to expand">\n  Hidden content here.\n</Collapsible>\n'
		},
		{
			label: 'CodeGroup',
			description: 'Tabbed code blocks with syntax highlighting',
			color: 'text-orange-400',
			importLine: "import CodeGroup from '$lib/components/docs/CodeGroup.svelte';",
			usage: `\n<CodeGroup
  items={["JavaScript", "Python"]}
  codes={[\`const x = 1;\`, \`x = 1\`]}
  langs={["javascript", "python"]}
/>\n`
		},
		{
			label: 'ApiParamTable',
			description: 'API parameter table with types',
			color: 'text-sky-400',
			importLine: "import ApiParamTable from '$lib/components/docs/ApiParamTable.svelte';",
			usage: '\n<ApiParamTable params={endpoint.params} />\n'
		},
		{
			label: 'ApiResponseSection',
			description: 'API response examples with status codes',
			color: 'text-sky-400',
			importLine: "import ApiResponseSection from '$lib/components/docs/ApiResponseSection.svelte';",
			usage: '\n<ApiResponseSection responses={endpoint.responses} />\n'
		},
		{
			label: 'ApiTester',
			description: 'Interactive API tester wrapper',
			color: 'text-sky-400',
			importLine: "import ApiTester from '$lib/components/docs/ApiTester.svelte';",
			usage: `\n<ApiTester {endpoint}>\n\n# Endpoint Title\n\nEndpoint description.\n\n</ApiTester>\n`
		}
	];
</script>

<div class="border-b border-zinc-800 px-3 py-1.5">
	<!-- Row 1: Undo/Redo + Markdown formatting -->
	<div class="flex flex-wrap items-center gap-0.5">
		<button
			onclick={undo}
			disabled={!$canUndo}
			title="Undo (Cmd+Z)"
			class="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
			</svg>
		</button>
		<button
			onclick={redo}
			disabled={!$canRedo}
			title="Redo (Cmd+Y)"
			class="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
		>
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
			</svg>
		</button>

		<span class="mx-0.5 h-4 w-px bg-zinc-800"></span>

		{#each markdownButtons as btn}
			<button
				onclick={btn.action}
				title={btn.title}
				class="rounded px-1.5 py-1 text-[11px] font-mono text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
			>
				{btn.label}
			</button>
		{/each}

		<span class="mx-0.5 h-4 w-px bg-zinc-800"></span>

		<!-- Components dropdown -->
		<div class="relative">
			<button
				onclick={() => (showComponents = !showComponents)}
				title="Insert Component"
				class="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors {showComponents ? 'bg-zinc-800 text-white' : ''}"
			>
				<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Svelte
				<svg class="h-2.5 w-2.5 transition-transform {showComponents ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if showComponents}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="absolute right-0 top-full z-50 mt-1 max-h-80 w-60 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-xl custom-scrollbar"
					onmouseleave={() => (showComponents = false)}
				>
					{#each componentSnippets as comp}
						<button
							onclick={() => insertComponent(comp.importLine, comp.usage)}
							class="flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-zinc-800/60 transition-colors"
						>
							<span class="mt-0.5 {comp.color}">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
								</svg>
							</span>
							<div class="min-w-0">
								<div class="text-[11px] font-medium text-zinc-200">{comp.label}</div>
								<div class="text-[10px] text-zinc-500 leading-tight">{comp.description}</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
