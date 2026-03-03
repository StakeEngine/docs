export interface NavItem {
	title: string;
	href: string;
	icon?: string;
	badge?: string;
}

export interface NavSection {
	title: string;
	href?: string;
	icon?: string;
	badge?: string;
	items?: NavItem[];
	subsections?: NavSection[];
}

export interface NavigationConfig {
	sections: NavSection[];
}

export interface Heading {
	id: string;
	text: string;
	level: number;
}

export interface SearchEntry {
	title: string;
	href: string;
	section: string;
	description?: string;
	content: string;
}
