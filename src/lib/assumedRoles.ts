/**
 * Role narrowing — "let me see what a lecturer sees".
 *
 * The chosen set lives in a cookie and is relayed to the backend by `hooks.server.ts` as
 * `X-Tallox-Assume-Roles`. That this is safe is not a property of this file but of
 * `policy.Narrow` over there: the selection is intersected with the roles actually held, and an
 * intersection cannot add anything. A hand-written cookie therefore takes privileges away from
 * its author and does nothing else.
 *
 * Free of Svelte and browser APIs so the logic is checkable in vitest — like themes.ts.
 */

/** Its own prefix, as with the theme: a generic name collides on the same domain. */
export const ASSUME_COOKIE = 'tallox_assume';

/**
 * A session, not a preference.
 *
 * Eight hours rather than a year: narrowing is something you switch on for a moment and then
 * forget. It should be gone by itself the next morning at the latest, so that nobody reports
 * two weeks later that the administration has disappeared.
 */
export const ASSUME_COOKIE_MAX_AGE = 60 * 60 * 8;

/**
 * The value for "no role at all".
 *
 * An empty cookie value cannot reliably be told from a missing one, and the two mean different
 * things: missing is "judge me normally", empty is "judge me as somebody with no role
 * whatsoever". The latter is a real view — it is what a colleague sees on the day her person
 * row was created and nobody has given her anything yet.
 */
export const ASSUME_NONE = 'NONE';

/**
 * Reads the cookie value.
 *
 * `undefined` means "not narrowed". An empty array means "narrowed to nothing". Anything that
 * does not look like a role list is discarded and therefore also "not narrowed" — the
 * forgiving direction, because a broken cookie would otherwise lock somebody out without their
 * knowing why.
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

/** Builds the cookie value from a selection. */
export function serializeAssumedRoles(roles: readonly string[]): string {
	return roles.length === 0 ? ASSUME_NONE : [...roles].join(',');
}

/**
 * The header value for the backend, or `undefined` when nothing is being narrowed.
 *
 * The empty string is a valid value and means something different from "no header" — see
 * ASSUME_NONE and `narrowIfRequested` in the backend.
 */
export function assumeHeaderValue(roles: string[] | undefined): string | undefined {
	if (roles === undefined) return undefined;
	return roles.join(',');
}
