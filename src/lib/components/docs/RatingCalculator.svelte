<script lang="ts">
	const SCORES = [0, 0.33, 0.67, 1, 1.33, 1.67, 2, 2.33, 2.67, 3] as const;
	const MAX_IDX = SCORES.length - 1;

	const SNAP_INDICES: Record<number, number> = { 0: 0, 1: 3, 2: 6, 3: 9 };

	let indices: [number, number, number] = $state([5, 7, 6]);

	const scores = $derived([SCORES[indices[0]], SCORES[indices[1]], SCORES[indices[2]]] as const);
	const rawAverage = $derived((scores[0] + scores[1] + scores[2]) / 3);
	const average = $derived(Math.round(rawAverage * 100) / 100);
	const finalRating = $derived(average < 1 ? 0 : Math.round(average));
	const approved = $derived(finalRating >= 1);

	function fmt(v: number): string {
		return v === 0 ? '0' : v === 3 ? '3' : v.toFixed(2);
	}

	function handleInput(ri: number, e: Event) {
		indices[ri] = parseInt((e.target as HTMLInputElement).value);
	}

	function snapTo(ri: number, star: number) {
		indices[ri] = SNAP_INDICES[star];
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="not-prose my-6 select-none overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/50">
	<div class="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
		<svg class="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
		<span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rating Calculator</span>
	</div>

	<div class="grid gap-px bg-zinc-800 sm:grid-cols-3">
		{#each ['A', 'B', 'C'] as label, i (label)}
			<div class="flex flex-col gap-2 bg-zinc-900/80 px-4 py-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-500">Reviewer {label}</span>
					<span class="font-mono text-xs font-bold text-zinc-200">{fmt(scores[i])}</span>
				</div>
				<input
					type="range"
					min="0"
					max={MAX_IDX}
					step="1"
					value={indices[i]}
					oninput={(e) => handleInput(i, e)}
					class="rating-slider"
					aria-label="Score for Reviewer {label}"
				/>
				<div class="flex items-center justify-between text-[9px]">
					{#each [0, 1, 2, 3] as star (star)}
						<button
							type="button"
							class="cursor-pointer px-0.5 transition-colors {scores[i] >= star && scores[i] < star + 1 || (star === 3 && scores[i] === 3) ? 'text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}"
							onclick={() => snapTo(i, star)}
						>{star}</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-0.5">
				{#if finalRating === 0}
					<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.34 8.34 2 9.27l5 4.87L5.82 21 12 17.77 18.18 21l-.59-3.43"/><path d="M18.42 12.76 22 9.27l-6.91-1L12 2l-1.44 2.91"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
					<svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
					<svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
					<svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
				{:else}
					<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.34 8.34 2 9.27l5 4.87L5.82 21 12 17.77 18.18 21l-.59-3.43"/><path d="M18.42 12.76 22 9.27l-6.91-1L12 2l-1.44 2.91"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
					{#each [1, 2, 3] as star (star)}
						{#if star <= finalRating}
							<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
						{:else}
							<svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
						{/if}
					{/each}
				{/if}
			</div>
			<div>
				<span class="text-sm font-bold {finalRating === 3 ? 'text-yellow-300' : finalRating === 0 ? 'text-red-400' : 'text-zinc-100'}">{finalRating === 0 ? 'Not Approved' : finalRating + (finalRating === 1 ? ' Star' : ' Stars')}</span>
				<span class="ml-1.5 font-mono text-xs text-zinc-500">avg {average.toFixed(2)}</span>
			</div>
		</div>

		{#if !approved}
			<span class="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-medium text-red-400">Rejected</span>
		{:else}
			<span class="badge-approved rounded-full px-2.5 py-1 text-[10px] font-semibold">Approved</span>
		{/if}
	</div>
</div>

<style>
	.rating-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: #27272a;
		outline: none;
		cursor: pointer;
	}
	.rating-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #a1a1aa;
		border: 2px solid #52525b;
		cursor: pointer;
		transition: background 120ms;
	}
	.rating-slider::-webkit-slider-thumb:hover {
		background: #d4d4d8;
	}
	.rating-slider::-webkit-slider-thumb:active {
		background: #e4e4e7;
	}
	.rating-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #a1a1aa;
		border: 2px solid #52525b;
		cursor: pointer;
	}
	.rating-slider::-moz-range-thumb:hover {
		background: #d4d4d8;
	}
	.rating-slider::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: #27272a;
	}
	.badge-approved {
		background: linear-gradient(135deg, rgba(90, 249, 228, 0.15) 0%, rgba(19, 170, 252, 0.15) 50%, rgba(20, 117, 225, 0.15) 100%);
		color: #5AF9E4;
		border: 1px solid rgba(90, 249, 228, 0.2);
	}
</style>
