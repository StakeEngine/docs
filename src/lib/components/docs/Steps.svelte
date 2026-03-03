<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		step1,
		step2,
		step3,
		step4,
		step5,
		step6
	}: {
		step1?: Snippet;
		step2?: Snippet;
		step3?: Snippet;
		step4?: Snippet;
		step5?: Snippet;
		step6?: Snippet;
	} = $props();

	const steps = $derived(
		[step1, step2, step3, step4, step5, step6].filter((s): s is Snippet => s !== undefined)
	);
</script>

<div class="not-prose my-4">
	{#each steps as step, i}
		<div class="flex gap-4">
			<div class="relative flex flex-col items-center">
				<div
					class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-semibold text-primary-400"
				>
					{i + 1}
				</div>
				{#if i < steps.length - 1}
					<div class="absolute top-8 bottom-0 w-px bg-zinc-800"></div>
				{/if}
			</div>
			<div class="pb-8 pt-1 text-sm text-zinc-300">
				{@render step()}
			</div>
		</div>
	{/each}
</div>
