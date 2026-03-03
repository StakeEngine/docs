<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	let { data }: { data: { label: string; value: number }[] } = $props();

	const maxValue = $derived(Math.max(...data.map((d) => d.value)));
	const totalPaid = $derived(data.reduce((sum, d) => sum + d.value, 0));

	// Round up to a nice ceiling for the Y axis
	const ceiling = $derived(() => {
		const mag = Math.pow(10, Math.floor(Math.log10(maxValue)));
		return Math.ceil(maxValue / mag) * mag;
	});

	const yTicks = $derived(() => {
		const c = ceiling();
		return [0, c * 0.25, c * 0.5, c * 0.75, c];
	});

	function formatUsd(value: number): string {
		if (value >= 1_000_000) {
			const m = value / 1_000_000;
			return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
		}
		if (value >= 1_000) {
			return `$${(value / 1_000).toFixed(0)}K`;
		}
		if (value === 0) return '$0';
		return `$${value.toLocaleString('en-US')}`;
	}

	function barHeight(value: number): number {
		return (value / ceiling()) * 100;
	}

	let chartEl: HTMLElement | undefined = $state();

	onMount(() => {
		if (!chartEl) return;
		gsap.fromTo(
			chartEl.querySelectorAll('.payout-bar-fill'),
			{ scaleY: 0 },
			{
				scaleY: 1,
				duration: 0.6,
				stagger: 0.1,
				delay: 0.3,
				ease: 'power2.out',
				transformOrigin: 'bottom'
			}
		);

		gsap.fromTo(
			chartEl.querySelectorAll('.payout-bar-label'),
			{ autoAlpha: 0, y: 5 },
			{
				autoAlpha: 1,
				y: 0,
				duration: 0.3,
				stagger: 0.1,
				delay: 0.6,
				ease: 'power2.out'
			}
		);
	});
</script>

<div bind:this={chartEl} class="mb-10 rounded-lg border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h2 class="text-sm font-semibold text-white">Publisher Payouts</h2>
			<p class="mt-0.5 text-xs text-zinc-500">Monthly payouts to game publishers (USD)</p>
		</div>
		<div class="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1">
			<span class="text-[10px] text-emerald-400/70">Total paid</span>
			<span class="text-xs font-semibold text-emerald-400">{formatUsd(totalPaid)}</span>
		</div>
	</div>

	<!-- Chart -->
	<div class="relative flex items-end gap-2 sm:gap-3" style="height: 180px;">
		<!-- Y axis labels -->
		<div class="absolute inset-y-0 left-0 flex flex-col justify-between text-right pr-2 pointer-events-none" style="width: 45px;">
			{#each yTicks().reverse() as tick}
				<span class="text-[10px] text-zinc-600 leading-none">{formatUsd(tick)}</span>
			{/each}
		</div>

		<!-- Grid lines -->
		<div class="absolute inset-0 flex flex-col justify-between pointer-events-none" style="left: 50px;">
			{#each yTicks() as _}
				<div class="h-px bg-zinc-800/60"></div>
			{/each}
		</div>

		<!-- Bars -->
		<div class="flex flex-1 items-end gap-2 sm:gap-3" style="padding-left: 50px;">
			{#each data as point, i}
				<div class="flex flex-1 flex-col items-center gap-1.5">
					<!-- Value label -->
					<span class="payout-bar-label text-[10px] sm:text-xs font-semibold text-emerald-400">
						{formatUsd(point.value)}
					</span>

					<!-- Bar -->
					<div class="relative w-full rounded-t-md bg-zinc-800/40" style="height: {180 - 30}px;">
						<div
							class="payout-bar-fill absolute bottom-0 w-full rounded-t-sm bg-primary-400"
							style="height: {barHeight(point.value)}%;"
						></div>
					</div>

					<!-- Month label -->
					<span class="text-[10px] sm:text-xs text-zinc-500 whitespace-nowrap">{point.label}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
