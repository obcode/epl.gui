<script lang="ts">
	import type { Snippet } from 'svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import type { LayoutData } from './$types';
	import '../app.css';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<NavBar
		theme={data.theme}
		remoteUser={data.remoteUser}
		remoteDisplayname={data.remoteDisplayname}
	/>

	<!-- Horizontales Padding kommt aus dem Layout. Neue Seiten setzen kein eigenes p-8. -->
	<main class="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 lg:px-8">
		{@render children()}
	</main>

	<Footer server={data.serverBuild} />
</div>
