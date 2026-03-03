<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		open = false,
		children
	}: {
		title: string;
		open?: boolean;
		children: Snippet;
	} = $props();
</script>

<details class="collapsible my-4 rounded-lg border border-zinc-800" {open}>
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
		{title}
	</summary>
	<div class="collapsible-content border-t border-zinc-800 px-4 py-3 text-sm text-zinc-300 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
		{@render children()}
	</div>
</details>
