<script lang="ts">
	import { editor, updateFrontmatter } from '$lib/stores/editor';
	import FrontmatterForm from './FrontmatterForm.svelte';

	let section = $state<'docs' | 'faq'>($editor.section);
	let parentPath = $state('');
	let slug = $state('');
	let directories = $state<string[]>([]);
	let loadingDirs = $state(false);
	let slugError = $state('');

	const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

	const resultPath = $derived(() => {
		if (!parentPath || !slug) return '';
		return `${parentPath}/${slug}`;
	});

	$effect(() => {
		loadDirectories(section);
	});

	$effect(() => {
		editor.update((s) => ({ ...s, section }));
	});

	$effect(() => {
		if (slug && !slugPattern.test(slug)) {
			slugError = 'Use lowercase letters, numbers, and hyphens only';
		} else {
			slugError = '';
		}
	});

	async function loadDirectories(sec: string) {
		loadingDirs = true;
		try {
			const res = await fetch(`/__dev/editor/directories?section=${sec}`);
			if (res.ok) {
				const data = await res.json();
				directories = data.directories;
				if (directories.length > 0 && !parentPath) {
					parentPath = directories[0];
				}
			}
		} catch {
			directories = [`/${sec}`];
		}
		loadingDirs = false;
	}

	export function getRoutePath(): string {
		return resultPath();
	}

	export function isValid(): boolean {
		return !!parentPath && !!slug && slugPattern.test(slug) && !!$editor.frontmatter.title;
	}
</script>

<div class="space-y-4 px-4 py-4 border-b border-zinc-800">
	<h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">New Page</h3>

	<!-- Section -->
	<div>
		<span class="mb-1.5 block text-xs text-zinc-500">Section</span>
		<div class="flex gap-2">
			<button
				class="rounded-md px-3 py-1.5 text-sm transition-colors {section === 'docs'
					? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
					: 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
				onclick={() => {
					section = 'docs';
					parentPath = '';
				}}
			>
				Docs
			</button>
			<button
				class="rounded-md px-3 py-1.5 text-sm transition-colors {section === 'faq'
					? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
					: 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}"
				onclick={() => {
					section = 'faq';
					parentPath = '';
				}}
			>
				FAQ
			</button>
		</div>
	</div>

	<!-- Parent Path -->
	<label class="block">
		<span class="mb-1 block text-xs text-zinc-500">Parent Path</span>
		{#if loadingDirs}
			<div class="text-xs text-zinc-600">Loading...</div>
		{:else}
			<select
				bind:value={parentPath}
				class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
			>
				{#each directories as dir}
					<option value={dir}>{dir}</option>
				{/each}
			</select>
		{/if}
	</label>

	<!-- Slug -->
	<label class="block">
		<span class="mb-1 block text-xs text-zinc-500">Slug</span>
		<input
			type="text"
			bind:value={slug}
			class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
			class:border-red-500={slugError}
			placeholder="my-page-slug"
		/>
		{#if slugError}
			<span class="mt-0.5 block text-xs text-red-400">{slugError}</span>
		{/if}
	</label>

	<!-- Result Path Preview -->
	{#if resultPath()}
		<div class="rounded-md bg-zinc-900/50 px-3 py-2 text-xs">
			<span class="text-zinc-500">Path: </span>
			<span class="font-mono text-primary-400">{resultPath()}</span>
		</div>
	{/if}
</div>

<!-- Frontmatter form for new page metadata -->
<FrontmatterForm />
