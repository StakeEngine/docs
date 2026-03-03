<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import {
		changelogEntries,
		groupByMonth,
		parseDate,
		type ChangelogType,
		type ChangelogEntry as EntryType
	} from '$lib/config/changelog';
	import ChangelogEntry from './ChangelogEntry.svelte';
	import PayoutChart from './PayoutChart.svelte';

	const filters: { label: string; value: ChangelogType | 'all' }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'Features', value: 'feature' },
		{ label: 'Payouts', value: 'payout' },
		{ label: 'Improvements', value: 'improvement' },
		{ label: 'Fixes', value: 'fix' },
		{ label: 'Breaking', value: 'breaking' }
	];

	const filterColors: Record<string, string> = {
		all: 'bg-zinc-700 text-white',
		feature: 'bg-emerald-500/20 text-emerald-400',
		payout: 'bg-purple-500/20 text-purple-400',
		improvement: 'bg-blue-500/20 text-blue-400',
		fix: 'bg-amber-500/20 text-amber-400',
		breaking: 'bg-red-500/20 text-red-400'
	};

	let activeFilter = $state<ChangelogType | 'all'>('all');

	const filteredEntries = $derived(
		activeFilter === 'all'
			? changelogEntries
			: changelogEntries.filter((e) => e.type === activeFilter)
	);

	const groups = $derived(groupByMonth(filteredEntries));

	const allFiltered = $derived(groups.flatMap((g) => g.entries));

	// Payout chart data - entries with payoutValue, sorted chronologically (oldest first)
	const payoutData = $derived(
		changelogEntries
			.filter((e) => e.payoutValue && e.payoutValue > 0)
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((e) => {
				// Entry date is 1st of month, but payout is for the previous month
				const d = parseDate(e.date);
				d.setMonth(d.getMonth() - 1);
				return {
					label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
					value: e.payoutValue!
				};
			})
	);

	onMount(() => {
		gsap.fromTo(
			'.changelog-filter-chip',
			{ y: 10, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
		);

		gsap.fromTo(
			'.changelog-entry',
			{ y: 20, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08, delay: 0.2, ease: 'power2.out' }
		);

		gsap.fromTo(
			'.changelog-month-header',
			{ x: -10, autoAlpha: 0 },
			{ x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.1, delay: 0.1, ease: 'power2.out' }
		);
	});
</script>

<div class="not-prose">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Changelog</h1>
		<p class="mt-2 text-sm text-zinc-400">Latest updates, improvements, and fixes to the Stake Engine platform.</p>
	</div>

	<!-- Payout Chart -->
	{#if payoutData.length > 1}
		<PayoutChart data={payoutData} />
	{/if}

	<!-- Filter chips -->
	<div class="mb-8 flex flex-wrap gap-2">
		{#each filters as filter}
			<button
				class="changelog-filter-chip rounded-full px-3.5 py-1.5 text-xs font-medium transition-all
					{activeFilter === filter.value
						? filterColors[filter.value]
						: 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}"
				onclick={() => (activeFilter = filter.value)}
			>
				{filter.label}
				{#if filter.value !== 'all'}
					<span class="ml-1 opacity-60">
						{changelogEntries.filter((e) => filter.value === 'all' || e.type === filter.value).length}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Timeline -->
	{#if groups.length === 0}
		<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
			<p class="text-sm text-zinc-500">No changelog entries match this filter.</p>
		</div>
	{:else}
		<div class="relative">
			{#each groups as group}
				<!-- Month header -->
				<div class="changelog-month-header mb-4 flex items-center gap-3" id={group.yearMonth}>
					<div class="flex items-center gap-2">
						<svg class="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
						</svg>
						<h2 class="text-sm font-semibold text-zinc-300">{group.label}</h2>
					</div>
					<div class="h-px flex-1 bg-zinc-800"></div>
				</div>

				<!-- Entries -->
				<div class="ml-1 sm:ml-2">
					{#each group.entries as entry, i}
						{@const globalIndex = allFiltered.indexOf(entry)}
						<ChangelogEntry {entry} isLast={globalIndex === allFiltered.length - 1} />
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
