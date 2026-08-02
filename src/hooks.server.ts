import type { Handle } from '@sveltejs/kit';
import { authContext } from '$lib/server/backend';
import { ASSUME_COOKIE, parseAssumedRoles } from '$lib/assumedRoles';
import { resolveTheme, THEME_COOKIE, themeAttribute } from '$lib/themes';

/**
 * The one place for identity, the access gate and the write lock.
 *
 * The auth proxy (Caddy → oauth2-proxy → OIDC) sets X-Remote-User authoritatively and discards
 * anything the client sends itself. Here the value is only put into the AsyncLocalStorage, so
 * that every SSR load and every /gui-api handler finds it without being passed it.
 *
 * Whatever is added here later is deliberately all fail-open: the backend is the actual lock. A
 * stuttering backend must not lock anybody out, but it must not let anybody in either — which
 * is why authorization lives there and not here.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const remoteUser = event.request.headers.get('x-remote-user') || undefined;
	const remoteDisplayname = event.request.headers.get('x-remote-displayname') || undefined;

	event.locals.remoteUser = remoteUser;
	event.locals.remoteDisplayname = remoteDisplayname;

	// The role narrowing. From the cookie, not from a client header — and from there the same
	// route as the identity, so that no load and no handler has to pass it through.
	//
	// Relayed unvalidated, deliberately: the backend intersects the selection with the roles
	// actually held (policy.Narrow), and an intersection cannot add anything. Validating here
	// would create a second opinion about permissions, and two opinions about permissions is
	// one more than this project may have.
	const assumedRoles = parseAssumedRoles(event.cookies.get(ASSUME_COOKIE));
	event.locals.assumedRoles = assumedRoles;

	// The theme has to be settled BEFORE the first byte, or the default theme flashes briefly on
	// every full load. The value goes through resolveTheme() and is therefore limited to the
	// allowlist — it is written into the <html> tag unescaped.
	const theme = resolveTheme(event.cookies.get(THEME_COOKIE));
	event.locals.theme = theme;

	return authContext.run({ remoteUser, remoteDisplayname, assumedRoles }, () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%tallox.themeattr%', themeAttribute(theme))
		})
	);
};
