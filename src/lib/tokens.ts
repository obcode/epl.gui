/**
 * Was die Token-Seite über einen Token weiß, ohne ihn anzuzeigen.
 *
 * Logik aus `.svelte` heraus in ein Modul, damit sie geprüft werden kann — die Statuszeile
 * eines Tokens ist genau die Stelle, an der ein „abgelaufen" versehentlich zu „gültig" wird,
 * und im Markup ließe sich das nur über einen Browsertest zeigen.
 */

export type TokenStatus = 'active' | 'revoked' | 'expired';

export type TokenLike = {
	expiresAt: string;
	revokedAt?: string | null;
};

/**
 * Widerrufen schlägt abgelaufen, und beides schlägt gültig.
 *
 * Die Reihenfolge ist nicht beliebig: ein Token, das widerrufen wurde und inzwischen auch
 * abgelaufen wäre, ist widerrufen — das ist die Information, die jemand sucht, der wissen
 * will, ob der Widerruf funktioniert hat.
 */
export function tokenStatus(token: TokenLike, now: Date = new Date()): TokenStatus {
	if (token.revokedAt) return 'revoked';
	if (new Date(token.expiresAt).getTime() <= now.getTime()) return 'expired';
	return 'active';
}

/** Beschriftung des Badges. Deutsch, weil sie jemand liest. */
export const STATUS_LABEL: Record<TokenStatus, string> = {
	active: 'gültig',
	revoked: 'widerrufen',
	expired: 'abgelaufen'
};

/**
 * daisyUI-Badge-Klasse je Status.
 *
 * Badges statt Textfarben: `text-error` und `text-warning` sind bei daisyUI
 * *Hintergrund*farben und erreichen als Text auf `base-100` je nach Theme nur 1,35:1 bis
 * 3,5:1. Als Badge werden sie mit ihrer `*-content`-Farbe gepaart, und das Paar ist auf
 * Kontrast ausgelegt — geprüft über alle zwölf Themes in `tests/contrast.spec.ts`.
 */
export const STATUS_BADGE: Record<TokenStatus, string> = {
	active: 'badge-success',
	revoked: 'badge-neutral',
	expired: 'badge-warning'
};

/**
 * Ein Zeitpunkt, wie er in der Liste steht.
 *
 * `de-DE` und Europe/Berlin fest verdrahtet, nicht die Locale des Browsers: die Anwendung ist
 * für eine Fakultät in München, und ein Datum, das je nach Browsereinstellung mal als 08/01
 * und mal als 01.08. erscheint, macht aus einer Tabelle ein Rätsel. Dieselbe Zeitzone, in der
 * das Backend rechnet.
 */
export function formatMoment(value: string | null | undefined): string {
	if (!value) return '—';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';

	return new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Europe/Berlin'
	}).format(date);
}

/**
 * „läuft in 12 Tagen ab" — die Angabe, nach der man die Liste tatsächlich liest.
 *
 * Ein Datum beantwortet „wann", aber die Frage vor dem Aufräumen ist „wie lange noch". Bei
 * bereits abgelaufenen Tokens gibt es nichts zu rechnen; die Statuszeile sagt es dann.
 */
export function expiresIn(expiresAt: string, now: Date = new Date()): string {
	const days = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000);

	if (Number.isNaN(days) || days <= 0) return '';
	if (days === 1) return 'läuft morgen ab';
	return `läuft in ${days} Tagen ab`;
}
