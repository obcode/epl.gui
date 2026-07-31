import type { ThemeChoice } from '$lib/themes';

declare global {
	namespace App {
		interface Locals {
			/** Verifizierte Mailadresse, vom Auth-Proxy gesetzt. Lokal undefined. */
			remoteUser?: string;
			remoteDisplayname?: string;
			/** Aus dem Cookie aufgelöst, siehe hooks.server.ts. Nie ein ungeprüfter Wert. */
			theme: ThemeChoice;
		}
	}

	/** Zur Bauzeit von vite.config.ts eingesetzt. */
	const __APP_VERSION__: string;
	const __BUILD_TIME__: string;
}

export {};
