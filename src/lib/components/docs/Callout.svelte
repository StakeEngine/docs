<script lang="ts">
	import { Info, TriangleAlert, OctagonX, Lightbulb } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		type = 'info',
		children
	}: {
		type?: 'info' | 'warning' | 'danger' | 'tip';
		children: Snippet;
	} = $props();

	const config = {
		info: {
			icon: Info,
			border: 'border-l-blue-500',
			bg: 'bg-blue-500/10',
			iconColor: 'text-blue-400',
			label: 'Info'
		},
		warning: {
			icon: TriangleAlert,
			border: 'border-l-amber-500',
			bg: 'bg-amber-500/10',
			iconColor: 'text-amber-400',
			label: 'Warning'
		},
		danger: {
			icon: OctagonX,
			border: 'border-l-red-500',
			bg: 'bg-red-500/10',
			iconColor: 'text-red-400',
			label: 'Danger'
		},
		tip: {
			icon: Lightbulb,
			border: 'border-l-primary-400',
			bg: 'bg-primary-400/10',
			iconColor: 'text-primary-400',
			label: 'Tip'
		}
	} as const;

	const c = $derived(config[type]);
</script>

<div class="my-4 rounded-r-lg border-l-4 {c.border} {c.bg} px-4 py-3">
	<div class="flex items-start gap-3">
		<c.icon class="mt-0.5 h-5 w-5 flex-shrink-0 {c.iconColor}" />
		<div class="text-sm text-zinc-300 [&>*]:my-0">
			{@render children()}
		</div>
	</div>
</div>
