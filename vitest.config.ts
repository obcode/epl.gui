import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Bewusst eng auf src/: sonst zieht `pnpm test` die Playwright-Specs aus tests/ mit
		// hinein und scheitert daran, dass sie einen Browser erwarten.
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['src/lib/**'],
			exclude: ['src/lib/gql/__generated__/**', '**/*.test.ts']
		}
	},
	define: {
		__APP_VERSION__: JSON.stringify('test'),
		__BUILD_TIME__: JSON.stringify('test')
	}
});
