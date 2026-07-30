<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">Einsatzplanung</h1>

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<h2 class="mb-2 font-medium">Anmeldung</h2>
		{#if data.remoteUser}
			<p>
				Angemeldet als <span class="font-mono">{data.remoteUser}</span>
				{#if data.remoteDisplayname}
					<span class="text-base-content/60">({data.remoteDisplayname})</span>
				{/if}
			</p>
		{:else}
			<p class="text-base-content/60">
				Kein <span class="font-mono">X-Remote-User</span> gesetzt — lokale Entwicklung ohne Auth-Proxy.
			</p>
		{/if}
	</div>

	<div class="border-base-300 bg-base-100 rounded-lg border p-4">
		<h2 class="mb-2 font-medium">Aufbau</h2>
		<p class="text-base-content/70 text-sm">
			Das System entsteht gerade. Als Nächstes: Modulkatalog, Bedarfsplanung und die Tokenverwaltung
			unter <span class="font-mono">/account/tokens</span>.
		</p>
	</div>

	<p class="text-base-content/50 text-xs">Build: {data.buildTime}</p>
</div>
