import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
	testDir: 'tests',
	timeout: 60_000,
	fullyParallel: true,
	// /dev/shm ist im DevContainer nur 64 MB — mehr Worker lassen Chromium abstürzen. Auf einem
	// CI-Runner ist das kein Thema, dort begrenzt nur die Anzahl der Kerne.
	workers: CI ? 4 : 2,
	retries: CI ? 2 : 1,

	// Ein `test.only`, das versehentlich mitcommittet wird, macht die E2E-Stufe grün, obwohl
	// sie fast nichts mehr ausführt — und niemand sieht es, weil ein grüner Haken wie ein
	// grüner Haken aussieht.
	forbidOnly: CI,

	reporter: CI
		? [
				// Annotationen direkt am Diff im Pull Request.
				['github'],
				['html', { open: 'never' }],
				['list']
			]
		: [['list']],

	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
		// Nur beim Wiederholungslauf: ein Trace pro Test wäre bei jedem grünen Lauf ein paar
		// hundert Megabyte Artefakte, die niemand ansieht. Beim Fehlschlag ist er das
		// Einzige, womit man einen CI-Fehler ohne Reproduktion versteht.
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: CI ? 'retain-on-failure' : 'off'
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: { args: ['--disable-dev-shm-usage'] }
			}
		}
	],

	webServer: {
		// npm statt pnpm mit Absicht: der Unterprozess erbt sonst die Corepack-Versionsprüfung
		// und stirbt an einem pnpm-Minor-Versatz.
		command: 'npm run build && npm run preview',
		port: 4173,
		timeout: 180_000,
		// Lokal den laufenden Server weiterbenutzen; in CI niemals — dort wäre ein
		// weiterlaufender Server aus einem früheren Job ein Test gegen alten Code.
		reuseExistingServer: !CI,
		env: {
			// Der SSR-Prozess braucht die Backend-URL. Ohne sie fällt backend.ts auf
			// localhost:8080 zurück, was lokal stimmt und in CI vom Wert überschrieben wird.
			TALLOX_SERVER: process.env.TALLOX_SERVER ?? 'http://localhost:8080/query'
		}
	}
});
