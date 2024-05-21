import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: false
			// sourceMapsUploadOptions: {
			// 	org: 'sciolyid',
			// 	project: 'duos-scoring',
			// 	authToken: process.env.PRIVATE_SENTRY_AUTH_TOKEN,
			// 	telemetry: false
			// }
		}),
		sveltekit()
	],
	build: {
		target: 'es2022'
	},
	esbuild: {
		target: 'es2022'
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2022'
		}
	}
});
