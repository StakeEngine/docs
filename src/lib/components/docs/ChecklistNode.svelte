<script lang="ts">
	export interface ChecklistItem {
		id: number;
		parentId: number | null;
		text: string;
		type: 'group' | 'item';
		sortOrder: number;
		children: ChecklistItem[];
	}

	let {
		node,
		checked,
		depth = 0,
		onToggle
	}: {
		node: ChecklistItem;
		checked: Record<number, boolean>;
		depth?: number;
		onToggle: (id: number) => void;
	} = $props();

	let open = $state(true);

	function countItems(n: ChecklistItem): number {
		if (n.type === 'item' && n.children.length === 0) return 1;
		let count = n.type === 'item' ? 1 : 0;
		for (const child of n.children) count += countItems(child);
		return count;
	}

	function countChecked(n: ChecklistItem): number {
		if (n.type === 'item' && n.children.length === 0) return checked[n.id] ? 1 : 0;
		let count = n.type === 'item' && checked[n.id] ? 1 : 0;
		for (const child of n.children) count += countChecked(child);
		return count;
	}

	const total = $derived(countItems(node));
	const done = $derived(countChecked(node));
	const pct = $derived(total > 0 ? Math.round((done / total) * 100) : 0);
</script>

{#if node.type === 'group'}
	<div class="checklist-group" class:checklist-group--nested={depth > 0}>
		<button
			class="checklist-group__header"
			class:checklist-group__header--nested={depth > 0}
			onclick={() => (open = !open)}
		>
			<svg
				class="h-4 w-4 flex-shrink-0 text-zinc-500 transition-transform duration-150"
				class:rotate-90={open}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
			<span class="flex-1 text-left">{node.text}</span>
			<span class="checklist-group__badge" class:checklist-group__badge--done={pct === 100}>
				{done}/{total}
			</span>
			<div class="checklist-group__bar">
				<div
					class="checklist-group__bar-fill"
					class:checklist-group__bar-fill--done={pct === 100}
					style="width: {pct}%"
				></div>
			</div>
		</button>
		{#if open}
			<div class="checklist-group__body">
				{#each node.children as child (child.id)}
					<svelte:self node={child} {checked} depth={depth + 1} {onToggle} />
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div class="checklist-item" class:checklist-item--nested={node.children.length > 0}>
		<button class="checklist-item__label" onclick={() => onToggle(node.id)}>
			<span class="checklist-item__box" class:checklist-item__box--checked={checked[node.id]}>
				{#if checked[node.id]}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 13l4 4L19 7" />
					</svg>
				{/if}
			</span>
			<span class="checklist-item__text" class:checklist-item__text--checked={checked[node.id]}>
				{node.text}
			</span>
		</button>
		{#if node.children.length > 0}
			<div class="checklist-item__children">
				{#each node.children as child (child.id)}
					<svelte:self node={child} {checked} depth={depth + 1} {onToggle} />
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.checklist-group {
		border: 1px solid rgb(39 39 42);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	.checklist-group--nested {
		border: none;
		border-radius: 0;
		border-top: 1px solid rgb(39 39 42);
	}
	.checklist-group__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: rgb(228 228 231);
		background: rgb(24 24 27 / 0.5);
		cursor: pointer;
		border: none;
		text-align: left;
	}
	.checklist-group__header:hover {
		background: rgb(39 39 42 / 0.5);
	}
	.checklist-group__header--nested {
		font-weight: 500;
		font-size: 0.8125rem;
		color: rgb(161 161 170);
		padding: 0.625rem 1rem 0.625rem 1.5rem;
	}
	.checklist-group__badge {
		flex-shrink: 0;
		font-size: 0.6875rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgb(39 39 42);
		color: rgb(161 161 170);
	}
	.checklist-group__badge--done {
		background: rgb(16 185 129 / 0.15);
		color: rgb(52 211 153);
	}
	.checklist-group__bar {
		flex-shrink: 0;
		width: 3rem;
		height: 0.25rem;
		border-radius: 9999px;
		background: rgb(39 39 42);
		overflow: hidden;
	}
	.checklist-group__bar-fill {
		height: 100%;
		border-radius: 9999px;
		background: rgb(234 179 8);
		transition: width 0.2s ease;
	}
	.checklist-group__bar-fill--done {
		background: rgb(52 211 153);
	}
	.checklist-group__body {
		border-top: 1px solid rgb(39 39 42);
	}
	.checklist-item {
		padding: 0;
	}
	.checklist-item__label {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		padding: 0.5rem 1rem;
		cursor: pointer;
		width: 100%;
		border: none;
		background: none;
		text-align: left;
	}
	.checklist-item__label:hover {
		background: rgb(39 39 42 / 0.3);
	}
	.checklist-item__box {
		flex-shrink: 0;
		margin-top: 0.125rem;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 0.25rem;
		border: 1.5px solid rgb(63 63 70);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}
	.checklist-item__box--checked {
		background: rgb(234 179 8);
		border-color: rgb(234 179 8);
	}
	.checklist-item__box svg {
		width: 0.75rem;
		height: 0.75rem;
		color: white;
	}
	.checklist-item__text {
		font-size: 0.8125rem;
		line-height: 1.5;
		color: rgb(212 212 216);
		transition: color 0.15s, opacity 0.15s;
	}
	.checklist-item__text--checked {
		color: rgb(113 113 122);
		text-decoration: line-through;
	}
	.checklist-item__children {
		padding-left: 1.5rem;
		border-top: 1px solid rgb(39 39 42 / 0.5);
	}
</style>
