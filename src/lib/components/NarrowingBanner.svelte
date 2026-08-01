<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ASSUME_COOKIE } from '$lib/assumedRoles';
	import { roleLabels } from '$lib/roles';

	let { effectiveRoles }: { effectiveRoles: readonly string[] } = $props();

	async function reset() {
		document.cookie = `${ASSUME_COOKIE}=; path=/; max-age=0; samesite=lax`;
		await invalidateAll();
	}
</script>

<!--
	Nicht wegklickbar, und über allem.

	Wer vergisst, dass er verengt ist, meldet irgendwann eine fehlende Funktion als Fehler —
	und im schlimmeren Fall trifft jemand eine Entscheidung auf Basis einer Liste, die absichtlich
	unvollständig ist. Der Streifen kostet 40 Pixel und erspart beides.

	Farbe als Hintergrund, nicht als Textfarbe: `text-warning` auf base-100 liegt auf den hellen
	Themes zwischen 1.35:1 und 3.5:1 und ist damit unter den 4.5:1 aus WCAG 1.4.3. `bg-warning`
	wird von daisyUI mit `warning-content` gepaart, und dieses Paar ist auf Kontrast ausgelegt.
-->
<div
	class="bg-warning text-warning-content sticky top-0 z-30 px-3 py-1.5 text-sm sm:px-4 lg:px-8"
	role="status"
>
	<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
		<span aria-hidden="true">🎭</span>
		<span>
			Vorschau: Du siehst Tallox gerade
			{#if effectiveRoles.length === 0}
				als jemand <strong>ohne jede Rolle</strong>.
			{:else}
				als <strong>{roleLabels(effectiveRoles)}</strong>.
			{/if}
		</span>
		<button class="btn btn-xs ml-auto" onclick={reset}>Zurück zu meinen Rollen</button>
	</div>
</div>
