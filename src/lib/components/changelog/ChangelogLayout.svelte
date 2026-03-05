<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate, replaceState } from '$app/navigation';
	import gsap from 'gsap';
	import type { Snippet } from 'svelte';
	import type { Heading } from '$lib/types/navigation';
	import { extractHeadings } from '$lib/utils/headings';
	import Header from '$lib/components/docs/Header.svelte';
	import Footer from '$lib/components/docs/Footer.svelte';
	import PageTOC from '$lib/components/docs/PageTOC.svelte';
	import ChangelogSidebar from './ChangelogSidebar.svelte';
	import ChangelogMobileNav from './ChangelogMobileNav.svelte';
	import { getChangelogBreadcrumbs } from '$lib/config/changelog';

	let {
		children,
		pageTitle,
		description
	}: {
		children: Snippet;
		pageTitle?: string;
		description?: string;
	} = $props();

	const isEntryPage = $derived($page.url.pathname !== '/changelog');
	const breadcrumbs = $derived(getChangelogBreadcrumbs($page.url.pathname));

	let mobileNavOpen = $state(false);
	let headings = $state<Heading[]>([]);
	let contentEl: HTMLElement | undefined = $state();

	async function updateHeadings() {
		await tick();
		if (contentEl) {
			headings = extractHeadings(contentEl);
		}
	}

	const copySvg = `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
	const checkSvg = `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

	function addCopyButtons() {
		if (!contentEl) return;
		contentEl.querySelectorAll('pre').forEach((pre) => {
			if (pre.querySelector('.code-copy-btn')) return;

			const btn = document.createElement('button');
			btn.className = 'code-copy-btn';
			btn.setAttribute('aria-label', 'Copy code');
			btn.innerHTML = copySvg;

			btn.addEventListener('click', async () => {
				const code = pre.querySelector('code');
				const text = code?.textContent ?? '';
				try {
					await navigator.clipboard.writeText(text);
				} catch {
					const ta = document.createElement('textarea');
					ta.value = text;
					ta.style.cssText = 'position:fixed;opacity:0';
					document.body.appendChild(ta);
					ta.select();
					document.execCommand('copy');
					document.body.removeChild(ta);
				}
				btn.classList.add('copied');
				btn.innerHTML = checkSvg;
				setTimeout(() => {
					btn.classList.remove('copied');
					btn.innerHTML = copySvg;
				}, 2000);
			});

			pre.appendChild(btn);
		});
	}

	function highlightSearchQuery() {
		if (!contentEl) return;
		const q = $page.url.searchParams.get('q');
		if (!q) return;

		const cleanUrl = new URL($page.url);
		cleanUrl.searchParams.delete('q');
		replaceState(cleanUrl.pathname, {});

		const lower = q.toLowerCase();
		const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
		const matches: { node: Text; index: number }[] = [];

		let textNode: Text | null;
		while ((textNode = walker.nextNode() as Text | null)) {
			const idx = textNode.textContent?.toLowerCase().indexOf(lower) ?? -1;
			if (idx !== -1) {
				matches.push({ node: textNode, index: idx });
			}
		}

		if (matches.length === 0) return;

		let firstMark: HTMLElement | null = null;

		for (let i = matches.length - 1; i >= 0; i--) {
			const { node, index } = matches[i];
			const text = node.textContent!;
			const before = text.slice(0, index);
			const matched = text.slice(index, index + q.length);
			const after = text.slice(index + q.length);

			const mark = document.createElement('mark');
			mark.className = 'search-highlight';
			mark.textContent = matched;

			const parent = node.parentNode!;
			if (after) parent.insertBefore(document.createTextNode(after), node.nextSibling);
			parent.insertBefore(mark, node.nextSibling);
			node.textContent = before;

			if (i === 0) firstMark = mark;
		}

		if (firstMark) {
			firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}

		setTimeout(() => {
			contentEl?.querySelectorAll('mark.search-highlight').forEach((el) => {
				el.classList.add('search-highlight-fade');
			});
			setTimeout(() => {
				contentEl?.querySelectorAll('mark.search-highlight').forEach((mark) => {
					const parent = mark.parentNode;
					if (parent) {
						parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
						parent.normalize();
					}
				});
			}, 3500);
		}, 3000);
	}

	function setupInlineCodeCopy() {
		if (!contentEl) return;
		contentEl.querySelectorAll(':not(pre) > code').forEach((code) => {
			if ((code as HTMLElement).dataset.copyReady) return;
			(code as HTMLElement).dataset.copyReady = 'true';

			code.addEventListener('click', async (e) => {
				const el = e.currentTarget as HTMLElement;
				const text = el.textContent ?? '';

				try {
					await navigator.clipboard.writeText(text);
				} catch {
					const ta = document.createElement('textarea');
					ta.value = text;
					ta.style.cssText = 'position:fixed;opacity:0';
					document.body.appendChild(ta);
					ta.select();
					document.execCommand('copy');
					document.body.removeChild(ta);
				}

				gsap.killTweensOf(el);

				gsap.timeline()
					.to(el, { scale: 0.96, duration: 0.08, ease: 'power2.out' })
					.to(el, { scale: 1.03, background: 'rgba(52,211,153,0.18)', duration: 0.16, ease: 'power2.out' })
					.to(el, { scale: 1, background: 'rgba(52,211,153,0)', duration: 0.14, ease: 'power2.out', clearProps: 'transform,background' });
			});
		});
	}

	onMount(() => {
		updateHeadings();
		addCopyButtons();
		setupInlineCodeCopy();
	});

	$effect(() => {
		$page.url.pathname;
		updateHeadings();
		addCopyButtons();
		setupInlineCodeCopy();
	});

	afterNavigate(() => {
		tick().then(() => highlightSearchQuery());
	});
</script>

<svelte:head>
	{#if pageTitle}
		<title>{pageTitle} - Stake Engine Changelog</title>
	{/if}
	{#if description}
		<meta name="description" content={description} />
	{/if}
</svelte:head>

<div class="min-h-screen text-white">
	<Header onMenuClick={() => (mobileNavOpen = true)} />

	<div class="mx-auto max-w-7xl">
		<div class="lg:flex">
			<!-- Left Sidebar -->
			<aside class="hidden lg:block lg:w-56 lg:flex-shrink-0">
				<div class="sticky top-20 h-[calc(100vh-5rem)] border-r border-white/[0.06]">
					<ChangelogSidebar />
				</div>
			</aside>

			<!-- Main Content -->
			<main class="min-w-0 flex-1 px-4 py-8 lg:px-8">
				<!-- Breadcrumbs for entry pages -->
				{#if breadcrumbs.length > 0}
					<nav class="mb-4 flex items-center gap-1.5 text-sm text-zinc-500">
						{#each breadcrumbs as crumb, i}
							{#if i > 0}
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							{/if}
							{#if crumb.href}
								<a href={crumb.href} class="hover:text-zinc-300 transition-colors">{crumb.title}</a>
							{:else}
								<span class="text-zinc-300">{crumb.title}</span>
							{/if}
						{/each}
					</nav>
				{/if}

				<article
					bind:this={contentEl}
					class="prose prose-invert prose-zinc max-w-none
						prose-headings:scroll-mt-20
						prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
						prose-code:text-primary-300 prose-code:before:content-none prose-code:after:content-none
						prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-800"
				>
					{@render children()}
				</article>

				<!-- Back to changelog link on entry pages -->
				{#if isEntryPage}
					<div class="mt-8 border-t border-white/[0.06] pt-6">
						<a
							href="/changelog"
							class="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
							</svg>
							Back to Changelog
						</a>
					</div>
				{/if}
			</main>

			<!-- Right Column: TOC (only on entry pages) -->
			{#if isEntryPage}
				<aside class="hidden xl:block xl:w-48 xl:flex-shrink-0">
					<div class="sticky top-20 border-l border-white/[0.06]">
						<PageTOC {headings} />
					</div>
				</aside>
			{/if}
		</div>
	</div>

	<Footer />

	<ChangelogMobileNav isOpen={mobileNavOpen} onclose={() => (mobileNavOpen = false)} />

	{#if import.meta.env.DEV}
		{#await import('$lib/components/editor/EditorIntegration.svelte') then { default: EditorIntegration }}
			<EditorIntegration />
		{/await}
	{/if}
</div>
