/**
 * Die Rollenverengung — „einmal anschauen, was eine Dozentin sieht".
 *
 * Der gewählte Satz steht in einem Cookie und wird von `hooks.server.ts` als
 * `X-Tallox-Assume-Roles` ans Backend weitergereicht. Dass das gefahrlos geht, ist keine
 * Eigenschaft dieser Datei, sondern von `policy.Narrow` dort: die Auswahl wird mit den
 * tatsächlich gehaltenen Rollen geschnitten, und ein Schnitt kann nichts hinzufügen. Ein
 * handgeschriebener Cookie nimmt seinem Absender also Rechte weg und sonst nichts.
 *
 * Frei von Svelte und Browser-APIs, damit die Logik in vitest prüfbar ist — wie themes.ts.
 */

/** Eigener Präfix, wie beim Theme: ein generischer Name kollidiert auf derselben Domain. */
export const ASSUME_COOKIE = 'tallox_assume';

/**
 * Eine Sitzung, keine Vorliebe.
 *
 * Acht Stunden, nicht ein Jahr: eine Verengung ist etwas, das man für einen Moment einschaltet
 * und dann vergisst. Sie soll spätestens am nächsten Morgen von selbst weg sein, damit
 * niemand nach zwei Wochen meldet, dass die Verwaltung verschwunden ist.
 */
export const ASSUME_COOKIE_MAX_AGE = 60 * 60 * 8;

/**
 * Der Wert für „gar keine Rolle".
 *
 * Ein leerer Cookie-Wert ist nicht zuverlässig von einem fehlenden zu unterscheiden, und die
 * beiden bedeuten Verschiedenes: fehlend heißt „beurteile mich normal", leer heißt „beurteile
 * mich wie jemanden ohne jede Rolle". Letzteres ist eine echte Ansicht — es ist das, was eine
 * Kollegin an dem Tag sieht, an dem ihre Person angelegt wurde und ihr noch niemand etwas
 * gegeben hat.
 */
export const ASSUME_NONE = 'NONE';

/**
 * Liest den Cookie-Wert.
 *
 * `undefined` heißt „nicht verengt". Ein leeres Array heißt „auf nichts verengt". Alles, was
 * nicht wie eine Rollenliste aussieht, wird verworfen und ist damit ebenfalls „nicht verengt"
 * — die fehlerfreundliche Richtung, weil ein kaputter Cookie sonst jemanden aussperren würde,
 * ohne dass er wüsste warum.
 */
export function parseAssumedRoles(cookie: string | undefined): string[] | undefined {
	if (cookie === undefined) return undefined;

	const raw = cookie.trim();
	if (raw === '') return undefined;
	if (raw === ASSUME_NONE) return [];

	const roles = raw
		.split(',')
		.map((part) => part.trim())
		.filter((part) => /^[A-Z_]{1,40}$/.test(part));

	return roles.length > 0 ? roles : undefined;
}

/** Baut den Cookie-Wert aus einer Auswahl. */
export function serializeAssumedRoles(roles: readonly string[]): string {
	return roles.length === 0 ? ASSUME_NONE : [...roles].join(',');
}

/**
 * Der Header-Wert für das Backend, oder `undefined`, wenn nicht verengt wird.
 *
 * Der leere String ist ein gültiger Wert und bedeutet etwas anderes als „kein Header" — siehe
 * ASSUME_NONE und `narrowIfRequested` im Backend.
 */
export function assumeHeaderValue(roles: string[] | undefined): string | undefined {
	if (roles === undefined) return undefined;
	return roles.join(',');
}
