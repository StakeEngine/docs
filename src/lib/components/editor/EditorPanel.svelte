<script lang="ts">
	import {
		editor,
		isDirty,
		saveFile,
		closeEditor,
		openEditor,
		updateBody
	} from '$lib/stores/editor';
	import FrontmatterForm from './FrontmatterForm.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import CreatePageForm from './CreatePageForm.svelte';
	import DeleteConfirmModal from './DeleteConfirmModal.svelte';

	let textareaEl: HTMLTextAreaElement | undefined = $state();
	let showDeleteModal = $state(false);
	let createFormRef: CreatePageForm | undefined = $state();
	let editingPath = $state(false);
	let pathInput = $state('');
	let pathInputEl: HTMLInputElement | undefined = $state();

	function startEditingPath() {
		pathInput = $editor.routePath;
		editingPath = true;
		// Focus after DOM update
		setTimeout(() => pathInputEl?.select(), 0);
	}

	function submitPath() {
		const path = pathInput.trim();
		if (path && path !== $editor.routePath) {
			openEditor(path);
		}
		editingPath = false;
	}

	function cancelEditingPath() {
		editingPath = false;
	}

	function formatLastSaved(date: Date | null): string {
		if (!date) return '';
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	async function handleSave() {
		if ($editor.mode === 'create' && createFormRef) {
			if (!createFormRef.isValid()) {
				return;
			}
			const routePath = createFormRef.getRoutePath();
			await saveFile(routePath);
		} else {
			await saveFile();
		}
	}

	function handleTextareaKeydown(e: KeyboardEvent) {
		const meta = e.metaKey || e.ctrlKey;

		if (meta && e.key === 'b') {
			e.preventDefault();
			wrapSelection('**', '**');
		} else if (meta && e.key === 'i') {
			e.preventDefault();
			wrapSelection('*', '*');
		} else if (e.key === 'Tab') {
			e.preventDefault();
			insertAtCursor('  ');
		}
	}

	function wrapSelection(before: string, after: string) {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const text = textareaEl.value;
		const selected = text.slice(start, end);

		const replacement = before + (selected || 'text') + after;
		textareaEl.value = text.slice(0, start) + replacement + text.slice(end);
		updateBody(textareaEl.value);

		if (selected) {
			textareaEl.selectionStart = start;
			textareaEl.selectionEnd = start + replacement.length;
		} else {
			textareaEl.selectionStart = start + before.length;
			textareaEl.selectionEnd = start + before.length + 4;
		}
		textareaEl.focus();
	}

	function insertAtCursor(text: string) {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const val = textareaEl.value;
		textareaEl.value = val.slice(0, start) + text + val.slice(start);
		updateBody(textareaEl.value);
		textareaEl.selectionStart = textareaEl.selectionEnd = start + text.length;
		textareaEl.focus();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed top-16 right-0 bottom-0 z-40 flex w-[480px] flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300"
	class:translate-x-0={$editor.isOpen}
	class:translate-x-full={!$editor.isOpen}
>
	<!-- Header -->
	<div class="border-b border-zinc-800 px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="text-xs font-semibold uppercase tracking-wider text-zinc-500">
				{$editor.mode === 'create' ? 'Create Page' : 'Edit Page'}
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={handleSave}
					disabled={$editor.saving || ($editor.mode === 'edit' && !$isDirty)}
					class="rounded-md bg-primary-500 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{$editor.saving ? 'Saving...' : 'Save'}
				</button>
				<button
					onclick={() => closeEditor()}
					class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
					aria-label="Close editor"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Editable route path -->
		{#if $editor.mode === 'edit'}
			{#if editingPath}
				<form
					onsubmit={(e) => { e.preventDefault(); submitPath(); }}
					class="mt-1.5 flex gap-1"
				>
					<input
						bind:this={pathInputEl}
						bind:value={pathInput}
						onkeydown={(e) => { if (e.key === 'Escape') cancelEditingPath(); }}
						class="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
						placeholder="/docs/api/play"
					/>
					<button
						type="submit"
						class="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
					>
						Open
					</button>
					<button
						type="button"
						onclick={cancelEditingPath}
						class="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
					>
						Cancel
					</button>
				</form>
			{:else}
				<button
					onclick={startEditingPath}
					class="mt-1 flex items-center gap-1.5 group"
					title="Click to open a different file"
				>
					<span class="truncate font-mono text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{$editor.routePath}</span>
					<svg class="h-3 w-3 flex-shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					</svg>
				</button>
			{/if}
		{/if}
	</div>

	<!-- Error -->
	{#if $editor.error}
		<div class="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-400">
			{$editor.error}
		</div>
	{/if}

	<!-- Post-create hint: file saved, keep editing -->
	{#if $editor.mode === 'edit' && $editor.lastSaved && !$isDirty}
		<div class="border-b border-primary-900/30 bg-primary-950/20 px-4 py-2 text-xs text-primary-400 flex items-center justify-between">
			<span>File saved. Keep editing here or navigate to the page.</span>
			<a
				href={$editor.routePath}
				class="underline hover:text-primary-300 transition-colors"
			>
				Go to page
			</a>
		</div>
	{/if}

	<!-- Body (scrollable) -->
	<div class="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar">
		{#if $editor.mode === 'create'}
			<CreatePageForm bind:this={createFormRef} />
		{:else}
			<FrontmatterForm />
		{/if}

		<!-- Markdown editor -->
		<div class="flex min-h-0 flex-1 flex-col">
			<EditorToolbar textarea={textareaEl} />
			<div class="flex-1 px-4 py-2">
				<textarea
					bind:this={textareaEl}
					value={$editor.body}
					oninput={(e) => updateBody(e.currentTarget.value)}
					onkeydown={handleTextareaKeydown}
					class="h-full w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/50 p-3 font-mono text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
					placeholder="Markdown content..."
					spellcheck="false"
					style="min-height: 300px"
				></textarea>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="flex items-center justify-between border-t border-zinc-800 px-4 py-2">
		<div class="flex items-center gap-3">
			{#if $editor.mode === 'edit'}
				<button
					onclick={() => (showDeleteModal = true)}
					class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
				>
					Delete
				</button>
			{/if}
		</div>
		<div class="flex items-center gap-3 text-xs text-zinc-500">
			{#if $isDirty && $editor.mode === 'edit'}
				<span class="flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
					Unsaved
				</span>
			{/if}
			{#if $editor.lastSaved}
				<span>Saved {formatLastSaved($editor.lastSaved)}</span>
			{/if}
		</div>
	</div>
</div>

{#if showDeleteModal}
	<DeleteConfirmModal onclose={() => (showDeleteModal = false)} />
{/if}
