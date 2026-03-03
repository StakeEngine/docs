<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		editor,
		isDirty,
		openEditor,
		openCreateEditor,
		saveFile,
		closeEditor,
		undo,
		redo
	} from '$lib/stores/editor';

	let EditorPanel: typeof import('./EditorPanel.svelte').default | null = $state(null);
	let showOpenInput = $state(false);
	let openPathInput = $state('');
	let openInputEl: HTMLInputElement | undefined = $state();

	onMount(async () => {
		const mod = await import('./EditorPanel.svelte');
		EditorPanel = mod.default;
	});

	function startOpenByPath() {
		openPathInput = '';
		showOpenInput = true;
		setTimeout(() => openInputEl?.focus(), 0);
	}

	function submitOpenByPath() {
		const path = openPathInput.trim();
		if (path) {
			openEditor(path);
		}
		showOpenInput = false;
	}

	function cancelOpenByPath() {
		showOpenInput = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		const meta = e.metaKey || e.ctrlKey;

		// Cmd+E - toggle editor
		if (meta && e.key === 'e') {
			e.preventDefault();
			if ($editor.isOpen) {
				closeEditor();
			} else {
				openEditor($page.url.pathname);
			}
		}

		// Cmd+S - save (when editor is open)
		if (meta && e.key === 's' && $editor.isOpen) {
			e.preventDefault();
			saveFile();
		}

		// Cmd+Z - undo (when editor is open)
		if (meta && e.key === 'z' && !e.shiftKey && $editor.isOpen) {
			e.preventDefault();
			undo();
			return;
		}

		// Cmd+Shift+Z or Cmd+Y - redo (when editor is open)
		if ($editor.isOpen && ((meta && e.key === 'z' && e.shiftKey) || (meta && e.key === 'y'))) {
			e.preventDefault();
			redo();
			return;
		}

		// Escape - close editor
		if (e.key === 'Escape' && $editor.isOpen) {
			e.preventDefault();
			closeEditor();
		}
	}

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if ($isDirty && $editor.isOpen) {
			e.preventDefault();
		}
	}

	function getCurrentSection(): 'docs' | 'faq' {
		return $page.url.pathname.startsWith('/faq') ? 'faq' : 'docs';
	}
</script>

<svelte:window onkeydown={handleKeydown} onbeforeunload={handleBeforeUnload} />

<!-- Floating buttons (bottom-right) -->
<div class="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
	<!-- Open by path input (popup above buttons) -->
	{#if showOpenInput}
		<form
			onsubmit={(e) => { e.preventDefault(); submitOpenByPath(); }}
			class="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl"
		>
			<input
				bind:this={openInputEl}
				bind:value={openPathInput}
				onkeydown={(e) => { if (e.key === 'Escape') cancelOpenByPath(); }}
				class="w-52 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
				placeholder="/docs/api/play"
			/>
			<button
				type="submit"
				class="rounded bg-primary-500/20 px-2 py-1 text-xs font-medium text-primary-400 hover:bg-primary-500/30 transition-colors"
			>
				Open
			</button>
		</form>
	{/if}

	<!-- Open file by path button -->
	<button
		onclick={startOpenByPath}
		class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-lg transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white hover:scale-105"
		title="Open file by path"
		aria-label="Open file by path"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
		</svg>
	</button>

	<!-- New Page button -->
	<button
		onclick={() => openCreateEditor(getCurrentSection())}
		class="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-lg transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white hover:scale-105"
		title="New Page"
		aria-label="Create new page"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
		</svg>
	</button>

	<!-- Edit current page button -->
	<button
		onclick={() => openEditor($page.url.pathname)}
		class="flex h-12 w-12 items-center justify-center rounded-full border border-primary-500/40 bg-primary-500/10 text-primary-400 shadow-lg transition-all hover:bg-primary-500/20 hover:text-primary-300 hover:scale-105"
		title="Edit Page (Cmd+E)"
		aria-label="Edit current page"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
			/>
		</svg>
	</button>
</div>

<!-- Editor Panel (dynamically imported) -->
{#if EditorPanel}
	<EditorPanel />
{/if}
