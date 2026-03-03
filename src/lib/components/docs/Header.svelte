<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { searchIndex } from '$lib/config/navigation';
	import { faqSearchIndex } from '$lib/config/faq-navigation';
	import { changelogSearchIndex } from '$lib/config/changelog';
	import type { SearchEntry } from '$lib/types/navigation';

	let { onMenuClick }: { onMenuClick: () => void } = $props();

	const combinedSearchIndex: SearchEntry[] = [...searchIndex, ...faqSearchIndex, ...changelogSearchIndex];

	const isFaqSection = $derived($page.url.pathname.startsWith('/faq'));
	const isChangelogSection = $derived($page.url.pathname.startsWith('/changelog'));
	let showSearch = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);

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
			}));
	});

	function openSearch() {
		showSearch = true;
		query = '';
		selectedIndex = 0;
	}

	function closeSearch() {
		showSearch = false;
	}

	function navigateTo(href: string) {
		const q = query.trim();
		closeSearch();
		goto(q ? `${href}?q=${encodeURIComponent(q)}` : href);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			openSearch();
		}
		if (e.key === 'Escape') {
			closeSearch();
		}
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeSearch();
		} else if (e.key === 'ArrowDown') {
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

	let searchInput: HTMLInputElement | undefined = $state();

	// Reset selection when results change
	$effect(() => {
		results;
		selectedIndex = 0;
	});

	// Focus input when modal opens
	$effect(() => {
		if (showSearch && searchInput) {
			searchInput.focus();
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
	<div class="flex h-16 items-center justify-between px-4 lg:px-6">
		<!-- Left: Menu + Logo -->
		<div class="flex items-center gap-4">
			<button
				onclick={onMenuClick}
				class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
				aria-label="Open menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<a href="/" class="flex items-center gap-2">
				<img src="/stake-engine.svg" alt="Stake Engine" class="h-8 invert" />
			</a>
			<nav class="hidden sm:flex items-center gap-1 ml-4">
				<a
					href="/docs"
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {!isFaqSection && !isChangelogSection ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}"
				>Docs</a>
				<a
					href="/faq"
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isFaqSection ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}"
				>FAQ</a>
				<a
					href="/changelog"
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isChangelogSection ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}"
				>Changelog</a>
			</nav>
		</div>

		<!-- Center: Search -->
		<button
			onclick={openSearch}
			class="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition w-64"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<span>Search...</span>
			<kbd class="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">Cmd K</kbd>
		</button>

		<!-- Right: GitHub -->
		<div class="flex items-center gap-2">
			<a
				href="https://github.com/stake-engine/docs"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
				aria-label="GitHub"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
				</svg>
			</a>
		</div>
	</div>
</header>

<!-- Search Modal -->
{#if showSearch}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm"
		onclick={closeSearch}
		onkeydown={(e) => e.key === 'Escape' && closeSearch()}
		role="button"
		tabindex="0"
	>
		<div
			class="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex items-center gap-3 border-b border-zinc-800 p-4">
				<svg class="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:this={searchInput}
					type="text"
					placeholder="Search docs & FAQ..."
					class="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none"
					bind:value={query}
					onkeydown={handleSearchKeydown}
				/>
				<kbd class="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-500">Esc</kbd>
			</div>
			<div class="max-h-80 overflow-y-auto">
				{#if query.trim() === ''}
					<div class="p-4 text-center text-sm text-zinc-500">
						Start typing to search...
					</div>
				{:else if results.length === 0}
					<div class="p-4 text-center text-sm text-zinc-500">
						No results found for "{query}"
					</div>
				{:else}
					<ul class="py-2">
						{#each results as result, i}
							<li>
								<button
									class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition {i === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}"
									onclick={() => navigateTo(result.href)}
									onmouseenter={() => (selectedIndex = i)}
								>
									<span class="text-sm font-medium {i === selectedIndex ? 'text-white' : 'text-zinc-300'}">
										{#each highlightParts(result.title, query.trim().toLowerCase()) as part}
											{#if part.match}<mark class="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">{part.text}</mark>{:else}{part.text}{/if}
										{/each}
									</span>
									{#if result.section}
										<span class="text-xs text-zinc-500">{result.section}</span>
									{/if}
									{#if result.snippet}
										<span class="text-xs text-zinc-500 line-clamp-1">
											{#each highlightParts(result.snippet, query.trim().toLowerCase()) as part}
												{#if part.match}<mark class="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">{part.text}</mark>{:else}{part.text}{/if}
											{/each}
										</span>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
{/if}
