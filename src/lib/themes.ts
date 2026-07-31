/**
 * Themes und ihre Persistenz.
 *
 * Warum ein Cookie und nicht localStorage (also nicht `theme-change`): die App rendert
 * serverseitig. Bei localStorage kennt der Server das Theme nicht, liefert das Default-Markup
 * aus, und erst nach dem ersten Skript flippt die Seite ins gewählte Theme — ein sichtbares
 * Aufblitzen bei *jedem* Full Load. Ein Cookie liegt dem SSR-Request bei, also steht das
 * richtige `data-theme` schon im ersten Byte.
 *
 * Diese Datei ist bewusst frei von Svelte und Browser-APIs, damit die Auswahllogik in vitest
 * geprüft werden kann.
 */

/** Nicht `theme`: ein generischer Cookie-Name kollidiert auf derselben Domain mit anderem. */
export const THEME_COOKIE = 'tallox_theme';

/** Ein Jahr. Eine Themewahl ist eine Vorliebe, keine Sitzung. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * „System" ist kein daisyUI-Theme, sondern die Abwesenheit einer Wahl: ohne `data-theme` greifen
 * die in app.css mit `--default` und `--prefersdark` markierten Themes, und die Seite folgt
 * damit der Einstellung des Betriebssystems.
 */
export const SYSTEM_THEME = 'system';

/**
 * Kuratierte Auswahl. daisyUI bringt über 30 Themes mit; alle anzubieten ist eine Liste zum
 * Scrollen statt einer Entscheidung.
 *
 * MUSS mit der `themes:`-Liste in app.css übereinstimmen — dort wird das CSS erzeugt, hier
 * nur ausgewählt. Ein Eintrag, den app.css nicht kennt, schaltet sichtbar auf nichts um.
 */
export const THEMES = [
	{ value: 'nord', label: 'Nord', dark: false },
	{ value: 'corporate', label: 'Corporate', dark: false },
	{ value: 'emerald', label: 'Emerald', dark: false },
	{ value: 'winter', label: 'Winter', dark: false },
	{ value: 'lofi', label: 'Lo-Fi', dark: false },
	{ value: 'retro', label: 'Retro', dark: false },
	{ value: 'cyberpunk', label: 'Cyberpunk', dark: false },
	{ value: 'dim', label: 'Dim', dark: true },
	{ value: 'business', label: 'Business', dark: true },
	{ value: 'night', label: 'Night', dark: true },
	{ value: 'dracula', label: 'Dracula', dark: true },
	{ value: 'sunset', label: 'Sunset', dark: true }
] as const;

export type ThemeName = (typeof THEMES)[number]['value'];
export type ThemeChoice = ThemeName | typeof SYSTEM_THEME;

/**
 * Cookie-Wert zu einer gültigen Wahl machen.
 *
 * Der Rückgabewert landet unescaped im `<html>`-Tag. Deshalb ist das hier eine Allowlist und
 * kein Escaping: was nicht in THEMES steht, wird zu `system` — ein Angreifer, der den Cookie
 * setzt, kann damit nichts in das Markup schreiben.
 */
export function resolveTheme(value: string | undefined | null): ThemeChoice {
	if (!value) return SYSTEM_THEME;
	return THEMES.some((t) => t.value === value) ? (value as ThemeName) : SYSTEM_THEME;
}

/**
 * Das Attribut für das `<html>`-Tag — bei `system` bewusst der leere String, denn nur ohne
 * `data-theme` greifen `--default` und `--prefersdark`.
 */
export function themeAttribute(choice: ThemeChoice): string {
	return choice === SYSTEM_THEME ? '' : `data-theme="${choice}"`;
}
