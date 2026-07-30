import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Sobald das Backend `me` liefert, wird das hier ein backendRequest. Bis dahin zeigt die
	// Startseite, was der Auth-Proxy durchgereicht hat — das ist genau die Information, die
	// man beim Aufsetzen von Shibboleth sehen will.
	return {
		remoteUser: locals.remoteUser ?? null,
		remoteDisplayname: locals.remoteDisplayname ?? null,
		buildTime: __BUILD_TIME__
	};
};
