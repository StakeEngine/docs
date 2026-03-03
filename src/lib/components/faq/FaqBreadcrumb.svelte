<script lang="ts">
	import { getFaqBreadcrumbs, type BreadcrumbItem } from '$lib/config/faq-navigation';
	import { ChevronRight } from '@lucide/svelte';

	let { pathname }: { pathname: string } = $props();

	const crumbs: BreadcrumbItem[] = $derived(getFaqBreadcrumbs(pathname));
</script>

{#if crumbs.length > 0}
	<nav aria-label="Breadcrumb" class="mb-4 flex flex-wrap items-center gap-1 text-xs text-zinc-500">
		{#each crumbs as crumb, i}
			{#if i > 0}
				<ChevronRight class="h-3 w-3 flex-shrink-0" />
			{/if}
			{#if crumb.href && i < crumbs.length - 1}
				<a href={crumb.href} class="transition-colors hover:text-zinc-300">{crumb.title}</a>
			{:else}
				<span class={i === crumbs.length - 1 ? 'text-zinc-400' : ''}>{crumb.title}</span>
			{/if}
		{/each}
	</nav>
{/if}
