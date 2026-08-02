/**
 * What the token page knows about a token without showing it.
 *
 * Logic pulled out of `.svelte` into a module so it can be checked — a token's status line is
 * exactly the place where "expired" turns into "valid" by accident, and in markup that could
 * only be shown by a browser test.
 */

export type TokenStatus = 'active' | 'revoked' | 'expired';

export type TokenLike = {
	expiresAt: string;
	revokedAt?: string | null;
};

/**
 * Revoked beats expired, and both beat valid.
 *
 * The order is not arbitrary: a token that was revoked and would since also have expired is
 * revoked — that is the information somebody is looking for when they want to know whether the
 * revocation worked.
 */
export function tokenStatus(token: TokenLike, now: Date = new Date()): TokenStatus {
	if (token.revokedAt) return 'revoked';
	if (new Date(token.expiresAt).getTime() <= now.getTime()) return 'expired';
	return 'active';
}

/** The badge label. German, because somebody reads it. */
export const STATUS_LABEL: Record<TokenStatus, string> = {
	active: 'gültig',
	revoked: 'widerrufen',
	expired: 'abgelaufen'
};

/**
 * The daisyUI badge class per status.
 *
 * Badges rather than text colours: in daisyUI `text-error` and `text-warning` are *background*
 * colours and reach only 1.35:1 to 3.5:1 as text on `base-100`, depending on the theme. As a
 * badge they are paired with their `*-content` colour, and that pair is built for contrast —
 * measured across all twelve themes in `tests/contrast.spec.ts`.
 */
export const STATUS_BADGE: Record<TokenStatus, string> = {
	active: 'badge-success',
	revoked: 'badge-neutral',
	expired: 'badge-warning'
};

/**
 * A moment in time, as it appears in the list.
 *
 * `de-DE` and Europe/Berlin are hard-wired rather than taken from the browser's locale: the
 * application is for a faculty in Munich, and a date that shows as 08/01 or 01.08. depending on
 * a browser setting turns a table into a puzzle. The same timezone the backend calculates in.
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
 * "läuft in 12 Tagen ab" — the figure the list is actually read for.
 *
 * A date answers "when", but the question before a clean-up is "how much longer". For tokens
 * that have already expired there is nothing to calculate; the status line says so instead.
 */
export function expiresIn(expiresAt: string, now: Date = new Date()): string {
	const days = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000);

	if (Number.isNaN(days) || days <= 0) return '';
	if (days === 1) return 'läuft morgen ab';
	return `läuft in ${days} Tagen ab`;
}
