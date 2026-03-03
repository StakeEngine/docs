<script lang="ts">
	import { editor, deleteFile } from '$lib/stores/editor';
	import { goto } from '$app/navigation';

	let { onclose }: { onclose: () => void } = $props();

	let confirmInput = $state('');
	let deleting = $state(false);

	// Extract slug from route path (last segment)
	const slug = $derived($editor.routePath.split('/').filter(Boolean).pop() || '');

	const canDelete = $derived(confirmInput === slug);

	async function handleDelete() {
		if (!canDelete) return;
		deleting = true;

		const section = $editor.section;
		const success = await deleteFile();

		if (success) {
			onclose();
			goto(`/${section}`);
		}

		deleting = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
	onclick={handleBackdropClick}
>
	<div
		class="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-label="Delete page confirmation"
	>
		<h3 class="text-lg font-semibold text-white">Delete Page</h3>
		<p class="mt-2 text-sm text-zinc-400">
			This will permanently delete <span class="font-mono text-red-400">{$editor.routePath}</span>.
		</p>
		<p class="mt-3 text-sm text-zinc-400">
			Type <span class="font-mono font-semibold text-white">{slug}</span> to confirm:
		</p>

		<input
			type="text"
			bind:value={confirmInput}
			class="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
			placeholder={slug}
			autofocus
		/>

		{#if $editor.error}
			<p class="mt-2 text-xs text-red-400">{$editor.error}</p>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={onclose}
				class="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
			>
				Cancel
			</button>
			<button
				onclick={handleDelete}
				disabled={!canDelete || deleting}
				class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{deleting ? 'Deleting...' : 'Delete Page'}
			</button>
		</div>
	</div>
</div>
