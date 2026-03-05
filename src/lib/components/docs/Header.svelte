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

	$effect(() => {
		results;
		selectedIndex = 0;
	});

	$effect(() => {
		if (showSearch && searchInput) {
			searchInput.focus();
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl">
	<div class="bg-gradient-brand h-1"></div>
	<div class="mx-auto max-w-7xl flex h-20 items-center justify-between px-4 lg:px-6">
		<!-- Left: Menu + Logo + Nav -->
		<div class="flex items-center gap-6">
			<button
				onclick={onMenuClick}
				class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden transition-colors"
				aria-label="Open menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>

			<a href="/" class="shrink-0">
				<img src="/stake-engine.svg" alt="Stake Engine" class="h-12 invert" />
			</a>

			<nav class="hidden lg:flex items-center gap-1 ml-4">
				<a
					href="/docs"
					class="nav-link {!isFaqSection && !isChangelogSection ? 'active' : ''}"
				>Docs</a>
				<a
					href="/faq"
					class="nav-link {isFaqSection ? 'active' : ''}"
				>FAQ</a>
				<a
					href="/changelog"
					class="nav-link {isChangelogSection ? 'active' : ''}"
				>Changelog</a>
			</nav>
		</div>

		<!-- Right: Search + Social -->
		<div class="flex items-center gap-3">
			<button
				onclick={openSearch}
				class="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition w-56"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<span>Search...</span>
				<kbd class="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">&#8984;K</kbd>
			</button>

			<!-- Mobile search -->
			<button
				onclick={openSearch}
				class="sm:hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
				aria-label="Search"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</button>

			<!-- Discord -->
			<a
				href="https://discord.gg/stakeengine"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-[#5865F2] transition-colors"
				aria-label="Discord"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 -28.5 256 256">
					<path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
				</svg>
			</a>

			<!-- GitHub -->
			<a
				href="https://github.com/StakeEngine/docs"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
		class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
		onclick={closeSearch}
		role="button"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeSearch()}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="dialog"
			tabindex="-1"
		>
			<div class="flex items-center gap-3 border-b border-white/[0.06] p-4">
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
				<kbd class="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-500">Esc</kbd>
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
									class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition {i === selectedIndex ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}"
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

<style>
	:global(.nav-link) {
		display: inline-flex;
		align-items: center;
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		transition: color 0.2s ease, background 0.2s ease;
		text-decoration: none;
	}

	:global(.nav-link:hover) {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.06);
	}

	:global(.nav-link.active) {
		color: #fff;
		background: #1F2B37;
	}
</style>
