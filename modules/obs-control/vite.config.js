import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5174,
		strictPort: false,
		fs: {
			// Allow serving files from project root
			allow: ['..']
		}
	},
	build: {
		target: 'node18'
	}
});
