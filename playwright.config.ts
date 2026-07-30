import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 60_000,
	fullyParallel: true,
	// /dev/shm ist im DevContainer nur 64 MB — mehr Worker lassen Chromium abstürzen.
	workers: 2,
	retries: 1,
	use: {
		baseURL: 'http://localhost:4173'
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
		reuseExistingServer: true
	}
});
