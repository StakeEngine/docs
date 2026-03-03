<script lang="ts">
	import { faqNavigation } from '$lib/config/faq-navigation';
	import SidebarSection from '$lib/components/docs/SidebarSection.svelte';
</script>

<nav class="h-full overflow-y-auto py-6 px-4 custom-scrollbar">
	{#each faqNavigation.sections as section}
		<SidebarSection {section} />
	{/each}
</nav>
