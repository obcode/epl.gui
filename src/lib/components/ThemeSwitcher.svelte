<script lang="ts">
	import {
		SYSTEM_THEME,
		THEME_COOKIE,
		THEME_COOKIE_MAX_AGE,
		THEMES,
		type ThemeChoice
	} from '$lib/themes';

	let { current }: { current: ThemeChoice } = $props();

	// Zwei Quellen, bewusst getrennt: `current` kommt aus dem Cookie und ist beim SSR schon
	// richtig, `chosen` entsteht erst durch einen Klick. Ein $state, das mit `current`
	// initialisiert wird, würde den Prop-Wert nur einmal einfangen und danach nicht mehr folgen.
	let chosen = $state<ThemeChoice | null>(null);
	const selected = $derived(chosen ?? current);

	// Kein Reload und kein invalidate(): das Theme steckt in einem CSS-Attribut, ein Roundtrip
	// zum Server wäre für einen Attributwechsel unverhältnismäßig. Der Cookie sorgt nur dafür,
	// dass der NÄCHSTE SSR-Request schon richtig rendert.
	function choose(theme: ThemeChoice) {
		chosen = theme;

		if (theme === SYSTEM_THEME) {
			delete document.documentElement.dataset.theme;
		} else {
			document.documentElement.dataset.theme = theme;
		}

		// SameSite=Lax, kein Secure: der Wert ist eine Vorliebe, kein Geheimnis, und in der
		// lokalen Entwicklung läuft die App über http.
		document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
	}

	const light = THEMES.filter((t) => !t.dark);
	const dark = THEMES.filter((t) => t.dark);
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1" title="Darstellung wählen">
		<span aria-hidden="true">🎨</span>
		<span class="hidden sm:inline">Design</span>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul
		tabindex="0"
		class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-10 mt-2 max-h-[70vh] w-52 flex-nowrap overflow-y-auto border p-2 shadow-lg"
	>
		<li>
			<button class:menu-active={selected === SYSTEM_THEME} onclick={() => choose(SYSTEM_THEME)}>
				<span aria-hidden="true">🖥️</span> System
			</button>
		</li>

		<li class="menu-title">Hell</li>
		{#each light as theme (theme.value)}
			<li>
				<button class:menu-active={selected === theme.value} onclick={() => choose(theme.value)}>
					{theme.label}
				</button>
			</li>
		{/each}

		<li class="menu-title">Dunkel</li>
		{#each dark as theme (theme.value)}
			<li>
				<button class:menu-active={selected === theme.value} onclick={() => choose(theme.value)}>
					{theme.label}
				</button>
			</li>
		{/each}
	</ul>
</div>
