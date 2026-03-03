<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		type = 'default',
		children
	}: {
		type?: 'new' | 'beta' | 'deprecated' | 'required' | 'optional' | 'default';
		children?: Snippet;
	} = $props();

	const config = {
		new: {
			bg: 'bg-emerald-400/10',
			text: 'text-emerald-400',
			ring: 'ring-emerald-400/30'
		},
		beta: {
			bg: 'bg-yellow-400/10',
			text: 'text-yellow-400',
			ring: 'ring-yellow-400/30'
		},
		deprecated: {
			bg: 'bg-red-400/10',
			text: 'text-red-400',
			ring: 'ring-red-400/30'
		},
		required: {
			bg: 'bg-blue-400/10',
			text: 'text-blue-400',
			ring: 'ring-blue-400/30'
		},
		optional: {
			bg: 'bg-zinc-400/10',
			text: 'text-zinc-400',
			ring: 'ring-zinc-400/30'
		},
		default: {
			bg: 'bg-primary-400/10',
			text: 'text-primary-400',
			ring: 'ring-primary-400/30'
		}
	} as const;

	const c = $derived(config[type]);
	const label = $derived(type.charAt(0).toUpperCase() + type.slice(1));
</script>

<span
	class="not-prose inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ring-1 ring-inset {c.bg} {c.text} {c.ring}"
>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</span>
