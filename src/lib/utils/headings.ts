import type { Heading } from '$lib/types/navigation';

export function extractHeadings(container: HTMLElement): Heading[] {
	const headings: Heading[] = [];
	container.querySelectorAll('h2, h3').forEach((el) => {
		if (el.id) {
			headings.push({
				id: el.id,
				text: el.textContent?.trim() || '',
				level: parseInt(el.tagName[1], 10)
			});
		}
	});
	return headings;
}
