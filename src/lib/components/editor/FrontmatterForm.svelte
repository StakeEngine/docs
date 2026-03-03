<script lang="ts">
	import { editor, updateFrontmatter } from '$lib/stores/editor';

	let collapsed = $state(false);
	let tagInput = $state('');

	function addTag(value: string) {
		const tag = value.trim();
		if (!tag) return;
		if (!$editor.frontmatter.tags.includes(tag)) {
			updateFrontmatter('tags', [...$editor.frontmatter.tags, tag]);
		}
		tagInput = '';
	}

	function removeTag(tag: string) {
		updateFrontmatter(
			'tags',
			$editor.frontmatter.tags.filter((t) => t !== tag)
		);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addTag(tagInput);
		}
	}
</script>

<div class="border-b border-zinc-800">
	<button
		class="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-300"
		onclick={() => (collapsed = !collapsed)}
	>
		Frontmatter
		<svg
			class="h-4 w-4 transition-transform {collapsed ? '-rotate-90' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if !collapsed}
		<div class="space-y-3 px-4 pb-4">
			<!-- Title -->
			<label class="block">
				<span class="mb-1 block text-xs text-zinc-500">Title *</span>
				<input
					type="text"
					value={$editor.frontmatter.title}
					oninput={(e) => updateFrontmatter('title', e.currentTarget.value)}
					class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
					placeholder="Page title"
				/>
			</label>

			<!-- Nav Title -->
			<label class="block">
				<span class="mb-1 block text-xs text-zinc-500">Nav Title</span>
				<input
					type="text"
					value={$editor.frontmatter.nav_title}
					oninput={(e) => updateFrontmatter('nav_title', e.currentTarget.value)}
					class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
					placeholder="Sidebar label override"
				/>
			</label>

			<!-- Description -->
			<label class="block">
				<span class="mb-1 block text-xs text-zinc-500">Description</span>
				<textarea
					rows="2"
					value={$editor.frontmatter.description}
					oninput={(e) => updateFrontmatter('description', e.currentTarget.value)}
					class="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
					placeholder="SEO description"
				></textarea>
			</label>

			<div class="grid grid-cols-2 gap-3">
				<!-- Order -->
				<label class="block">
					<span class="mb-1 block text-xs text-zinc-500">Order</span>
					<input
						type="number"
						value={$editor.frontmatter.order ?? ''}
						oninput={(e) => {
							const val = e.currentTarget.value;
							updateFrontmatter('order', val === '' ? null : parseInt(val, 10));
						}}
						class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
						placeholder="Sort position"
					/>
				</label>

				<!-- Icon -->
				<label class="block">
					<span class="mb-1 block text-xs text-zinc-500">Icon</span>
					<input
						type="text"
						value={$editor.frontmatter.icon}
						oninput={(e) => updateFrontmatter('icon', e.currentTarget.value)}
						class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
						placeholder="Lucide icon name"
					/>
				</label>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Badge -->
				<label class="block">
					<span class="mb-1 block text-xs text-zinc-500">Badge</span>
					<input
						type="text"
						value={$editor.frontmatter.badge}
						oninput={(e) => updateFrontmatter('badge', e.currentTarget.value)}
						class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
						placeholder="New, Beta..."
					/>
				</label>

				<!-- Updated -->
				<label class="block">
					<span class="mb-1 block text-xs text-zinc-500">Updated</span>
					<input
						type="date"
						value={$editor.frontmatter.updated}
						oninput={(e) => updateFrontmatter('updated', e.currentTarget.value)}
						class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none [color-scheme:dark]"
					/>
				</label>
			</div>

			<!-- Tags -->
			<div>
				<span class="mb-1 block text-xs text-zinc-500">Tags</span>
				<div class="flex flex-wrap gap-1.5">
					{#each $editor.frontmatter.tags as tag}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
						>
							{tag}
							<button
								onclick={() => removeTag(tag)}
								class="text-zinc-500 hover:text-white"
								aria-label="Remove tag {tag}"
							>
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</span>
					{/each}
				</div>
				<input
					type="text"
					bind:value={tagInput}
					onkeydown={handleTagKeydown}
					class="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-primary-500 focus:outline-none"
					placeholder="Add tag (Enter or comma)"
				/>
			</div>
		</div>
	{/if}
</div>
