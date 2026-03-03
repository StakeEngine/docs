<script lang="ts">
	import { page } from '$app/stores';
	import { changelogEntries, groupByMonth } from '$lib/config/changelog';

	const groups = groupByMonth(changelogEntries);
	const isTimeline = $derived($page.url.pathname === '/changelog');

	// Count by type
	const totalCount = changelogEntries.length;
</script>

<nav class="overflow-y-auto px-4 py-6 text-sm" aria-label="Changelog navigation">
	<div class="mb-4">
		<a
			href="/changelog"
			class="flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors
				{isTimeline ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			All Updates
			<span class="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{totalCount}</span>
		</a>
	</div>

	<div class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">Archive</div>

	{#each groups as group}
		<a
			href={isTimeline ? `#${group.yearMonth}` : '/changelog'}
			class="flex items-center justify-between rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
		>
			<span>{group.label}</span>
			<span class="text-xs text-zinc-600">{group.entries.length}</span>
		</a>
	{/each}
</nav>
