<script lang="ts">
	import { page } from '$app/stores';
	import FaqLayout from '$lib/components/faq/FaqLayout.svelte';

	let { children } = $props();
</script>

<FaqLayout
	pageTitle={$page.error ? undefined : $page.data.pageTitle}
	description={$page.error ? undefined : $page.data.description}
	updated={$page.error ? undefined : $page.data.updated}
	hidePromptActions={!!$page.error}
>
	{@render children()}
</FaqLayout>
