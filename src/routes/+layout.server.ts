import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { loadServerBuildInfo } from '$lib/server/buildInfo';
import { loadSession } from '$lib/server/session';

/**
 * Was auf jeder Seite im Rahmen steht: Identität, Rollen, Theme, Serverversion.
 *
 * Im Layout und nicht in jedem `+page.server.ts`, damit eine neue Seite den Rahmen nicht
 * versehentlich ohne diese Werte rendert.
 *
 * Die Sitzung kommt aus `session` und nicht aus `me`, weil die beiden auseinanderlaufen, sobald
 * jemand seine Rollen verengt hat: `me.roles` sind die gehaltenen, `session.effectiveRoles`
 * sind die, nach denen der Server diesen Request beurteilt. Eine Navigation, die aus den
 * gehaltenen Rollen gebaut wird, zeigt in der Vorschau das Menü einer Person, deren Rechte der
 * Server gerade nicht mehr anwendet — und beantwortet damit genau die Frage nicht, für die es
 * die Vorschau gibt.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const [session, serverBuild] = await Promise.all([loadSession(), loadServerBuildInfo()]);

	if (session.kind === 'no-access') {
		// 403 und nicht 401: eine erneute Anmeldung hilft nicht. Der Auth-Proxy hat diese Person
		// bereits durchgelassen — was fehlt, ist eine Zeile in `person`, und die legt die
		// Administration an. `+error.svelte` macht daraus einen Satz, der das sagt.
		error(403, session.message);
	}

	return {
		remoteUser: locals.remoteUser ?? null,
		remoteDisplayname: locals.remoteDisplayname ?? null,
		// null, wenn das Backend nicht erreichbar war. Die Seite rendert dann weiter, mit dem
		// Hinweis im Footer — ein laufender Deploy darf nicht jede Seite mit einem Fehler
		// beantworten.
		session: session.kind === 'ok' ? session.session : null,
		theme: locals.theme,
		serverBuild
	};
};
