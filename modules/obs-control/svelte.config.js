import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static for pre-built static files served via context.web
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),

		// Use relative paths for assets so it works regardless of base URL
		paths: {
			base: '',
			relative: true
		},

		// Routes directory
		files: {
			routes: 'routes'
		},

		// App configuration
		alias: {
			$lib: 'routes/lib'
		},

		// Prerendering configuration for static export
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		}
	}
};

export default config;
