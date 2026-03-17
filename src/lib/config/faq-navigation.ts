import { base } from '$app/paths';
import type { NavigationConfig, NavSection, NavItem, SearchEntry } from '$lib/types/navigation';

interface SvxModule {
	metadata?: {
		title?: string;
		order?: number;
		icon?: string;
		nav_title?: string;
		description?: string;
		badge?: string;
		updated?: string;
		tags?: string[];
	};
}

// Discover all FAQ pages at build time
const pageModules = import.meta.glob<SvxModule>('/src/routes/faq/**/+page.svx', { eager: true });

// Raw file contents for full-text search
const rawModules = import.meta.glob<string>('/src/routes/faq/**/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

// Fallback title overrides for slugs that don't convert cleanly via slugToTitle
const titleOverrides: Record<string, string> = {};

function slugToTitle(slug: string): string {
	if (titleOverrides[slug]) return titleOverrides[slug];
	return slug
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

interface TreeNode {
	name: string;
	href?: string;
	modulePath?: string;
	children: Map<string, TreeNode>;
}

function buildTree(): TreeNode {
	const root: TreeNode = { name: 'faq', children: new Map() };

	const paths = Object.keys(pageModules)
		.map((p) => ({
			modulePath: p,
			href: base + (p.replace('/src/routes', '').replace('/+page.svx', '') || '/faq')
		}))
		.sort((a, b) => a.href.localeCompare(b.href));

	for (const { modulePath, href } of paths) {
		const segments = href
			.replace('/faq', '')
			.split('/')
			.filter(Boolean);

		let current = root;
		for (const seg of segments) {
			if (!current.children.has(seg)) {
				current.children.set(seg, { name: seg, children: new Map() });
			}
			current = current.children.get(seg)!;
		}
		current.href = href;
		current.modulePath = modulePath;
	}

	return root;
}

function getMetadata(node: TreeNode): SvxModule['metadata'] | undefined {
	if (node.modulePath) {
		return (pageModules[node.modulePath] as SvxModule)?.metadata;
	}
	return undefined;
}

function treeNodeToSection(node: TreeNode): NavSection {
	const items: NavItem[] = [];
	const subsections: NavSection[] = [];
	const meta = getMetadata(node);

	// If node itself has an href, add it as "Overview" item
	if (node.href) {
		items.push({ title: 'Overview', href: node.href });
	}

	// Collect children with their metadata for sorting
	const childEntries: { child: TreeNode; meta?: SvxModule['metadata'] }[] = [];
	for (const [, child] of node.children) {
		childEntries.push({ child, meta: getMetadata(child) });
	}

	// Sort: items with order come first (by order), then items without order (alphabetical)
	childEntries.sort((a, b) => {
		const aOrder = a.meta?.order;
		const bOrder = b.meta?.order;
		if (aOrder != null && bOrder != null) return aOrder - bOrder;
		if (aOrder != null) return -1;
		if (bOrder != null) return 1;
		return a.child.name.localeCompare(b.child.name);
	});

	for (const { child, meta: childMeta } of childEntries) {
		if (child.children.size === 0) {
			// Leaf - just a page
			if (child.href) {
				const title = childMeta?.nav_title ?? childMeta?.title ?? slugToTitle(child.name);
				items.push({
					title,
					href: child.href,
					...(childMeta?.icon ? { icon: childMeta.icon } : {}),
					...(childMeta?.badge ? { badge: childMeta.badge } : {})
				});
			}
		} else {
			// Has children - subsection
			subsections.push(treeNodeToSection(child));
		}
	}

	const title = meta?.nav_title ?? meta?.title ?? slugToTitle(node.name);

	return {
		title,
		...(meta?.icon ? { icon: meta.icon } : {}),
		...(meta?.badge ? { badge: meta.badge } : {}),
		...(node.href ? { href: node.href } : {}),
		...(items.length > 0 ? { items } : {}),
		...(subsections.length > 0 ? { subsections } : {})
	};
}

function buildNavigation(): NavigationConfig {
	const root = buildTree();
	const sections: NavSection[] = [];

	// Collect root children with metadata for sorting
	const rootChildren: { child: TreeNode; meta?: SvxModule['metadata'] }[] = [];
	for (const [, child] of root.children) {
		rootChildren.push({ child, meta: getMetadata(child) });
	}

	// Sort root-level entries by order, then alphabetically
	rootChildren.sort((a, b) => {
		const aOrder = a.meta?.order;
		const bOrder = b.meta?.order;
		if (aOrder != null && bOrder != null) return aOrder - bOrder;
		if (aOrder != null) return -1;
		if (bOrder != null) return 1;
		return a.child.name.localeCompare(b.child.name);
	});

	for (const { child, meta } of rootChildren) {
		if (child.children.size === 0 && child.href) {
			// Leaf page at root level - standalone link section
			sections.push({
				title: meta?.nav_title ?? meta?.title ?? slugToTitle(child.name),
				href: child.href,
				...(meta?.icon ? { icon: meta.icon } : {}),
				...(meta?.badge ? { badge: meta.badge } : {})
			});
		} else {
			sections.push(treeNodeToSection(child));
		}
	}

	return { sections };
}

export const faqNavigation: NavigationConfig = buildNavigation();

function stripMarkdown(raw: string): string {
	return (
		raw
			// Remove frontmatter
			.replace(/^---[\s\S]*?---\n*/m, '')
			// Remove svelte script/style blocks
			.replace(/<script[\s\S]*?<\/script>/g, '')
			.replace(/<style[\s\S]*?<\/style>/g, '')
			// Remove HTML tags
			.replace(/<[^>]+>/g, ' ')
			// Remove code blocks
			.replace(/```[\s\S]*?```/g, ' ')
			// Remove inline code
			.replace(/`[^`]*`/g, ' ')
			// Remove markdown links, keep text
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			// Remove headings markup
			.replace(/^#{1,6}\s+/gm, '')
			// Remove bold/italic
			.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
			// Collapse whitespace
			.replace(/\s+/g, ' ')
			.trim()
	);
}

function buildSearchIndex(): SearchEntry[] {
	const entries: SearchEntry[] = [];

	function walk(node: TreeNode, sectionPath: string[]) {
		const meta = getMetadata(node);
		const title = meta?.nav_title ?? meta?.title ?? slugToTitle(node.name);

		if (node.href && node.modulePath) {
			const raw = rawModules[node.modulePath] ?? '';
			const sectionLabel = sectionPath.length > 0 ? 'FAQ > ' + sectionPath.join(' > ') : 'FAQ';
			entries.push({
				title,
				href: node.href,
				section: sectionLabel,
				content: stripMarkdown(raw),
				...(meta?.description ? { description: meta.description } : {})
			});
		}

		for (const [, child] of node.children) {
			walk(child, node.name === 'faq' ? [] : [...sectionPath, title]);
		}
	}

	walk(buildTree(), []);
	return entries;
}

export const faqSearchIndex: SearchEntry[] = buildSearchIndex();

export interface FlatPage {
	title: string;
	href: string;
}

function buildFlatPages(): FlatPage[] {
	const pages: FlatPage[] = [];

	function walkSection(section: NavSection) {
		if (section.items) {
			for (const item of section.items) {
				pages.push({ title: item.title, href: item.href });
			}
		}
		if (section.subsections) {
			for (const sub of section.subsections) {
				walkSection(sub);
			}
		}
	}

	for (const section of faqNavigation.sections) {
		if (!section.items && !section.subsections && section.href) {
			pages.push({ title: section.title, href: section.href });
		} else {
			walkSection(section);
		}
	}

	return pages;
}

export const faqFlatPages: FlatPage[] = buildFlatPages();

export interface BreadcrumbItem {
	title: string;
	href?: string;
}

export function getFaqBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const crumbs: BreadcrumbItem[] = [{ title: 'FAQ', href: `${base}/faq` }];

	function walk(sections: NavSection[], trail: BreadcrumbItem[]): boolean {
		for (const section of sections) {
			if (section.href === pathname) {
				crumbs.push(...trail, { title: section.title });
				return true;
			}

			if (section.items) {
				for (const item of section.items) {
					if (item.href === pathname) {
						crumbs.push(...trail, { title: section.title, href: section.href }, { title: item.title });
						return true;
					}
				}
			}

			if (section.subsections) {
				const nextTrail = [...trail, { title: section.title, href: section.href }];
				if (walk(section.subsections, nextTrail)) return true;
			}
		}
		return false;
	}

	walk(faqNavigation.sections, []);

	if (crumbs.length <= 1) return [];

	return crumbs;
}
