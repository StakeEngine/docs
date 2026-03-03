<script lang="ts">
	import { highlight } from '$lib/highlight';

	let {
		items,
		codes,
		langs
	}: {
		items: string[];
		codes: string[];
		langs?: string[];
	} = $props();

	let active = $state(0);

	let highlightedCodes = $state<string[]>([]);

	$effect(() => {
		Promise.all(codes.map((code, i) => highlight(code, langs?.[i]))).then((result) => {
			highlightedCodes = result;
		});
	});
</script>

<div class="code-group not-prose my-4 overflow-hidden rounded-lg border border-zinc-800">
	<div class="flex border-b border-zinc-800 bg-[#1c1c22]">
		{#each items as label, i}
			<button
				class="relative px-4 py-2 font-mono text-[13px] transition-colors {active === i
					? 'text-primary-400 bg-zinc-900/50'
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
	<div class="code-group-panel">
		{#if highlightedCodes[active]}
			{@html highlightedCodes[active]}
		{:else}
			<pre class="m-0 overflow-x-auto bg-zinc-900 p-4"><code class="text-sm text-zinc-300">{codes[active]}</code></pre>
		{/if}
	</div>
</div>

<style>
	.code-group-panel :global(pre) {
		margin: 0;
		border-radius: 0;
		border: none;
		overflow-x: auto;
		padding: 0.75rem 1rem;
		background-color: #18181b !important;
	}

	.code-group-panel :global(code) {
		font-size: 0.875rem;
		line-height: 1.7;
		counter-reset: line;
		display: block;
	}

	.code-group-panel :global(.line) {
		display: inline;
	}

	.code-group-panel :global(.line)::before {
		content: counter(line);
		counter-increment: line;
		display: inline-block;
		width: 2rem;
		margin-right: 1rem;
		text-align: right;
		color: #3f3f46;
		user-select: none;
	}
</style>
