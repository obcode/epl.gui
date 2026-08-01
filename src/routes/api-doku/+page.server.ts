import { env } from '$env/dynamic/public';
import { examples, tokenEndpoint } from '$lib/apiExamples';
import type { PageServerLoad } from './$types';

/**
 * Die Route heißt `/api-doku` und nicht `/api`.
 *
 * `/api/graphql` ist die Maschinen-API, die Caddy am Backend vorbei an die GUI nicht
 * weiterreicht. Ein GUI-Pfad direkt daneben funktioniert heute — der Matcher trifft exakt —
 * und wäre genau dann kaputt, wenn jemand ihn zu `/api/*` verallgemeinert. Der Preis dafür
 * ist ein Bindestrich im Pfad; der Gegenwert ist, dass die beiden Namensräume sich nicht
 * berühren.
 */
export const load: PageServerLoad = async () => {
	// Serverseitig aufgelöst, damit die Seite die URL schon im ersten HTML enthält: wer sie
	// kopieren will, soll nicht warten, bis JavaScript geladen hat.
	const endpoint = tokenEndpoint(env.PUBLIC_TALLOX_SERVER ?? '');

	return {
		endpoint,
		examples: examples(endpoint)
	};
};
