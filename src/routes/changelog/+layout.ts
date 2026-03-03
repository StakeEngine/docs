interface SvxModule {
	metadata?: {
		title?: string;
		description?: string;
		date?: string;
		type?: string;
		version?: string;
	};
}

const modules = import.meta.glob<SvxModule>('./**/+page.svx', { eager: true });

export function load({ url }: { url: URL }) {
	const pathname = url.pathname.replace(/\/$/, '') || '/changelog';

	for (const [modulePath, mod] of Object.entries(modules)) {
		const route = '/changelog' + modulePath.slice(1).replace('/+page.svx', '');
		const normalizedRoute = route === '/changelog' ? '/changelog' : route.replace(/\/$/, '');

		if (normalizedRoute === pathname) {
			return {
				pageTitle: mod.metadata?.title,
				description: mod.metadata?.description
			};
		}
	}

	return {};
}
