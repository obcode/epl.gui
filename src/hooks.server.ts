import type { Handle } from '@sveltejs/kit';
import { authContext } from '$lib/server/backend';

/**
 * Die eine Stelle für Identität, Zugangsgate und Schreibsperre.
 *
 * Der Auth-Proxy (Caddy → oauth2-proxy → OIDC) setzt X-Remote-User autoritativ und verwirft
 * alles, was der Client selbst mitschickt. Hier wird der Wert nur noch in den
 * AsyncLocalStorage gelegt, damit jeder SSR-Load und jeder /gui-api-Handler ihn ohne
 * Durchreichen findet.
 *
 * Was hier (später) noch dazukommt, ist bewusst alles fail-open: das Backend ist der
 * eigentliche Riegel. Ein hakendes Backend darf niemanden aussperren, aber es darf auch
 * niemanden hereinlassen — deshalb liegt die Autorisierung dort, nicht hier.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const remoteUser = event.request.headers.get('x-remote-user') || undefined;
	const remoteDisplayname = event.request.headers.get('x-remote-displayname') || undefined;

	event.locals.remoteUser = remoteUser;
	event.locals.remoteDisplayname = remoteDisplayname;

	return authContext.run({ remoteUser, remoteDisplayname }, () => resolve(event));
};
