<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import DocsLayout from '$lib/components/docs/DocsLayout.svelte';
	import GameCarousel from '$lib/components/home/GameCarousel.svelte';

	const sections = [
		{
			title: 'Math Framework',
			description: 'Define game rules, simulate outcomes, and optimize win distributions.',
			href: '/docs/math',
			icon: 'calculator'
		},
		{
			title: 'Frontend Framework',
			description: 'PixiJS/Svelte toolkit for visually engaging slot games.',
			href: '/docs/frontend',
			icon: 'palette'
		},
		{
			title: 'RGS Integration',
			description: 'Connect to the Carrot Remote Gaming Server for deployment.',
			href: '/docs/rgs',
			icon: 'plug'
		},
		{
			title: 'Approval Guidelines',
			description: 'Requirements and best practices for Stake approval.',
			href: '/docs/approval',
			icon: 'shield'
		}
	];

	const quickLinks = [
		{ title: 'Quick Start', href: '/docs/getting-started', desc: 'Get up and running' },
		{ title: 'Example Games', href: '/docs/math/example-games', desc: 'Browse implementations' },
		{ title: 'File Structure', href: '/docs/frontend/file-structure', desc: 'Project layout' }
	];

	onMount(() => {
		gsap.fromTo('.dot-pattern',
			{ opacity: 0 },
			{ opacity: 1, duration: 1.2, delay: 0.2, ease: 'power2.out' }
		);

		gsap.fromTo('.hero-block',
			{ y: 20, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }
		);

		gsap.fromTo('.game-carousel-section',
			{ y: 25, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
		);

		gsap.fromTo('.doc-card',
			{ y: 30, autoAlpha: 0, scale: 0.97 },
			{ y: 0, autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
		);

		gsap.fromTo('.quick-link',
			{ y: 20, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08, delay: 0.9, ease: 'power2.out' }
		);

		gsap.fromTo('.info-block',
			{ y: 20, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.5, delay: 1.2, ease: 'power2.out' }
		);
	});
</script>

<svelte:head>
	<title>Stake Engine Documentation</title>
	<meta name="description" content="Comprehensive Stake Engine API documentation and developer guide. Build, simulate, and deploy slot games on Stake.com." />
</svelte:head>

<div class="dot-pattern" aria-hidden="true"></div>

<DocsLayout hidePromptActions>
	<!-- Compact Hero -->
	<div class="hero-block not-prose mb-10">
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
			<span class="text-gradient-brand">
				Stake Engine
			</span>
		</h1>
		<p class="mt-2 text-lg text-zinc-400">Developer Documentation</p>
		<p class="mt-3 max-w-xl text-sm text-zinc-500">
			Build, simulate, and deploy stateless slot games on Stake.com and Stake.us with the Stake Engine platform.
		</p>
		<div class="mt-6 flex items-center gap-3">
			<a
				href="/docs/getting-started"
				class="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-primary-400"
			>
				Get Started
			</a>
			<a
				href="https://github.com/StakeEngine/docs"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold transition hover:border-zinc-500 hover:bg-zinc-800"
			>
				GitHub
			</a>
		</div>
	</div>

	<!-- Game Carousel Section -->
	<div class="game-carousel-section not-prose mb-10">
		<GameCarousel />
	</div>

	<!-- Documentation Section -->
	<h2 id="documentation">Documentation</h2>

	<div class="not-prose mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each sections as section}
			<a
				href={section.href}
				class="home-card doc-card group rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 no-underline"
			>
				<div class="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-primary-400">
					{#if section.icon === 'calculator'}
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm2.498-6h.008v.008H15.75v-.008zm0 2.25h.008v.008H15.75v-.008zM15.75 18v.008h.008V18h-.008zM4.5 9.75h15A1.5 1.5 0 0021 8.25V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v2.25a1.5 1.5 0 001.5 1.5z" />
						</svg>
					{:else if section.icon === 'palette'}
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
						</svg>
					{:else if section.icon === 'plug'}
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
						</svg>
					{:else if section.icon === 'shield'}
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
						</svg>
					{/if}
				</div>
				<h3 class="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">{section.title}</h3>
				<p class="mt-1 text-xs text-zinc-500 leading-relaxed">{section.description}</p>
				<div class="mt-3 flex items-center text-xs text-primary-500">
					<span>Explore</span>
					<svg class="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{/each}
	</div>

	<!-- Quick Links Section -->
	<h2 id="quick-links">Quick Links</h2>

	<div class="not-prose mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
		{#each quickLinks as link}
			<a
				href={link.href}
				class="quick-link group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 no-underline transition hover:border-zinc-700 hover:bg-zinc-900/60"
			>
				<svg class="h-4 w-4 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
				</svg>
				<div>
					<span class="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{link.title}</span>
					<p class="text-xs text-zinc-500">{link.desc}</p>
				</div>
			</a>
		{/each}
	</div>

	<!-- About Section -->
	<h2 id="about">What is Stake Engine?</h2>

	<div class="not-prose info-block mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
			<h3 class="text-sm font-semibold text-primary-400">Math Framework</h3>
			<p class="mt-2 text-sm text-zinc-400 leading-relaxed">
				A Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions.
				Generates all necessary backend files, lookup tables, and simulation results.
			</p>
		</div>
		<div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-5">
			<h3 class="text-sm font-semibold text-primary-400">Frontend Framework</h3>
			<p class="mt-2 text-sm text-zinc-400 leading-relaxed">
				A PixiJS/Svelte-based toolkit for creating visually engaging slot games.
				Integrates seamlessly with the math engine's outputs.
			</p>
		</div>
	</div>
</DocsLayout>
