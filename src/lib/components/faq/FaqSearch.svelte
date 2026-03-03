<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from '@lucide/svelte';

	interface PageMeta {
		metadata?: {
			title?: string;
			description?: string;
			nav_title?: string;
		};
	}

	interface SearchEntry {
		title: string;
		href: string;
		section: string;
		description?: string;
		content: string;
	}

	interface SearchResult extends SearchEntry {
		snippet?: string;
	}

	const pages = import.meta.glob<PageMeta>('/src/routes/faq/**/+page.svx', { eager: true });
	const rawPages = import.meta.glob<string>('/src/routes/faq/**/+page.svx', {
		eager: true,
		query: '?raw',
		import: 'default'
	});

	function stripMarkdown(raw: string): string {
		return raw
			.replace(/^---[\s\S]*?---\n*/m, '')
			.replace(/<script[\s\S]*?<\/script>/g, '')
			.replace(/<style[\s\S]*?<\/style>/g, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/```[\s\S]*?```/g, ' ')
			.replace(/`[^`]*`/g, ' ')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/^#{1,6}\s+/gm, '')
			.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function slugToTitle(slug: string): string {
		return slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function buildIndex(): SearchEntry[] {
		const entries: SearchEntry[] = [];
		for (const [modulePath, mod] of Object.entries(pages)) {
			const href = modulePath.replace('/src/routes', '').replace('/+page.svx', '') || '/faq';
			const meta = (mod as PageMeta).metadata;
			const title = meta?.nav_title ?? meta?.title ?? slugToTitle(href.split('/').pop() ?? '');
			const segments = href.replace('/faq', '').split('/').filter(Boolean);
			const section = segments.length > 1 ? 'FAQ > ' + slugToTitle(segments[0]) : 'FAQ';
			const raw = rawPages[modulePath] ?? '';
			entries.push({
				title,
				href,
				section,
				content: stripMarkdown(raw),
				...(meta?.description ? { description: meta.description } : {})
			});
		}
		return entries;
	}

	const faqIndex = buildIndex();

	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	function getSnippet(content: string, q: string): string | undefined {
		const lower = content.toLowerCase();
		const idx = lower.indexOf(q);
		if (idx === -1) return undefined;
		const start = Math.max(0, idx - 40);
		const end = Math.min(content.length, idx + q.length + 80);
		let snippet = content.slice(start, end).trim();
		if (start > 0) snippet = '...' + snippet;
		if (end < content.length) snippet = snippet + '...';
		return snippet;
	}

	const results: SearchResult[] = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return faqIndex
			.filter(
				(entry) =>
					entry.title.toLowerCase().includes(q) ||
					entry.section.toLowerCase().includes(q) ||
					(entry.description?.toLowerCase().includes(q) ?? false) ||
					entry.content.toLowerCase().includes(q)
			)
			.map((entry) => ({
				...entry,
				snippet: getSnippet(entry.content, q)
			}));
	});

	function navigateTo(href: string) {
		const q = query.trim();
		goto(q ? `${href}?q=${encodeURIComponent(q)}` : href);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && results.length > 0) {
			e.preventDefault();
			navigateTo(results[selectedIndex].href);
		}
	}

	function highlightParts(text: string, q: string): { text: string; match: boolean }[] {
		if (!q) return [{ text, match: false }];
		const lower = text.toLowerCase();
		const parts: { text: string; match: boolean }[] = [];
		let lastIndex = 0;
		let idx = lower.indexOf(q);
		while (idx !== -1) {
			if (idx > lastIndex) {
				parts.push({ text: text.slice(lastIndex, idx), match: false });
			}
			parts.push({ text: text.slice(idx, idx + q.length), match: true });
			lastIndex = idx + q.length;
			idx = lower.indexOf(q, lastIndex);
		}
		if (lastIndex < text.length) {
			parts.push({ text: text.slice(lastIndex), match: false });
		}
		return parts;
	}

	$effect(() => {
		results;
		selectedIndex = 0;
	});
</script>

<div class="not-prose relative">
	<div class="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors focus-within:border-zinc-700">
		<Search class="h-5 w-5 flex-shrink-0 text-zinc-500" />
		<input
			bind:this={inputEl}
			type="text"
			placeholder="Search FAQ..."
			class="w-full rounded-sm bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
			bind:value={query}
			onkeydown={handleKeydown}
		/>
		{#if query}
			<button
				class="text-xs text-zinc-500 hover:text-zinc-300"
				onclick={() => { query = ''; inputEl?.focus(); }}
			>Clear</button>
		{/if}
	</div>

	{#if query.trim() && results.length > 0}
		<div class="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
			<ul class="py-1">
				{#each results as result, i}
					<li>
						<button
							class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition {i === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}"
							onclick={() => navigateTo(result.href)}
							onmouseenter={() => (selectedIndex = i)}
						>
							<span class="text-sm font-medium {i === selectedIndex ? 'text-white' : 'text-zinc-300'}">
								{#each highlightParts(result.title, query.trim().toLowerCase()) as part}
									{#if part.match}<mark class="rounded-sm bg-amber-500/30 px-0.5 text-amber-200">{part.text}</mark>{:else}{part.text}{/if}
								{/each}
							</span>
							{#if result.section}
								<span class="text-xs text-zinc-500">{result.section}</span>
							{/if}
							{#if result.snippet}
								<span class="text-xs text-zinc-500 line-clamp-1">
									{#each highlightParts(result.snippet, query.trim().toLowerCase()) as part}
										{#if part.match}<mark class="rounded-sm bg-amber-500/30 px-0.5 text-amber-200">{part.text}</mark>{:else}{part.text}{/if}
									{/each}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{:else if query.trim() && results.length === 0}
		<div class="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-sm text-zinc-500 shadow-xl">
			No FAQ results for "{query}"
		</div>
	{/if}
</div>
