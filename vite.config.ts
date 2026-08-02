import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Bake the version in at build time, in three steps:
//   1. APP_VERSION (Docker build arg from the semantic-release tag)
//   2. git describe (local development inside the repository)
//   3. package.json (last resort; it deliberately holds a placeholder)
function appVersion(): string {
	if (process.env.APP_VERSION) return process.env.APP_VERSION;
	try {
		return execSync('git describe --tags --always --dirty', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		try {
			return JSON.parse(readFileSync('package.json', 'utf8')).version ?? 'unknown';
		} catch {
			return 'unknown';
		}
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	define: {
		__APP_VERSION__: JSON.stringify(appVersion()),
		__BUILD_TIME__: JSON.stringify(new Date().toISOString())
	}

	// The vitest configuration lives in vitest.config.ts, not here: `test` does not belong in
	// Vite's UserConfig, and svelte-check rightly reports it as a type error.
});
