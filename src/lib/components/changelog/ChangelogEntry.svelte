<script lang="ts">
	import { parseDate, type ChangelogEntry } from '$lib/config/changelog';

	let { entry, isLast = false }: { entry: ChangelogEntry; isLast?: boolean } = $props();

	const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
		feature: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Feature' },
		fix: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Fix' },
		improvement: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Improvement' },
		breaking: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Breaking' },
		payout: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Payout' }
	};

	const dotColor: Record<string, string> = {
		feature: 'bg-emerald-400',
		fix: 'bg-amber-400',
		improvement: 'bg-blue-400',
		breaking: 'bg-red-400',
		payout: 'bg-purple-400'
	};

	const config = $derived(typeConfig[entry.type] ?? typeConfig.feature);
	const formattedDate = $derived(
		parseDate(entry.date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	function formatUsd(value: number): string {
		if (value >= 1_000_000) {
			const m = value / 1_000_000;
			return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
		}
		return `$${value.toLocaleString('en-US')}`;
	}
</script>

<div class="changelog-entry group relative flex gap-4 sm:gap-6">
	<!-- Timeline line + dot -->
	<div class="relative flex flex-col items-center">
		<div
			class="relative z-10 mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ring-4 ring-zinc-950 {dotColor[entry.type] ?? dotColor.feature}"
		></div>
		{#if !isLast}
			<div class="absolute top-5 bottom-0 w-px bg-zinc-800"></div>
		{/if}
	</div>

	<!-- Card -->
	<div class="mb-8 min-w-0 flex-1 {isLast ? '' : 'pb-2'}">
		{#if entry.hasContent}
			<a
				href={entry.href}
				class="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/80 no-underline"
			>
				<div class="flex flex-wrap items-center gap-2 mb-2">
					<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {config.bg} {config.text}">
						{config.label}
					</span>
					{#if entry.version}
						<span class="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
							v{entry.version}
						</span>
					{/if}
					{#if entry.payoutValue}
						<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
							{formatUsd(entry.payoutValue)}
						</span>
					{/if}
					<span class="text-xs text-zinc-500">{formattedDate}</span>
				</div>
				<h3 class="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors sm:text-base">
					{entry.title}
				</h3>
				<p class="mt-1 text-sm text-zinc-400 leading-relaxed line-clamp-2">{entry.description}</p>
				<div class="mt-3 flex items-center text-xs text-primary-500">
					<span>Read more</span>
					<svg class="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{:else}
			<!-- Inline card (no link) -->
			<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
				<div class="flex flex-wrap items-center gap-2 mb-2">
					<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {config.bg} {config.text}">
						{config.label}
					</span>
					{#if entry.version}
						<span class="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
							v{entry.version}
						</span>
					{/if}
					{#if entry.payoutValue}
						<span class="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
							{formatUsd(entry.payoutValue)}
						</span>
					{/if}
					<span class="text-xs text-zinc-500">{formattedDate}</span>
				</div>
				<h3 class="text-sm font-semibold text-white sm:text-base">{entry.title}</h3>
				<p class="mt-1 text-sm text-zinc-400 leading-relaxed">{entry.description}</p>
			</div>
		{/if}
	</div>
</div>
