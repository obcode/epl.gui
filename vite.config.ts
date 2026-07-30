import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Version zur Bauzeit einbacken, dreistufig:
//   1. APP_VERSION (Docker-Build-Arg aus dem semantic-release-Tag)
//   2. git describe (lokale Entwicklung im Repo)
//   3. package.json (Notnagel; dort steht bewusst ein Platzhalter)
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

	// Die Vitest-Konfiguration steht in vitest.config.ts, nicht hier: `test` gehört nicht in
	// Vites UserConfig und svelte-check meldet es zu Recht als Typfehler.
});
