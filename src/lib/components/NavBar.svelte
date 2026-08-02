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
		/** The roles the server judges this request by — not the ones held. */
		effectiveRoles: readonly string[];
		grantedRoles: readonly string[];
		narrowed: boolean;
	} = $props();

	const pathname = $derived(page.url.pathname);

	// Cosmetic, not a lock: the same API is reachable directly with a token. What hiding is
	// worth anyway: somebody who sees "Statistik" in the menu and gets a refusal on every click
	// learns to ignore refusals.
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

		<!-- Side by side from lg, below that in the hamburger.
		     Originally md (768px). The seven areas do not fit there: the bar became 883px wide
		     and pushed the body past the viewport — at exactly the width CLAUDE.md promises full
		     usability from. Found by tests/responsive.spec.ts, which has watched the widths
		     since.
		     Tablet-first means fully operable, not everything visible at once: up to 1024px the
		     menu carries the navigation, and it holds the same entries.
		     Together with the xl on the brand subtitle above — lg alone is not enough, because
		     lg applies *from* 1024px and at exactly 1024 the bar would otherwise need 1117px. -->
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
			<!-- Only from lg, so exactly where the area bar appears too. Below that the menu at
			     the bottom carries the identity — it is never missing, it just sits somewhere
			     else. -->
			{#if remoteUser}
				<!-- From lg the identity doubles as the way into the account. A separate entry in
				     the area bar would be wrong: that bar holds the planning process in its
				     order, and tokens are not a step in it. -->
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
				<!-- A badge rather than `text-warning`: daisyUI's semantic colours are background
				     colours. As a text colour on base-100 they reach 1.35:1 to 2.9:1 on the light
				     themes — far below the 4.5:1 of WCAG 1.4.3. As a badge background they are
				     paired with `warning-content`, and that pair is built for contrast. -->
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

					<!-- Below lg this menu carries both. The same entries as the account menu
					     above: a navigation that knows different destinations depending on the
					     width is the kind of difference nobody suspects and everybody hunts. -->
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
