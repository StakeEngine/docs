<script lang="ts">
	import type { ApiParam } from '$lib/types/api';

	let {
		params,
		title
	}: {
		params: ApiParam[];
		title?: string;
	} = $props();
</script>

<div class="not-prose my-4">
	{#if title}
		<h4 class="mb-3 text-sm font-medium text-zinc-200">{title}</h4>
	{/if}
	<div class="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
		{#each params as param}
			<div class="px-4 py-3">
				<div class="flex items-center gap-2">
					<code class="text-sm font-medium text-primary-300">{param.name}</code>
					<span class="text-xs text-zinc-500">{param.type}</span>
					{#if param.required}
						<span
							class="inline-flex items-center rounded-full bg-red-400/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-inset ring-red-400/30"
						>
							required
						</span>
					{:else}
						<span
							class="inline-flex items-center rounded-full bg-zinc-400/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-400/30"
						>
							optional
						</span>
					{/if}
				</div>
				<p class="mt-1 text-sm text-zinc-400">{param.description}</p>
				{#if param.defaultValue}
					<p class="mt-1 text-xs text-zinc-500">
						Default: <code class="text-xs text-zinc-400">{param.defaultValue}</code>
					</p>
				{/if}
				{#if param.example}
					<p class="mt-1 text-xs text-zinc-500">
						Example: <code class="text-xs text-zinc-400">{param.example}</code>
					</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
