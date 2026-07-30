<script lang="ts">
	import { resolve } from '$app/paths';
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="border-base-300 bg-base-100 border-b">
		<nav class="mx-auto flex max-w-6xl items-center gap-4 px-3 py-3 sm:px-4 lg:px-8">
			<a href={resolve('/')} class="text-lg font-semibold">EPL</a>
			<span class="text-base-content/60 text-sm">Einsatzplanung FK07</span>
		</nav>
	</header>

	<!-- Horizontales Padding kommt aus dem Layout. Neue Seiten setzen kein eigenes p-8. -->
	<main class="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-4 lg:px-8">
		{@render children()}
	</main>

	<footer class="text-base-content/50 mx-auto w-full max-w-6xl px-3 py-4 text-xs sm:px-4 lg:px-8">
		Version {__APP_VERSION__}
	</footer>
</div>
