<script lang="ts">
	import { page } from '$app/stores';
	import DocsLayout from '$lib/components/docs/DocsLayout.svelte';

	let { children } = $props();
</script>

<DocsLayout
	pageTitle={$page.error ? undefined : $page.data.pageTitle}
	description={$page.error ? undefined : $page.data.description}
	updated={$page.error ? undefined : $page.data.updated}
	hidePromptActions={!!$page.error}
>
	{@render children()}
</DocsLayout>
