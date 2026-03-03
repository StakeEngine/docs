import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import devEditor from './vite-plugin-editor';

export default defineConfig({
	plugins: [devEditor(), tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['@lucide/svelte']
	},
	preview: { allowedHosts: ["atlantic-quite-jpeg-facility.trycloudflare.com"] }
});
