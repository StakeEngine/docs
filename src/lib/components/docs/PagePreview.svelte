<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	interface PageMeta {
		metadata?: {
			title?: string;
			description?: string;
			badge?: string;
		};
	}

	const pages = import.meta.glob<PageMeta>('/src/routes/docs/**/+page.svx', { eager: true });

	function resolve(href: string): PageMeta['metadata'] | undefined {
		const key = `/src/routes${href}/+page.svx`;
		return pages[key]?.metadata;
	}

	const rawContent = import.meta.glob<string>('/src/routes/docs/**/+page.svx', {
		eager: true,
		query: '?raw',
		import: 'default'
	});

	function getContent(href: string): string {
		const key = `/src/routes${href}/+page.svx`;
		const raw = rawContent[key] ?? '';
		return raw
			.replace(/^---[\s\S]*?---\n*/m, '')
			.replace(/<script[\s\S]*?<\/script>/g, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/```[\s\S]*?```/g, ' ')
			.replace(/`[^`]*`/g, ' ')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/^#{1,6}\s+/gm, '')
			.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
			.replace(/\|[^\n]+/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}

	let {
		href,
		title,
		description,
		badge,
		expanded = false
	}: {
		href: string;
		title?: string;
		description?: string;
		badge?: string;
		expanded?: boolean;
	} = $props();

	const meta = $derived(resolve(href));
	const resolvedTitle = $derived(title ?? meta?.title ?? href);
	const resolvedDescription = $derived(description ?? meta?.description);
	const resolvedBadge = $derived(badge ?? meta?.badge);
	const preview = $derived.by(() => {
		if (!expanded) return null;
		const text = getContent(href);
		if (!text) return null;
		const limit = 200;
		if (text.length <= limit) return text;
		const cut = text.lastIndexOf(' ', limit);
		return text.slice(0, cut > 0 ? cut : limit) + '…';
	});
</script>

<a
	{href}
	class="group not-prose my-4 flex gap-4 rounded-lg border border-zinc-800 px-5 py-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
>
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-zinc-200 group-hover:text-white">{resolvedTitle}</span>
			{#if resolvedBadge}
				<span class="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium leading-tight text-emerald-400 ring-1 ring-inset ring-emerald-400/30">{resolvedBadge}</span>
			{/if}
		</div>
		{#if resolvedDescription}
			<div class="mt-0.5 text-sm text-zinc-500">{resolvedDescription}</div>
		{/if}
		{#if preview}
			<div class="mt-2 border-t border-zinc-800/60 pt-2 text-xs leading-relaxed text-zinc-500">{preview}</div>
		{/if}
	</div>
	<ArrowRight class="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
</a>
