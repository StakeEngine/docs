<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ApiEndpoint } from '$lib/types/api';
	import { activeEndpoint } from '$lib/stores/apiTester';
	import ApiTesterPanel from './ApiTesterPanel.svelte';

	let {
		endpoint,
		children
	}: {
		endpoint: ApiEndpoint;
		children: Snippet;
	} = $props();

	$effect(() => {
		activeEndpoint.set(endpoint);
		return () => {
			activeEndpoint.set(null);
		};
	});
</script>

{@render children()}

<!-- Mobile/tablet inline tester (hidden on xl+ where the right column is visible) -->
<div id="api-tester" class="mt-8 xl:hidden">
	<div class="rounded-lg border border-zinc-800">
		<ApiTesterPanel {endpoint} />
	</div>
</div>
