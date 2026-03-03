interface SvxModule {
	metadata?: {
		title?: string;
		nav_title?: string;
		description?: string;
		badge?: string;
		updated?: string | Date;
		icon?: string;
		order?: number;
	};
}

const modules = import.meta.glob<SvxModule>('./**/+page.svx', { eager: true });

export function load({ url }: { url: URL }) {
	const pathname = url.pathname.replace(/\/$/, '') || '/docs';

	for (const [modulePath, mod] of Object.entries(modules)) {
		// Convert relative glob path to route pathname
		// e.g. "./example/+page.svx" → "/docs/example"
		const route = '/docs' + modulePath.slice(1).replace('/+page.svx', '');
		const normalizedRoute = route === '/docs' ? '/docs' : route.replace(/\/$/, '');

		if (normalizedRoute === pathname) {
			return {
				pageTitle: mod.metadata?.title,
				description: mod.metadata?.description,
				updated: mod.metadata?.updated
			};
		}
	}

	return {};
}
