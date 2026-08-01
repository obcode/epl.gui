<script lang="ts">
	import { page } from '$app/state';

	// Die Fehlerseite *innerhalb* des Rahmens: eine Seite hat nicht geladen, die Anwendung als
	// solche schon. Der andere Fall — jemand ist bei Tallox überhaupt nicht eingetragen —
	// scheitert eine Ebene höher, im Layout selbst, und landet deshalb in src/error.html.
	// SvelteKit rendert für einen Fehler im Root-Layout kein +error.svelte, weil dessen Rahmen
	// genau das ist, was fehlgeschlagen ist.
	const forbidden = $derived(page.status === 403);
</script>

<div class="flex flex-col gap-4">
	<div>
		<h1 class="text-2xl font-semibold">
			{#if forbidden}
				Dafür fehlt die Berechtigung
			{:else}
				Das hat nicht geklappt
			{/if}
		</h1>
		<p class="text-base-content/80 text-sm">Fehler {page.status}</p>
	</div>

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<p class="text-base-content/90">{page.error?.message}</p>

		{#if forbidden}
			<p class="text-base-content/80 mt-3 text-sm">
				Falls Du gerade eine Rolle zur Ansicht ausprobierst: der Streifen oben bringt Dich zu Deinen
				eigenen Rollen zurück.
			</p>
		{/if}
	</div>
</div>
