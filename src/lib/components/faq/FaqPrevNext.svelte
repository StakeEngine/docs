<script lang="ts">
	import { faqFlatPages } from '$lib/config/faq-navigation';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';

	let { pathname }: { pathname: string } = $props();

	const currentIndex = $derived(faqFlatPages.findIndex((p) => p.href === pathname));
	const prev = $derived(currentIndex > 0 ? faqFlatPages[currentIndex - 1] : null);
	const next = $derived(currentIndex >= 0 && currentIndex < faqFlatPages.length - 1 ? faqFlatPages[currentIndex + 1] : null);
</script>

{#if prev || next}
	<nav aria-label="Page navigation" class="mt-8 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
		{#if prev}
			<a
				href={prev.href}
				class="group flex items-center gap-3 rounded-lg border border-zinc-800 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
			>
				<ArrowLeft class="h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform group-hover:-translate-x-0.5" />
				<div class="min-w-0">
					<div class="text-xs text-zinc-500">Previous</div>
					<div class="truncate text-sm text-zinc-300">{prev.title}</div>
				</div>
			</a>
		{:else}
			<div></div>
		{/if}
		{#if next}
			<a
				href={next.href}
				class="group flex items-center justify-end gap-3 rounded-lg border border-zinc-800 px-4 py-3 text-right transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
			>
				<div class="min-w-0">
					<div class="text-xs text-zinc-500">Next</div>
					<div class="truncate text-sm text-zinc-300">{next.title}</div>
				</div>
				<ArrowRight class="h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
			</a>
		{:else}
			<div></div>
		{/if}
	</nav>
{/if}
