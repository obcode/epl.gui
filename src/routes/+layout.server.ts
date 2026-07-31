import type { LayoutServerLoad } from './$types';
import { loadServerBuildInfo } from '$lib/server/buildInfo';

/**
 * Was auf jeder Seite im Rahmen steht: Identität, Theme, Serverversion.
 *
 * Im Layout und nicht in jedem `+page.server.ts`, damit eine neue Seite den Rahmen nicht
 * versehentlich ohne diese Werte rendert.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		remoteUser: locals.remoteUser ?? null,
		remoteDisplayname: locals.remoteDisplayname ?? null,
		theme: locals.theme,
		serverBuild: await loadServerBuildInfo()
	};
};
