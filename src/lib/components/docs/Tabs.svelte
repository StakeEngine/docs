<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		items,
		tab0,
		tab1,
		tab2,
		tab3,
		tab4
	}: {
		items: string[];
		tab0?: Snippet;
		tab1?: Snippet;
		tab2?: Snippet;
		tab3?: Snippet;
		tab4?: Snippet;
	} = $props();

	let active = $state(0);

	const tabs = $derived([tab0, tab1, tab2, tab3, tab4].slice(0, items.length));
</script>

<div class="not-prose my-4 overflow-hidden rounded-lg border border-zinc-800">
	<div class="flex border-b border-zinc-800 bg-zinc-900/50">
		{#each items as label, i}
			<button
				class="relative px-4 py-2.5 text-sm font-medium transition-colors {active === i
					? 'text-primary-400'
					: 'text-zinc-400 hover:text-zinc-200'}"
				onclick={() => (active = i)}
			>
				{label}
				{#if active === i}
					<span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"></span>
				{/if}
			</button>
		{/each}
	</div>
	<div class="px-4 py-3 text-sm text-zinc-300">
		{#each tabs as tab, i}
			{#if active === i && tab}
				{@render tab()}
			{/if}
		{/each}
	</div>
</div>
