<script lang="ts">
	import type { Snippet } from 'svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NarrowingBanner from '$lib/components/NarrowingBanner.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import type { LayoutData } from './$types';
	import '../app.css';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Kein Backend, keine Rollen. Das ist nicht dasselbe wie „keine Rechte": die Seite rendert
	// während eines Deploys weiter, sie zeigt dann nur die Bereiche, die niemandem vorbehalten
	// sind, und der Footer sagt warum. Ein Zugangsproblem sieht anders aus — es endet in
	// +error.svelte.
	const effectiveRoles = $derived(data.session?.effectiveRoles ?? []);
	const grantedRoles = $derived(data.session?.grantedRoles ?? []);
	const narrowed = $derived(data.session?.narrowed ?? false);
</script>

<div class="flex min-h-screen flex-col">
	{#if narrowed}
		<NarrowingBanner {effectiveRoles} />
	{/if}

	<NavBar
		theme={data.theme}
		remoteUser={data.remoteUser}
		remoteDisplayname={data.remoteDisplayname}
		{effectiveRoles}
		{grantedRoles}
		{narrowed}
	/>

	<!-- Horizontales Padding kommt aus dem Layout. Neue Seiten setzen kein eigenes p-8. -->
	<main class="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 lg:px-8">
		{@render children()}
	</main>

	<Footer server={data.serverBuild} />
</div>
