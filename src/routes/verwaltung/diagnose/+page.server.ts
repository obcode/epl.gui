import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/gql/__generated__';
import { backendRequest } from '$lib/server/backend';
import { toRefusal } from '$lib/server/graphqlError';

const DiagnoseDocument = graphql(`
	query DiagnoseAccess($mail: String!) {
		diagnoseAccess(mail: $mail) {
			active
			person {
				id
				mail
				name
				roles
			}
			grants {
				role
				grantedAt
				expiresAt
				grantedBy {
					mail
					name
				}
			}
			decisions {
				rule
				allowed
				reason
			}
		}
	}
`);

/**
 * Die Antwort auf „warum sieht Kollegin X das nicht".
 *
 * Das Feld ist `@interactiveOnly` — über ein Personal Access Token liefert es `null`. Die
 * API-Konsole unter /api-doku geht bewusst durch die Token-Tür und kann es deshalb nicht
 * zeigen; ohne diese Seite gäbe es in Produktion gar keinen Weg, es zu benutzen. Genau das
 * war beim ersten Anlauf der Fall.
 *
 * Die Adresse steht in der URL und nicht in einem POST: das ist eine Abfrage, kein Vorgang,
 * und ein Link auf eine konkrete Diagnose ist genau das, was man in eine Supportantwort
 * kopiert.
 */
export const load: PageServerLoad = async ({ url }) => {
	const mail = (url.searchParams.get('mail') ?? '').trim();
	if (mail === '') {
		return { mail: '', diagnosis: null };
	}

	try {
		const data = await backendRequest(DiagnoseDocument, { mail });
		// `null` heißt „diese Installation kennt die Adresse nicht" — und das ist bei dieser
		// Frage oft schon die ganze Antwort. Deshalb ein Zustand der Seite und kein Fehler.
		return { mail, diagnosis: data.diagnoseAccess ?? null };
	} catch (err) {
		error(403, toRefusal(err).message);
	}
};
