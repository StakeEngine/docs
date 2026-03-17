import { base } from '$app/paths';
import type { SearchEntry } from '$lib/types/navigation';

export type ChangelogType = 'feature' | 'fix' | 'improvement' | 'breaking' | 'payout';

export interface ChangelogEntryMeta {
	title: string;
	date: string | Date;
	type: ChangelogType;
	version?: string;
	description: string;
	payoutValue?: number;
}

function normalizeDate(value: string | Date): string {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	const s = String(value);
	if (s.includes('T')) {
		return s.slice(0, 10);
	}
	return s;
}

export function parseDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export interface ChangelogEntry {
	title: string;
	date: string;
	type: ChangelogType;
	version?: string;
	description: string;
	payoutValue?: number;
	href: string;
	hasContent: boolean;
}

export interface ChangelogGroup {
	label: string;
	yearMonth: string;
	entries: ChangelogEntry[];
}

interface SvxModule {
	metadata?: ChangelogEntryMeta;
}

const pageModules = import.meta.glob<SvxModule>('/src/routes/changelog/**/+page.svx', {
	eager: true
});

const rawModules = import.meta.glob<string>('/src/routes/changelog/**/+page.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
});

function stripFrontmatter(raw: string): string {
	return raw.replace(/^---[\s\S]*?---\n*/m, '').trim();
}

function hasBodyContent(raw: string): boolean {
	const body = stripFrontmatter(raw);
	return body.length > 0;
}

function buildEntries(): ChangelogEntry[] {
	const entries: ChangelogEntry[] = [];

	for (const [modulePath, mod] of Object.entries(pageModules)) {
		const meta = mod.metadata;
		if (!meta?.title || !meta?.date || !meta?.type) continue;

		const href = base + modulePath.replace('/src/routes', '').replace('/+page.svx', '');
		const raw = rawModules[modulePath] ?? '';

		entries.push({
			title: meta.title,
			date: normalizeDate(meta.date),
			type: meta.type,
			version: meta.version,
			description: meta.description ?? '',
			payoutValue: meta.payoutValue,
			href,
			hasContent: hasBodyContent(raw)
		});
	}

	entries.sort((a, b) => b.date.localeCompare(a.date));
	return entries;
}

export const changelogEntries: ChangelogEntry[] = buildEntries();

export function groupByMonth(entries: ChangelogEntry[]): ChangelogGroup[] {
	const groups = new Map<string, ChangelogEntry[]>();

	for (const entry of entries) {
		const date = parseDate(entry.date);
		const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		if (!groups.has(yearMonth)) {
			groups.set(yearMonth, []);
		}
		groups.get(yearMonth)!.push(entry);
	}

	return Array.from(groups.entries()).map(([yearMonth, entries]) => ({
		label: entries[0]
			? parseDate(entries[0].date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long'
				})
			: yearMonth,
		yearMonth,
		entries
	}));
}

function stripMarkdown(raw: string): string {
	return raw
		.replace(/^---[\s\S]*?---\n*/m, '')
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

function buildSearchIndex(): SearchEntry[] {
	const entries: SearchEntry[] = [];

	for (const [modulePath, mod] of Object.entries(pageModules)) {
		const meta = mod.metadata;
		if (!meta?.title || !meta?.date) continue;

		const href = base + modulePath.replace('/src/routes', '').replace('/+page.svx', '');
		const raw = rawModules[modulePath] ?? '';

		entries.push({
			title: meta.title,
			href,
			section: 'Changelog',
			description: meta.description,
			content: stripMarkdown(raw)
		});
	}

	return entries;
}

export const changelogSearchIndex: SearchEntry[] = buildSearchIndex();

export interface BreadcrumbItem {
	title: string;
	href?: string;
}

export function getChangelogBreadcrumbs(pathname: string): BreadcrumbItem[] {
	if (pathname === `${base}/changelog`) return [];

	const crumbs: BreadcrumbItem[] = [{ title: 'Changelog', href: `${base}/changelog` }];
	const entry = changelogEntries.find((e) => e.href === pathname);
	if (entry) {
		crumbs.push({ title: entry.title });
	}
	return crumbs;
}
