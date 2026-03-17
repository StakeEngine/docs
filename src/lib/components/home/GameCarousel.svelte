<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';
	import { gameImageUrl, type GameEntry } from '$lib/types/game';

	type State = 'loading' | 'error' | 'ready';

	let state: State = $state('loading');
	let games: (GameEntry | null)[] = $state([]);
	let trackEl: HTMLDivElement | undefined = $state();
	let viewportEl: HTMLDivElement | undefined = $state();

	let timeline: gsap.core.Timeline | undefined;
	let resizeTimer: ReturnType<typeof setTimeout> | undefined;

	const CARD_DESKTOP = 160;
	const CARD_TABLET = 130;
	const CARD_MOBILE = 100;
	const GAP = 12;
	const PLACEHOLDER_SCALE = 1.3;
	const PLACEHOLDER_MARGIN = 8;

	function getCardWidth(): number {
		if (typeof window === 'undefined') return CARD_DESKTOP;
		if (window.innerWidth < 640) return CARD_MOBILE;
		if (window.innerWidth < 1024) return CARD_TABLET;
		return CARD_DESKTOP;
	}

	function getPlaceholderWidth(): number {
		return Math.round(getCardWidth() * PLACEHOLDER_SCALE);
	}

	// Total layout width of one card slot (including gap)
	function getSlotWidth(isPlaceholder: boolean): number {
		if (isPlaceholder) {
			return getPlaceholderWidth() + PLACEHOLDER_MARGIN * 2 + GAP;
		}
		return getCardWidth() + GAP;
	}

	// Triple-buffered games array for the spin animation
	let tripleGames: (GameEntry | null)[] = $derived(
		games.length > 0 ? [...games, ...games, ...games] : []
	);

	function getSingleSetWidth(): number {
		const cardW = getCardWidth();
		const regularCount = games.length - 1;
		const regularWidth = regularCount * (cardW + GAP);
		const placeholderWidth = getPlaceholderWidth() + PLACEHOLDER_MARGIN * 2 + GAP;
		return regularWidth + placeholderWidth;
	}

	function getCenterCardPos(): number {
		const cardW = getCardWidth();
		const centerIdx = Math.floor(games.length / 2);
		const singleSetWidth = getSingleSetWidth();

		// Position within one set: sum widths of cards before centerIdx, then add half of placeholder
		let pos = 0;
		for (let i = 0; i < centerIdx; i++) {
			pos += games[i] === null
				? getPlaceholderWidth() + PLACEHOLDER_MARGIN * 2 + GAP
				: cardW + GAP;
		}
		// Center of the placeholder card
		pos += PLACEHOLDER_MARGIN + getPlaceholderWidth() / 2;

		// Offset by one full set (we target set B = middle copy)
		return singleSetWidth + pos;
	}

	function buildTimeline() {
		if (!trackEl || !viewportEl || games.length === 0) return;

		timeline?.kill();
		timeline = undefined;

		const viewportWidth = viewportEl.getBoundingClientRect().width;
		const singleSetWidth = getSingleSetWidth();
		const centerCardPos = getCenterCardPos();

		const finalX = -(centerCardPos - viewportWidth / 2);
		const startX = finalX + singleSetWidth;

		// Start one full set to the right of final position
		gsap.set(trackEl, { x: startX });

		const spinDistance = singleSetWidth;

		timeline = gsap.timeline();

		// Phase 1: Accelerate (15% distance)
		timeline.to(trackEl, {
			x: startX - spinDistance * 0.15,
			duration: 0.4,
			ease: 'power2.in'
		});

		// Phase 2: Fast spin (65% distance)
		timeline.to(trackEl, {
			x: startX - spinDistance * 0.8,
			duration: 0.8,
			ease: 'none'
		});

		// Phase 3: Decelerate + bounce (20% distance)
		timeline.to(trackEl, {
			x: finalX,
			duration: 1.2,
			ease: 'back.out(1.4)'
		});
	}

	function updateCardFocus() {
		if (!viewportEl || !trackEl) return;
		const viewportRect = viewportEl.getBoundingClientRect();
		const centerX = viewportRect.left + viewportRect.width / 2;

		const cards = trackEl.querySelectorAll<HTMLElement>('.carousel-card');
		cards.forEach((card) => {
			const cardRect = card.getBoundingClientRect();
			const cardCenterX = cardRect.left + cardRect.width / 2;
			const dist = Math.abs(centerX - cardCenterX);
			const maxDist = viewportRect.width / 2;
			const normalized = Math.min(dist / maxDist, 1);

			const opacity = gsap.utils.interpolate(1, 0.4, normalized);
			const glowIntensity = Math.max(0, 1 - normalized * 3);

			const inner = card.querySelector<HTMLElement>('.card-content');
			if (!inner) return;

			gsap.set(inner, {
				opacity,
				filter: glowIntensity > 0.1
					? `drop-shadow(0 0 ${8 * glowIntensity}px oklch(71% 0.16 242 / ${0.6 * glowIntensity}))`
					: 'none'
			});
		});
	}

	function handleResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			buildTimeline();
		}, 200);
	}

	onMount(async () => {
		try {
			const res = await fetch('/mockgames.json');
			if (!res.ok) throw new Error('Failed to load games');
			const data: GameEntry[] = await res.json();
			if (!data || data.length === 0) throw new Error('No games');

			const loaded = data.slice(0, 20);
			// Insert "Build new" placeholder (null) at the center
			const centerIdx = Math.floor(loaded.length / 2);
			const withPlaceholder: (GameEntry | null)[] = [...loaded];
			withPlaceholder.splice(centerIdx, 0, null);
			games = withPlaceholder;

			state = 'ready';

			// Wait for DOM to render tripled cards
			await new Promise((r) => requestAnimationFrame(r));

			buildTimeline();

			// GSAP ticker for card focus effect
			gsap.ticker.add(updateCardFocus);

			window.addEventListener('resize', handleResize);
		} catch {
			state = 'error';
		}
	});

	let activeHeroContent: HTMLElement | null = null;

	function resetHeroTilt() {
		if (!activeHeroContent) return;
		gsap.to(activeHeroContent, {
			rotateX: 0,
			rotateY: 0,
			duration: 0.6,
			ease: 'power3.out',
			overwrite: 'auto'
		});
		activeHeroContent = null;
	}

	function handleCardPointerMove(e: PointerEvent) {
		const card = (e.target as HTMLElement).closest('[data-hero]') as HTMLElement | null;
		if (!card) {
			resetHeroTilt();
			return;
		}
		const content = card.querySelector('.card-content') as HTMLElement;
		if (!content) return;

		activeHeroContent = content;

		const rect = content.getBoundingClientRect();
		const nx = (e.clientX - rect.left) / rect.width - 0.5;
		const ny = (e.clientY - rect.top) / rect.height - 0.5;

		const tiltX = ny * -4;
		const tiltY = nx * 4;

		gsap.to(content, {
			rotateX: tiltX,
			rotateY: tiltY,
			duration: 0.4,
			ease: 'power3.out',
			overwrite: 'auto'
		});

		const angle = Math.atan2(ny, nx) * (180 / Math.PI);
		const hue = (nx + 0.5) * 360;

		content.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
		content.style.setProperty('--my', `${(ny + 0.5) * 100}%`);
		content.style.setProperty('--angle', `${angle}`);
		content.style.setProperty('--hue', `${hue}`);
	}

	function handleCardPointerLeave() {
		resetHeroTilt();
	}

	onDestroy(() => {
		timeline?.kill();
		gsap.ticker.remove(updateCardFocus);
		clearTimeout(resizeTimer);
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
	});
</script>

{#if state === 'loading'}
	<div class="mb-4">
		<h3 class="text-lg font-semibold text-white">Games built with Stake Engine</h3>
		<p class="mt-1 text-sm text-zinc-500">Spin through real examples and start building your own next hit.</p>
	</div>
	<div class="flex gap-3 overflow-hidden">
		{#each Array(7) as _}
			<div class="h-[160px] w-[160px] flex-shrink-0 animate-pulse rounded-lg bg-zinc-800 sm:h-[130px] sm:w-[130px] max-sm:h-[100px] max-sm:w-[100px]"></div>
		{/each}
	</div>
{:else if state === 'ready'}
	<div class="mb-4">
		<h3 class="text-lg font-semibold text-white">Games built with Stake Engine</h3>
		<p class="mt-1 text-sm text-zinc-500">Spin through real examples and start building your own next hit.</p>
	</div>

	<div class="carousel-viewport overflow-hidden py-4" bind:this={viewportEl}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="carousel-track flex items-center gap-3"
			bind:this={trackEl}
			onpointermove={handleCardPointerMove}
			onpointerleave={handleCardPointerLeave}
		>
			{#each tripleGames as entry, i}
				{#if entry === null}
					<div class="carousel-card flex-shrink-0" style="width: {getPlaceholderWidth()}px; margin: 0 {PLACEHOLDER_MARGIN}px;">
						<div class="card-content">
							<div
								class="card-inner relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800"
								style="width: {getPlaceholderWidth()}px; aspect-ratio: 180 / 236;"
							>
								<span class="text-sm font-medium text-zinc-400">Build new</span>
								<span class="mt-1 text-4xl text-zinc-500">+</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="carousel-card flex-shrink-0" style="width: {getCardWidth()}px;">
						<div class="card-content flex flex-col items-center gap-2">
							<div
								class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60"
								style="width: {getCardWidth()}px;"
							>
								<img
									src={gameImageUrl(entry.game.image)}
									alt={entry.game.name}
									loading="lazy"
									decoding="async"
									class="w-full h-auto block"
								/>
							</div>
							<span class="text-center text-xs text-zinc-400 hidden sm:block overflow-visible whitespace-normal leading-tight" style="width: {getCardWidth()}px;">
								{entry.game.name}
							</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<div class="mt-4">
		<a
			href="{base}/docs/getting-started"
			class="inline-flex items-center gap-1.5 text-sm text-primary-500 transition hover:text-primary-400"
		>
			Build your next slot game
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
			</svg>
		</a>
	</div>
{/if}
