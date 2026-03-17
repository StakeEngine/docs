<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { changelogEntries, groupByMonth } from '$lib/config/changelog';

	let { isOpen, onclose }: { isOpen: boolean; onclose: () => void } = $props();

	const isFaqSection = $derived($page.url.pathname.startsWith(`${base}/faq`));
	const isChangelogSection = $derived($page.url.pathname.startsWith(`${base}/changelog`));

	const groups = groupByMonth(changelogEntries);

	let previousPathname = $page.url.pathname;

	// Close on navigation
	$effect(() => {
		const currentPathname = $page.url.pathname;
		if (currentPathname !== previousPathname) {
			previousPathname = currentPathname;
			onclose();
		}
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		role="button"
		tabindex="0"
	>
		<div
			class="absolute inset-y-0 left-0 w-72 border-r border-zinc-800 bg-zinc-950 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
		>
			<div class="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
				<span class="text-sm font-semibold text-white">Changelog</span>
				<button
					onclick={onclose}
					class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
					aria-label="Close menu"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex gap-1 p-3 border-b border-zinc-800">
				<a
					href="{base}/docs"
					class="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors {!isFaqSection && !isChangelogSection ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}"
				>Docs</a>
				<a
					href="{base}/faq"
					class="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors {isFaqSection ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}"
				>FAQ</a>
				<a
					href="{base}/changelog"
					class="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors {isChangelogSection ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}"
				>Changelog</a>
			</div>

			<nav class="overflow-y-auto p-4 text-sm" aria-label="Changelog navigation">
				<a
					href="{base}/changelog"
					class="mb-3 flex items-center gap-2 rounded-md px-3 py-2 font-medium text-white bg-zinc-800"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					All Updates
				</a>

				<div class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Archive</div>

				{#each groups as group}
					<a
						href="{base}/changelog#{group.yearMonth}"
						class="flex items-center justify-between rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
					>
						<span>{group.label}</span>
						<span class="text-xs text-zinc-600">{group.entries.length}</span>
					</a>
				{/each}
			</nav>
		</div>
	</div>
{/if}
