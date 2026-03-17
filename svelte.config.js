import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { createHighlighter } from 'shiki';
import { baseRewrite } from './src/lib/preprocess-base-rewrite.js';

const shiki = await createHighlighter({
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
		'yaml',
		'text'
	]
});

/**
 * @param {string} code
 * @param {string | undefined} lang
 */
function highlighter(code, lang) {
	const resolved = lang && shiki.getLoadedLanguages().includes(lang) ? lang : 'text';
	const html = shiki.codeToHtml(code, { lang: resolved, theme: 'github-dark' });
	return html.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			strict: false
		}),
		paths: {
			base: process.env.BASE_PATH ?? ''
		},
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			handleUnseenRoutes: 'warn'
		}
	},
	preprocess: [
		baseRewrite(),
		mdsvex({
			highlight: {
				highlighter
			},
			rehypePlugins: [
				rehypeSlug,
				[rehypeAutolinkHeadings, { behavior: 'wrap' }]
			]
		})
	],
	extensions: ['.svelte', '.svx']
};

export default config;
