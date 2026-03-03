<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import type { NavSection } from '$lib/types/navigation';
	import {
		BookCheck,
		BookOpen,
		Bot,
		Calculator,
		Code,
		Rocket,
		Settings,
		Shield,
		Layout,
		Server,
		Puzzle,
		PackageCheck,
		FileText,
		Layers,
		Zap
	} from '@lucide/svelte';

	const iconMap: Record<string, typeof BookOpen> = {
		BookCheck, BookOpen, Bot, Calculator, Code, Rocket, Settings, Shield, Layout, Server, Puzzle, PackageCheck, FileText, Layers, Zap
	};

	let { section, depth = 0 }: { section: NavSection; depth?: number } = $props();

	const badgeColors: Record<string, string> = {
		New: 'bg-emerald-500/15 text-emerald-400',
		Beta: 'bg-yellow-500/15 text-yellow-400',
		Deprecated: 'bg-red-500/15 text-red-400'
	};

	function getBadgeClass(badge: string): string {
		return badgeColors[badge] ?? 'bg-zinc-500/15 text-zinc-400';
	}

	// Auto-expand if current page is in this section
	function isInSection(sec: NavSection, pathname: string): boolean {
		if (sec.href && pathname.startsWith(sec.href)) return true;
		if (sec.items?.some(item => pathname === item.href)) return true;
		if (sec.subsections?.some(sub => isInSection(sub, pathname))) return true;
		return false;
	}

	// Leaf section: has href but no children - render as a direct link
	const isLeaf = $derived(
		!!section.href && !section.items?.length && !section.subsections?.length
	);

	let isOpen = $state(isInSection(section, $page.url.pathname));
	let contentEl: HTMLDivElement | undefined = $state();
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		// Set initial state without animation
		if (contentEl && !isOpen) {
			gsap.set(contentEl, { height: 0, opacity: 0 });
		}
	});

	$effect(() => {
		if (isInSection(section, $page.url.pathname)) {
			isOpen = true;
		}
	});

	$effect(() => {
		if (!mounted || !contentEl) return;

		if (isOpen) {
			gsap.to(contentEl, {
				height: 'auto',
				opacity: 1,
				duration: 0.3,
				ease: 'power2.out'
			});
		} else {
			gsap.to(contentEl, {
				height: 0,
				opacity: 0,
				duration: 0.25,
				ease: 'power2.in'
			});
		}
	});

	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="mb-2" class:ml-3={depth > 0}>
	{#if isLeaf}
		<!-- Leaf section: direct link, no toggle -->
		{@const isActive = $page.url.pathname === section.href}
		<a
			href={section.href}
			class="flex items-center gap-1.5 py-1.5 text-sm transition
				{depth === 0 ? 'font-semibold' : 'font-medium'}
				{isActive ? 'text-primary-400' : 'text-zinc-400 hover:text-white'}"
		>
			{#if section.icon && iconMap[section.icon]}
				<svelte:component this={iconMap[section.icon]} size={14} class="flex-shrink-0" />
			{/if}
			{section.title}
			{#if section.badge}
				<span class="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none {getBadgeClass(section.badge)}">{section.badge}</span>
			{/if}
		</a>
	{:else}
		<!-- Expandable section -->
		<button
			onclick={toggle}
			class="flex w-full items-center justify-between py-1.5 text-sm transition
				{depth === 0 ? 'font-semibold text-zinc-200' : 'font-medium text-zinc-400'}
				hover:text-white"
		>
			<span class="flex items-center gap-1.5">
				{#if section.icon && iconMap[section.icon]}
					<svelte:component this={iconMap[section.icon]} size={14} class="text-zinc-500 flex-shrink-0" />
				{/if}
				{section.title}
				{#if section.badge}
					<span class="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none {getBadgeClass(section.badge)}">{section.badge}</span>
				{/if}
			</span>
			{#if section.items?.length || section.subsections?.length}
				<svg
					class="h-3.5 w-3.5 transition-transform duration-200 text-zinc-500 {isOpen ? 'rotate-90' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		</button>

		<div bind:this={contentEl} class="overflow-hidden">
			<!-- Items -->
			{#if section.items?.length}
				<ul class="mt-1 space-y-0.5 border-l border-zinc-800 pl-3">
					{#each section.items as item}
						{@const isActive = $page.url.pathname === item.href}
						<li>
							<a
								href={item.href}
								class="flex items-center gap-1.5 py-1 text-sm transition {isActive
									? 'text-primary-400 font-medium'
									: 'text-zinc-400 hover:text-white'}"
							>
								{#if item.icon && iconMap[item.icon]}
									<svelte:component this={iconMap[item.icon]} size={13} class="text-zinc-500 flex-shrink-0" />
								{/if}
								{item.title}
								{#if item.badge}
									<span class="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none {getBadgeClass(item.badge)}">{item.badge}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<!-- Subsections -->
			{#if section.subsections?.length}
				<div class="mt-2 space-y-1 border-l border-zinc-800 pl-3">
					{#each section.subsections as subsection}
						<svelte:self section={subsection} depth={depth + 1} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
