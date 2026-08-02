<script lang="ts">
	import type { ServerBuildInfo } from '$lib/buildInfo';
	import { releaseUrl } from '$lib/release';

	let { server }: { server: ServerBuildInfo | null } = $props();

	type VersionTag = {
		label: string;
		value: string;
		/** Goes into the title: the commit and the build time are needed exactly once — when the
		 * question after a deploy is whether the new image is really running — and would be
		 * permanent noise in the line otherwise. */
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
		<!-- The app's only external link. `resolve()` is wrong here — it resolves internal
		     routes, and this target is on github.com. The lint rule cannot see that on a dynamic
		     href, so it is switched off for this one spot. The URL is built exclusively in
		     releaseUrl(), from a version checked against a pattern. -->
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
		<!-- No link: the version belongs to no release (a local build, `dev`, or the backend is
		     not answering). See releaseUrl(). -->
		<!-- No `text-error`: as a text colour on base-100 it falls below 4.5:1 on the light
		     themes. The state is carried by the "—" and the title anyway; semibold is enough
		     emphasis and is independent of the chosen theme. -->
		<span title={tag.detail} class:font-semibold={!tag.reachable}>
			{tag.label}
			{tag.value}
		</span>
	{/if}
{/snippet}

<footer class="border-base-300 mt-8 border-t">
	<div
		class="text-base-content/80 mx-auto flex max-w-6xl flex-col gap-1 px-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8"
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
