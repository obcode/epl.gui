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
			exclude: [
				'src/lib/gql/__generated__/**',
				'**/*.test.ts',
				// Komponenten prüft Playwright im echten Browser, nicht vitest. Sie hier
				// mitzumessen würde die Zahl dauerhaft auf ein Drittel drücken und damit jede
				// Schwelle unbrauchbar machen — die Konvention ist ohnehin, Logik aus .svelte
				// in ein lib-Modul zu ziehen und dieses zu testen.
				'src/lib/components/**'
			],
			reporter: ['text', 'html', 'lcov'],
			// Eine Ratsche, keine Zielvorgabe: die Werte liegen knapp unter dem aktuellen
			// Stand. Sie sollen nicht beweisen, dass genug getestet ist, sondern verhindern,
			// dass ein größerer ungetesteter Block unbemerkt dazukommt. Wer sie hebt, hebt sie
			// im selben Commit wie die Tests.
			thresholds: {
				statements: 80,
				branches: 75,
				functions: 70,
				lines: 80
			}
		}
	},
	define: {
		__APP_VERSION__: JSON.stringify('test'),
		__BUILD_TIME__: JSON.stringify('test')
	}
});
