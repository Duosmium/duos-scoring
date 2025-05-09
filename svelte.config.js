import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],

	kit: {
		adapter: adapter({
			// split: true
			// edge: true
		}),
		alias: {
			$drizzle: './drizzle'
		},
		version: {
			pollInterval: 15000
		}
	}
};

export default config;
