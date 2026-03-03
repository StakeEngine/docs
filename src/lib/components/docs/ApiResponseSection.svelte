<script lang="ts">
	import type { ApiResponse } from '$lib/types/api';
	import { getStatusColor } from '$lib/types/api';
	import { highlight } from '$lib/highlight';

	let {
		responses
	}: {
		responses: ApiResponse[];
	} = $props();

	let highlightedBodies = $state<Record<number, string>>({});

	$effect(() => {
		for (const res of responses) {
			if (res.exampleBody && !highlightedBodies[res.status]) {
				const pretty = formatJson(res.exampleBody);
				highlight(pretty, 'json').then((html) => {
					highlightedBodies[res.status] = html;
					highlightedBodies = highlightedBodies;
				});
			}
		}
	});

	function formatJson(str: string): string {
		try {
			return JSON.stringify(JSON.parse(str), null, 2);
		} catch {
			return str;
		}
	}
</script>

<div class="not-prose my-4 space-y-2">
	{#each responses as res}
		{@const color = getStatusColor(res.status)}
		<details class="rounded-lg border border-zinc-800">
			<summary
				class="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800/50"
			>
				<svg
					class="collapsible-chevron h-4 w-4 flex-shrink-0 text-zinc-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
				<span
					class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset {color.bg} {color.text} {color.ring}"
				>
					{res.status}
				</span>
				<span class="text-zinc-400">{res.statusText}</span>
			</summary>
			<div class="border-t border-zinc-800 px-4 py-3">
				<p class="text-sm text-zinc-400">{res.description}</p>
				{#if res.exampleBody && highlightedBodies[res.status]}
					<div class="mt-3 overflow-x-auto rounded-lg border border-zinc-800 text-sm [&>pre]:!m-0 [&>pre]:!border-0">
						{@html highlightedBodies[res.status]}
					</div>
				{/if}
			</div>
		</details>
	{/each}
</div>
