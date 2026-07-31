<script lang="ts">
	import type { ServerBuildInfo } from '$lib/buildInfo';
	import { releaseUrl } from '$lib/release';

	let { server }: { server: ServerBuildInfo | null } = $props();

	type VersionTag = {
		label: string;
		value: string;
		/** Steht im title: Commit und Bauzeitpunkt werden genau einmal gebraucht — wenn nach
		 * einem Deploy die Frage im Raum steht, ob wirklich das neue Image läuft — und wären
		 * in der Zeile sonst dauerhaft Rauschen. */
		detail: string;
		url: string | null;
		reachable: boolean;
	};

	const gui: VersionTag = {
		label: 'GUI',
		value: __APP_VERSION__,
		detail: `GUI ${__APP_VERSION__}, gebaut ${__BUILD_TIME__}`,
		url: releaseUrl('gui', __APP_VERSION__),
		reachable: true
	};

	const backend: VersionTag = $derived(
		server
			? {
					label: 'Server',
					value: server.version,
					detail: `Server ${server.version}, Commit ${server.commit}, gebaut ${server.builtAt}`,
					url: releaseUrl('server', server.version),
					reachable: true
				}
			: {
					label: 'Server',
					value: '—',
					detail: 'Server nicht erreichbar',
					url: null,
					reachable: false
				}
	);
</script>

{#snippet versionTag(tag: VersionTag)}
	{#if tag.url}
		<!-- Der einzige externe Link der App. `resolve()` ist hier falsch — es löst interne
		     Routen auf; das Ziel liegt auf github.com. Die Regel kann das an einem dynamischen
		     href nicht sehen, deshalb hier punktuell aus. Gebaut wird die URL ausschließlich in
		     releaseUrl(), aus einer Version, die gegen ein Muster geprüft ist. -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={tag.url}
			target="_blank"
			rel="noreferrer"
			title="{tag.detail} — Release auf GitHub"
			class="hover:text-base-content underline decoration-dotted underline-offset-2 transition-colors"
		>
			{tag.label}
			{tag.value}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<!-- Kein Link: die Version gehört zu keinem Release (lokaler Build, `dev`, oder das
		     Backend antwortet nicht). Siehe releaseUrl(). -->
		<span title={tag.detail} class:text-error={!tag.reachable}>
			{tag.label}
			{tag.value}
		</span>
	{/if}
{/snippet}

<footer class="border-base-300 mt-8 border-t">
	<div
		class="text-base-content/50 mx-auto flex max-w-6xl flex-col gap-1 px-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8"
	>
		<p>
			<span aria-hidden="true">🎓</span>
			<span class="font-medium">Tallox</span> — Teacher Allocations System
		</p>

		<p class="flex items-center gap-2 font-mono">
			{@render versionTag(gui)}
			<span aria-hidden="true">·</span>
			{@render versionTag(backend)}
		</p>
	</div>
</footer>
