<script lang="ts">
	import type { ServerBuildInfo } from '$lib/buildInfo';

	let { server }: { server: ServerBuildInfo | null } = $props();

	// Sichtbar bleiben die zwei Versionen. Commit und Bauzeitpunkt stehen im title: sie werden
	// genau einmal gebraucht — wenn nach einem Deploy die Frage im Raum steht, ob wirklich das
	// neue Image läuft — und wären in der Zeile sonst dauerhaft Rauschen.
	const guiDetail = `GUI ${__APP_VERSION__}, gebaut ${__BUILD_TIME__}`;
	const serverDetail = $derived(
		server
			? `Server ${server.version}, Commit ${server.commit}, gebaut ${server.builtAt}`
			: 'Server nicht erreichbar'
	);
</script>

<footer class="border-base-300 mt-8 border-t">
	<div
		class="text-base-content/50 mx-auto flex max-w-6xl flex-col gap-1 px-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8"
	>
		<p>
			<span aria-hidden="true">🎓</span>
			<span class="font-medium">Tallox</span> — Teacher Allocations System
		</p>

		<p class="flex items-center gap-2 font-mono">
			<span title={guiDetail}>GUI {__APP_VERSION__}</span>
			<span aria-hidden="true">·</span>
			<span title={serverDetail} class:text-error={!server}>
				Server {server?.version ?? '—'}
			</span>
		</p>
	</div>
</footer>
