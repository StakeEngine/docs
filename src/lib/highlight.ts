import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-dark'],
			langs: [
				'python',
				'typescript',
				'javascript',
				'svelte',
				'html',
				'css',
				'bash',
				'shell',
				'json',
				'yaml'
			]
		});
	}
	return highlighterPromise;
}

export async function highlight(code: string, lang?: string): Promise<string> {
	const hl = await getHighlighter();
	const resolvedLang = lang && hl.getLoadedLanguages().includes(lang) ? lang : 'text';
	return hl.codeToHtml(code, { lang: resolvedLang, theme: 'github-dark' });
}
