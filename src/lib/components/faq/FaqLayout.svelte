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
	import FaqSidebar from './FaqSidebar.svelte';
	import PageTOC from '$lib/components/docs/PageTOC.svelte';
	import FaqMobileNav from './FaqMobileNav.svelte';
	import PromptActions from '$lib/components/docs/PromptActions.svelte';
	import FaqBreadcrumb from './FaqBreadcrumb.svelte';
	import FaqPrevNext from './FaqPrevNext.svelte';
	import ApiTesterPanel from '$lib/components/docs/ApiTesterPanel.svelte';
	import { activeEndpoint } from '$lib/stores/apiTester';

	let {
		children,
		hidePromptActions = false,
		pageTitle,
		description,
		updated
	}: {
		children: Snippet;
		hidePromptActions?: boolean;
		pageTitle?: string;
		description?: string;
		updated?: string | Date;
	} = $props();

	function formatDate(value: string | Date): string | null {
		const date = value instanceof Date ? value : new Date(value + 'T00:00:00');
		if (isNaN(date.getTime())) return null;
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	const formattedUpdated = $derived(updated ? formatDate(updated) : null);
	let mobileNavOpen = $state(false);
	let headings = $state<Heading[]>([]);
	let contentEl: HTMLElement | undefined = $state();
	let promptActionsEl: HTMLElement | undefined = $state();

	async function updateHeadings() {
		await tick();
		if (contentEl) {
			headings = extractHeadings(contentEl);
		}
	}

	async function positionPromptActions() {
		await tick();
		if (contentEl && promptActionsEl) {
			const h1 = contentEl.querySelector('h1');
			if (h1 && h1.nextSibling !== promptActionsEl) {
				h1.after(promptActionsEl);
			}
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
			if (code.dataset.copyReady) return;
			code.dataset.copyReady = 'true';

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
					.to(el, {
						scale: 0.96,
						duration: 0.08,
						ease: 'power2.out'
					})
					.to(el, {
						scale: 1.03,
						background: 'rgba(52,211,153,0.18)',
						duration: 0.16,
						ease: 'power2.out'
					})
					.to(el, {
						scale: 1,
						background: 'rgba(52,211,153,0)',
						duration: 0.14,
						ease: 'power2.out',
						clearProps: 'transform,background'
					});
			});
		});
	}

	onMount(() => {
		updateHeadings();
		positionPromptActions();
		addCopyButtons();
		setupInlineCodeCopy();
	});

	$effect(() => {
		$page.url.pathname;
		updateHeadings();
		positionPromptActions();
		addCopyButtons();
		setupInlineCodeCopy();
	});

	afterNavigate(() => {
		tick().then(() => highlightSearchQuery());
	});
</script>

<svelte:head>
	{#if pageTitle}
		<title>{pageTitle} - Stake Engine FAQ</title>
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
					<FaqSidebar />
				</div>
			</aside>

			<!-- Main Content -->
			<main class="min-w-0 flex-1 px-4 py-8 lg:px-8">
				<FaqBreadcrumb pathname={$page.url.pathname} />
				<article
					bind:this={contentEl}
					class="prose prose-invert prose-zinc max-w-none
						prose-headings:scroll-mt-20
						prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
						prose-code:text-primary-300 prose-code:before:content-none prose-code:after:content-none
						prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-800"
				>
					{@render children()}
					{#if !hidePromptActions}
						<div bind:this={promptActionsEl}>
							<PromptActions {contentEl} />
						</div>
					{/if}
				</article>
				{#if formattedUpdated}
					<div class="mt-8 flex items-center gap-1.5 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
						</svg>
						Updated {formattedUpdated}
					</div>
				{/if}
				<FaqPrevNext pathname={$page.url.pathname} />
			</main>

			<!-- Right Column: TOC or API Tester -->
			{#if $activeEndpoint}
				<aside class="hidden xl:block xl:w-[420px] xl:flex-shrink-0">
					<div class="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-l border-white/[0.06]">
						<ApiTesterPanel endpoint={$activeEndpoint} />
					</div>
				</aside>
			{:else}
				<aside class="hidden xl:block xl:w-48 xl:flex-shrink-0">
					<div class="sticky top-20 border-l border-white/[0.06]">
						<PageTOC {headings} />
					</div>
				</aside>
			{/if}
		</div>
	</div>

	<Footer />

	<FaqMobileNav isOpen={mobileNavOpen} {headings} onclose={() => (mobileNavOpen = false)} />

	{#if import.meta.env.DEV}
		{#await import('$lib/components/editor/EditorIntegration.svelte') then { default: EditorIntegration }}
			<EditorIntegration />
		{/await}
	{/if}
</div>
