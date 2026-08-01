import type { Handle } from '@sveltejs/kit';
import { authContext } from '$lib/server/backend';
import { ASSUME_COOKIE, parseAssumedRoles } from '$lib/assumedRoles';
import { resolveTheme, THEME_COOKIE, themeAttribute } from '$lib/themes';

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

	// Die Rollenverengung. Aus dem Cookie, nicht aus einem Header des Clients — und danach
	// denselben Weg wie die Identität, damit kein Load und kein Handler sie durchreichen muss.
	//
	// Ungeprüft weitergegeben, absichtlich: das Backend schneidet die Auswahl mit den
	// tatsächlich gehaltenen Rollen (policy.Narrow), und ein Schnitt kann nichts hinzufügen.
	// Hier zu validieren würde eine zweite Meinung über Rechte erzeugen, und zwei Meinungen
	// über Rechte sind eine mehr, als dieses Projekt haben darf.
	const assumedRoles = parseAssumedRoles(event.cookies.get(ASSUME_COOKIE));
	event.locals.assumedRoles = assumedRoles;

	// Das Theme muss VOR dem ersten Byte feststehen, sonst blitzt bei jedem Full Load kurz das
	// Default-Theme auf. Der Wert läuft durch resolveTheme() und ist damit auf die Allowlist
	// beschränkt — er wird ungeescaped in das <html>-Tag geschrieben.
	const theme = resolveTheme(event.cookies.get(THEME_COOKIE));
	event.locals.theme = theme;

	return authContext.run({ remoteUser, remoteDisplayname, assumedRoles }, () =>
		resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%tallox.themeattr%', themeAttribute(theme))
		})
	);
};
