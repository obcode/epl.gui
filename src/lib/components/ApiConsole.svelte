<script lang="ts">
	import { EXAMPLE_QUERY } from '$lib/apiExamples';

	let { endpoint }: { endpoint: string } = $props();

	// Das Token lebt in dieser Komponente und nirgends sonst: kein localStorage, kein Cookie,
	// keine URL. Ein Feld, in das jemand eine Zugangsdatei tippt, darf sie nicht überleben —
	// und ein „merken"-Häkchen wäre der erste Schritt zu einem Token im Browserprofil eines
	// geteilten Rechners.
	let token = $state('');
	let query = $state(EXAMPLE_QUERY);
	let result = $state('');
	let failed = $state(false);
	let running = $state(false);

	async function run() {
		running = true;
		failed = false;
		result = '';

		try {
			// Direkt gegen die Token-Tür, nicht über einen Proxy dieser Anwendung. Das ist der
			// ganze Zweck: die Konsole soll zeigen, was ein Skript sieht — inklusive der
			// `null`-Antworten auf @interactiveOnly-Feldern. Ein Proxy würde mit der
			// Browser-Identität sprechen und damit mehr zeigen, als das Token kann.
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {})
				},
				body: JSON.stringify({ query })
			});

			const text = await response.text();
			try {
				result = JSON.stringify(JSON.parse(text), null, 2);
			} catch {
				// Kein JSON: dann ist die Antwort selbst der Befund — eine HTML-Loginseite etwa
				// heißt, dass der Aufruf in der falschen Tür gelandet ist.
				result = text;
			}
			failed = !response.ok;
		} catch (error) {
			failed = true;
			result =
				`${error}\n\n` +
				'Wenn hier ein Netzwerk- oder CORS-Fehler steht: in der lokalen Entwicklung läuft ' +
				'die GUI auf einem anderen Port als das Backend, und der Browser blockiert den ' +
				'Aufruf. In der Produktion sind beide dieselbe Origin.';
		} finally {
			running = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<label class="flex flex-col gap-1">
		<span class="text-base-content/90 text-sm">Token</span>
		<input
			class="input input-bordered w-full font-mono text-sm"
			type="password"
			bind:value={token}
			placeholder="tallox_…"
			autocomplete="off"
			spellcheck="false"
		/>
		<span class="text-base-content/80 text-xs">
			Bleibt in diesem Tab und wird nicht gespeichert.
		</span>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-base-content/90 text-sm">Abfrage</span>
		<textarea
			class="textarea textarea-bordered h-28 w-full font-mono text-sm"
			bind:value={query}
			spellcheck="false"></textarea>
	</label>

	<div>
		<button class="btn btn-primary btn-sm" onclick={run} disabled={running}>
			{running ? 'Läuft …' : 'Ausführen'}
		</button>
	</div>

	{#if result}
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<span class="text-base-content/90 text-sm">Antwort</span>
				{#if failed}
					<span class="badge badge-error badge-sm">Fehler</span>
				{/if}
			</div>
			<pre class="bg-base-200 max-h-80 overflow-auto rounded-lg p-3 text-xs"><code>{result}</code
				></pre>
		</div>
	{/if}
</div>
