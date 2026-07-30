import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Endschalter: das gesamte eigene Projekt läuft im Runes-Modus. Legacy-Syntax
	// (`export let`, `$:`, `on:click`, `createEventDispatcher`, `<slot>`) ist ab hier ein
	// Compile-Fehler, keine Stilfrage.
	compilerOptions: { runes: true },

	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	},

	vitePlugin: {
		// Fremdbibliotheken, die ihre .svelte-Quellen ausliefern, nutzen teils noch
		// Legacy-Syntax. Der globale runes:true-Zwang würde sie brechen — deshalb
		// node_modules explizit im (auto-erkannten) Legacy-Modus kompilieren.
		// Dieser Notausgang ist für Abhängigkeiten, niemals für src/.
		dynamicCompileOptions({ filename }) {
			if (filename.includes('node_modules')) return { runes: false };
		}
	}
};

export default config;
