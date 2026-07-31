<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import { isActive, NAV_ITEMS } from '$lib/navigation';
	import type { ThemeChoice } from '$lib/themes';

	let {
		theme,
		remoteUser,
		remoteDisplayname
	}: {
		theme: ThemeChoice;
		remoteUser: string | null;
		remoteDisplayname: string | null;
	} = $props();

	const pathname = $derived(page.url.pathname);
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
			<span class="text-base-content/60 hidden text-sm lg:inline">Einsatzplanung FK07</span>
		</a>

		<!-- Ab md nebeneinander, darunter im Hamburger. Tablet-first: 768px ist die Grenze,
		     ab der die Bereichsleiste vollständig lesbar bleibt. -->
		<ul class="ml-4 hidden flex-1 items-center gap-1 md:flex">
			{#each NAV_ITEMS as item (item.label)}
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
							class="text-base-content/35 flex cursor-default items-center gap-1.5 px-2.5 py-1.5 text-sm"
						>
							<span aria-hidden="true">{item.emoji}</span>{item.label}
						</span>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="ml-auto flex items-center gap-1 md:ml-0">
			<!-- Erst ab lg: bei genau 768px stehen sieben Bereiche, Marke und Themewahl schon
			     nebeneinander, und die Identität drängt die Leiste über die Breite. Darunter
			     trägt sie das Menü unten. -->
			{#if remoteUser}
				<span
					class="text-base-content/70 hidden items-center gap-1.5 text-sm lg:flex"
					title={remoteUser}
				>
					<span aria-hidden="true">👤</span>{remoteDisplayname ?? remoteUser}
				</span>
			{:else}
				<span
					class="text-warning hidden items-center gap-1.5 text-sm lg:flex"
					title="Kein X-Remote-User — lokale Entwicklung ohne Auth-Proxy"
				>
					<span aria-hidden="true">🔓</span>anonym
				</span>
			{/if}

			<ThemeSwitcher current={theme} />

			<div class="dropdown dropdown-end md:hidden">
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
							<span class="text-warning"><span aria-hidden="true">🔓</span> anonym</span>
						{/if}
					</li>

					{#each NAV_ITEMS as item (item.label)}
						<li>
							{#if item.href}
								<a href={resolve(item.href)} class:menu-active={isActive(item, pathname)}>
									<span aria-hidden="true">{item.emoji}</span>{item.label}
								</a>
							{:else}
								<span class="text-base-content/35">
									<span aria-hidden="true">{item.emoji}</span>{item.label}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>
</header>
