<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { searchIndex } from '$lib/config/navigation';
	import { faqSearchIndex } from '$lib/config/faq-navigation';
	import type { SearchEntry } from '$lib/types/navigation';

	const combinedSearchIndex: SearchEntry[] = [...searchIndex, ...faqSearchIndex];

	let query = $state('');
	let selectedIndex = $state(0);

	const pathKeywords = $derived(
		$page.url.pathname
			.replace('/docs/', '')
			.replace('/faq/', '')
			.split('/')
			.filter(Boolean)
			.flatMap((seg) => seg.split('-'))
			.filter((w) => w.length > 2)
	);

	const suggestions = $derived.by(() => {
		if (pathKeywords.length === 0) return [];
		return combinedSearchIndex
			.map((entry) => {
				let score = 0;
				const titleLower = entry.title.toLowerCase();
				const hrefLower = entry.href.toLowerCase();
				const sectionLower = entry.section.toLowerCase();
				for (const kw of pathKeywords) {
					const kwLower = kw.toLowerCase();
					if (titleLower.includes(kwLower)) score += 3;
					if (hrefLower.includes(kwLower)) score += 2;
					if (sectionLower.includes(kwLower)) score += 1;
				}
				return { ...entry, score };
			})
			.filter((e) => e.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 5);
	});

	interface SearchResult extends SearchEntry {
		snippet?: string;
	}

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

	let results: SearchResult[] = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return combinedSearchIndex
			.filter((entry) => {
				return (
					entry.title.toLowerCase().includes(q) ||
					entry.section.toLowerCase().includes(q) ||
					(entry.description?.toLowerCase().includes(q) ?? false) ||
					entry.content.toLowerCase().includes(q)
				);
			})
			.map((entry) => ({
				...entry,
				snippet: getSnippet(entry.content, q)
			}))
			.slice(0, 8);
	});

	function navigateTo(href: string) {
		const q = query.trim();
		goto(q ? `${href}?q=${encodeURIComponent(q)}` : href);
	}

	function handleKeydown(e: KeyboardEvent) {
		const list = results.length > 0 ? results : [];
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, list.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && list.length > 0) {
			e.preventDefault();
			navigateTo(list[selectedIndex].href);
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

<div class="not-prose flex flex-col items-center py-12 px-4">
	<div class="mb-6 select-none text-[7rem] font-black leading-none tracking-tighter text-zinc-800/50">404</div>

	<div class="mb-2 text-xl font-semibold text-white">Page not found</div>
	<p class="mb-8 max-w-md text-center text-sm text-zinc-400">
		<code class="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">{$page.url.pathname}</code>
		doesn't exist. Try searching for what you need.
	</p>

	<!-- Inline search -->
	<div class="w-full max-w-md">
		<div class="relative">
			<svg class="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="text"
				placeholder="Search docs & FAQ..."
				class="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50"
				bind:value={query}
				onkeydown={handleKeydown}
			/>
		</div>

		{#if query.trim() && results.length > 0}
			<div class="mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
				<ul>
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
									<span class="line-clamp-1 text-xs text-zinc-500">
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
			<div class="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center text-sm text-zinc-500">
				No results for "{query}"
			</div>
		{/if}
	</div>

	<!-- Suggestions based on URL -->
	{#if suggestions.length > 0 && !query.trim()}
		<div class="mt-8 w-full max-w-md">
			<div class="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Maybe you were looking for</div>
			<div class="overflow-hidden rounded-lg border border-zinc-800">
				{#each suggestions as suggestion, i}
					<a
						href={suggestion.href}
						class="group flex items-center gap-3 px-4 py-3 transition hover:bg-zinc-800/60 {i > 0 ? 'border-t border-zinc-800/60' : ''}"
					>
						<svg class="h-4 w-4 flex-shrink-0 text-zinc-600 transition group-hover:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
						</svg>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline gap-2">
								<span class="text-sm font-medium text-zinc-300 transition group-hover:text-white">{suggestion.title}</span>
								{#if suggestion.section}
									<span class="text-xs text-zinc-600">{suggestion.section}</span>
								{/if}
							</div>
							{#if suggestion.description}
								<p class="mt-0.5 truncate text-xs text-zinc-500">{suggestion.description}</p>
							{/if}
						</div>
						<svg class="h-3.5 w-3.5 flex-shrink-0 text-zinc-700 transition group-hover:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
						</svg>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Fallback links -->
	{#if suggestions.length === 0 && !query.trim()}
		<div class="mt-8 flex gap-3">
			<a
				href="/docs"
				class="rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
			>
				Browse Docs
			</a>
			<a
				href="/faq"
				class="rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
			>
				View FAQ
			</a>
		</div>
	{/if}
</div>
