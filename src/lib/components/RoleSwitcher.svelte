<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ASSUME_COOKIE, ASSUME_COOKIE_MAX_AGE, serializeAssumedRoles } from '$lib/assumedRoles';
	import { mayPreviewRoles, ROLE_LABELS, sortRoles } from '$lib/roles';

	let {
		grantedRoles,
		effectiveRoles,
		narrowed
	}: {
		grantedRoles: readonly string[];
		effectiveRoles: readonly string[];
		narrowed: boolean;
	} = $props();

	const held = $derived(sortRoles(grantedRoles));
	const active = $derived(new Set(effectiveRoles));

	// Nur eine Auswahl aus den GEHALTENEN Rollen. Das ist keine Zurückhaltung der Oberfläche,
	// sondern die Regel selbst: das Backend schneidet die Auswahl mit den gehaltenen Rollen,
	// eine Rolle anzubieten, die man nicht hat, wäre ein Knopf ohne Wirkung.
	//
	// Wer sehen will, was das Dekanat sieht, gibt sich DEANS_OFFICE — sichtbar, datiert und
	// befristet. Dass das ein Umweg ist, ist Absicht: ADMIN liest bewusst keine
	// unveröffentlichten Wünsche, und eine Vorschau, die das umginge, wäre keine Vorschau.
	async function assume(roles: string[]) {
		document.cookie = `${ASSUME_COOKIE}=${serializeAssumedRoles(roles)}; path=/; max-age=${ASSUME_COOKIE_MAX_AGE}; samesite=lax`;
		await invalidateAll();
	}

	async function reset() {
		// max-age=0 statt eines Sentinel-Werts: „nicht verengt" ist die Abwesenheit des
		// Cookies, und ein Zustand sollte nur eine Darstellung haben.
		document.cookie = `${ASSUME_COOKIE}=; path=/; max-age=0; samesite=lax`;
		await invalidateAll();
	}
</script>

{#if mayPreviewRoles(grantedRoles)}
	<div class="dropdown dropdown-end">
		<div
			tabindex="0"
			role="button"
			class="btn btn-ghost btn-sm gap-1 font-normal"
			title="Ansicht einer einzelnen Rolle ausprobieren"
		>
			<span aria-hidden="true">🎭</span>
			<span class="hidden sm:inline">Rolle</span>
		</div>

		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<ul
			tabindex="0"
			class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-10 mt-2 w-72 border p-2 shadow-lg"
		>
			<li class="menu-title">Ansehen als</li>

			{#each held as role (role)}
				<li>
					<button class:menu-active={narrowed && active.has(role)} onclick={() => assume([role])}>
						{ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
					</button>
				</li>
			{/each}

			<li>
				<button class:menu-active={narrowed && active.size === 0} onclick={() => assume([])}>
					<span class="text-base-content/90">Ohne jede Rolle</span>
				</button>
			</li>

			<li></li>
			<li>
				<!-- Der Rückweg. Steht bewusst hier und nicht in der Verwaltung: eine Verengung, die
				     man nur dort beenden kann, wo die Verengung den Zugang gerade wegnimmt, ist eine
				     Falle. -->
				<button onclick={reset} disabled={!narrowed}>
					<span aria-hidden="true">↩️</span> Zurück zu meinen Rollen
				</button>
			</li>
		</ul>
	</div>
{/if}
