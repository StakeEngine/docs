<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Heading } from '$lib/types/navigation';
	import PromptActions from './PromptActions.svelte';

	let {
		headings = [],
		contentEl = undefined,
		hidePromptActions = false
	}: {
		headings: Heading[];
		contentEl?: HTMLElement;
		hidePromptActions?: boolean;
	} = $props();
	let activeId = $state('');
	let observer: IntersectionObserver | null = null;

	function setupObserver() {
		if (observer) observer.disconnect();

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				});
			},
			{ rootMargin: '-80px 0px -80% 0px' }
		);

		// Only observe h2 headings
		headings.filter(h => h.level === 2).forEach((heading) => {
			const el = document.getElementById(heading.id);
			if (el) observer?.observe(el);
		});
	}

	onMount(() => {
		setupObserver();
	});

	onDestroy(() => {
		observer?.disconnect();
	});

	$effect(() => {
		const len = headings.length;
		if (len > 0) {
			setupObserver();
		}
	});
</script>

<nav class="py-4 px-3 text-[13px]">
	{#if headings.length > 0}
		<h4 class="mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">On this page</h4>
		<ul class="space-y-1">
			{#each headings.filter(h => h.level === 2) as heading}
				{@const isActive = activeId === heading.id}
				<li>
					<a
						href="#{heading.id}"
						class="block py-0.5 leading-snug transition {isActive
							? 'text-primary-400 font-medium'
							: 'text-zinc-500 hover:text-zinc-300'}"
					>
						{heading.text}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if !hidePromptActions && contentEl}
		<div class="mt-4 {headings.length > 0 ? 'pt-4 border-t border-white/[0.06]' : ''}">
			<PromptActions {contentEl} />
		</div>
	{/if}
</nav>
