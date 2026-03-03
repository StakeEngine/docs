<script lang="ts">
	import { navigation } from '$lib/config/navigation';
	import SidebarSection from './SidebarSection.svelte';
</script>

<nav class="h-full overflow-y-auto py-6 px-4 custom-scrollbar">
	{#each navigation.sections as section}
		<SidebarSection {section} />
	{/each}
</nav>
