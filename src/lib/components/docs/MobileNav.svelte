<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/config/navigation';
	import type { Heading, NavSection } from '$lib/types/navigation';

	let { isOpen = false, headings = [], onclose }: { isOpen: boolean; headings: Heading[]; onclose: () => void } = $props();

	$effect(() => {
		$page.url.pathname;
		if (isOpen) onclose();
	});

	function renderSection(section: NavSection, depth: number = 0) {
		return { section, depth };
	}
</script>

{#snippet navSection(section: NavSection, depth: number)}
	<div class="mb-3" class:ml-3={depth > 0}>
		<h5 class="mb-1.5 text-sm {depth === 0 ? 'font-semibold text-zinc-300' : 'font-medium text-zinc-400'}">
			{section.title}
		</h5>
		{#if section.items?.length}
			<ul class="space-y-0.5 border-l border-zinc-800 pl-3">
				{#each section.items as item}
					{@const isActive = $page.url.pathname === item.href}
					<li>
						<a
							href={item.href}
							class="block py-1 text-sm {isActive
								? 'text-primary-400 font-medium'
								: 'text-zinc-400 hover:text-white'}"
						>
							{item.title}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
		{#if section.subsections?.length}
			<div class="mt-2 space-y-2">
				{#each section.subsections as subsection}
					{@render navSection(subsection, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		role="button"
		tabindex="0"
	></div>

	<!-- Drawer -->
	<div class="fixed inset-y-0 left-0 z-50 w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto lg:hidden">
		<div class="flex items-center justify-between p-4 border-b border-zinc-800">
			<a href="/" class="text-lg font-bold text-white">Stake Engine</a>
			<button onclick={onclose} class="p-2 text-zinc-400 hover:text-white">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<nav class="p-4">
			<h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Navigation</h4>
			{#each navigation.sections as section}
				{@render navSection(section, 0)}
			{/each}

			{#if headings.length > 0}
				<h4 class="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">On this page</h4>
				<ul class="space-y-0.5 border-l border-zinc-800 pl-3">
					{#each headings as heading}
						<li class={heading.level === 3 ? 'ml-3' : ''}>
							<a href="#{heading.id}" class="block py-1 text-sm text-zinc-400 hover:text-white">
								{heading.text}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</nav>
	</div>
{/if}
