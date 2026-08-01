<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import { ACCOUNT_ITEMS, isActive, NAV_ITEMS, visibleNavItems } from '$lib/navigation';
	import RoleSwitcher from './RoleSwitcher.svelte';
	import type { ThemeChoice } from '$lib/themes';

	let {
		theme,
		remoteUser,
		remoteDisplayname,
		effectiveRoles,
		grantedRoles,
		narrowed
	}: {
		theme: ThemeChoice;
		remoteUser: string | null;
		remoteDisplayname: string | null;
		/** Die Rollen, nach denen der Server diesen Request beurteilt — nicht die gehaltenen. */
		effectiveRoles: readonly string[];
		grantedRoles: readonly string[];
		narrowed: boolean;
	} = $props();

	const pathname = $derived(page.url.pathname);

	// Kosmetik, kein Riegel: dieselbe API ist mit einem Token direkt erreichbar. Was das
	// Ausblenden trotzdem wert ist: wer „Statistik" im Menü sieht und bei jedem Klick eine
	// Ablehnung bekommt, lernt, Ablehnungen zu ignorieren.
	const areas = $derived(visibleNavItems(NAV_ITEMS, effectiveRoles));
	const account = $derived(visibleNavItems(ACCOUNT_ITEMS, effectiveRoles));
</script>

<header class="border-base-300 bg-base-100 sticky top-0 z-20 border-b">
	<nav class="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-4 lg:px-8">
		<a
			href={resolve('/')}
			class="flex shrink-0 items-baseline gap-2"
			title="Tallox — Teacher Allocations System"
		>
			<span class="text-xl leading-none" aria-hidden="true">🎓</span>
			<span class="text-lg font-semibold">Tallox</span>
			<span class="text-base-content/80 hidden text-sm xl:inline">Einsatzplanung FK07</span>
		</a>

		<!-- Ab lg nebeneinander, darunter im Hamburger.
		     Ursprünglich md (768px). Dort passen die sieben Bereiche aber nicht: die Leiste
		     wurde 883px breit und schob den Body über den Viewport — ausgerechnet ab der
		     Breite, an der CLAUDE.md volle Benutzbarkeit zusagt. Gefunden von
		     tests/responsive.spec.ts, das die Breiten seither bewacht.
		     Tablet-first heißt vollständig bedienbar, nicht alles gleichzeitig sichtbar: bis
		     1024px trägt das Menü die Navigation, und es enthält dieselben Einträge.
		     Zusammen mit dem xl beim Marken-Untertitel oben — lg allein genügt nicht, weil
		     lg *ab* 1024px greift und die Leiste bei genau 1024 sonst 1117px bräuchte. -->
		<ul class="ml-4 hidden flex-1 items-center gap-1 lg:flex">
			{#each areas as item (item.label)}
				<li>
					{#if item.href}
						<a
							href={resolve(item.href)}
							title={item.hint}
							class="hover:bg-base-200 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
							class:bg-base-200={isActive(item, pathname)}
							class:font-medium={isActive(item, pathname)}
							aria-current={isActive(item, pathname) ? 'page' : undefined}
						>
							<span aria-hidden="true">{item.emoji}</span>{item.label}
						</a>
					{:else}
						<span
							title="{item.hint} — entsteht noch"
							class="text-base-content/80 flex cursor-default items-center gap-1.5 px-2.5 py-1.5 text-sm"
						>
							<span aria-hidden="true">{item.emoji}</span>{item.label}
						</span>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="ml-auto flex items-center gap-1 lg:ml-0">
			<!-- Erst ab lg, also genau dort, wo auch die Bereichsleiste erscheint. Darunter
			     trägt das Menü unten die Identität — sie fehlt also nie ganz, sie steht nur
			     woanders. -->
			{#if remoteUser}
				<!-- Die Identität ist ab lg zugleich der Einstieg ins Konto. Ein eigener
				     Menüpunkt in der Bereichsleiste wäre falsch: dort steht der Planungsprozess
				     in seiner Reihenfolge, und Tokens sind kein Schritt darin. -->
				<div class="dropdown dropdown-end hidden lg:block">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost btn-sm gap-1.5 font-normal"
						title={remoteUser}
					>
						<span aria-hidden="true">👤</span>{remoteDisplayname ?? remoteUser}
					</div>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<ul
						tabindex="0"
						class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-10 mt-2 w-56 border p-2 shadow-lg"
					>
						{#each account as item (item.label)}
							<li>
								<a
									href={resolve(item.href!)}
									title={item.hint}
									class:menu-active={isActive(item, pathname)}
								>
									<span aria-hidden="true">{item.emoji}</span>{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<!-- Badge statt `text-warning`: die semantischen daisyUI-Farben sind
				     Hintergrund­farben. Als Textfarbe auf base-100 erreichen sie auf den hellen
				     Themes 1.35:1 bis 2.9:1 — weit unter den 4.5:1 aus WCAG 1.4.3. Als
				     Badge-Hintergrund werden sie mit `warning-content` gepaart, und dieses
				     Paar ist auf Kontrast ausgelegt. -->
				<span
					class="badge badge-warning badge-sm hidden items-center gap-1 lg:inline-flex"
					title="Kein X-Remote-User — lokale Entwicklung ohne Auth-Proxy"
				>
					<span aria-hidden="true">🔓</span>anonym
				</span>
			{/if}

			<RoleSwitcher {grantedRoles} {effectiveRoles} {narrowed} />

			<ThemeSwitcher current={theme} />

			<div class="dropdown dropdown-end lg:hidden">
				<div tabindex="0" role="button" class="btn btn-ghost btn-sm" aria-label="Bereiche">
					<span aria-hidden="true">☰</span>
				</div>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<ul
					tabindex="0"
					class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-10 mt-2 w-56 border p-2 shadow-lg"
				>
					<li class="menu-title truncate">
						{#if remoteUser}
							<span aria-hidden="true">👤</span>{remoteDisplayname ?? remoteUser}
						{:else}
							<span class="badge badge-warning badge-sm"
								><span aria-hidden="true">🔓</span> anonym</span
							>
						{/if}
					</li>

					{#each areas as item (item.label)}
						<li>
							{#if item.href}
								<a href={resolve(item.href)} class:menu-active={isActive(item, pathname)}>
									<span aria-hidden="true">{item.emoji}</span>{item.label}
								</a>
							{:else}
								<span class="text-base-content/80">
									<span aria-hidden="true">{item.emoji}</span>{item.label}
								</span>
							{/if}
						</li>
					{/each}

					<!-- Unter lg trägt dieses Menü beides. Dieselben Einträge wie im Kontomenü
					     oben: eine Navigation, die je nach Breite andere Ziele kennt, ist die
					     Art von Unterschied, die niemand vermutet und jeder sucht. -->
					<li></li>
					<li class="menu-title">Konto</li>
					{#each account as item (item.label)}
						<li>
							<a href={resolve(item.href!)} class:menu-active={isActive(item, pathname)}>
								<span aria-hidden="true">{item.emoji}</span>{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>
</header>
