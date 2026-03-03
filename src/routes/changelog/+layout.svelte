<script lang="ts">
	import { page } from '$app/stores';
	import ChangelogLayout from '$lib/components/changelog/ChangelogLayout.svelte';

	let { children } = $props();
</script>

<ChangelogLayout
	pageTitle={$page.error ? undefined : $page.data.pageTitle}
	description={$page.error ? undefined : $page.data.description}
>
	{@render children()}
</ChangelogLayout>
