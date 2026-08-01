// Der SDL-Text wird zur Bauzeit eingebettet (`?raw`), nicht zur Laufzeit gelesen: im
// gebauten Container liegt `schema.graphql` nicht neben dem Server, und ein Dateizugriff
// wäre eine Fehlerquelle für etwas, das sich zwischen zwei Builds ohnehin nicht ändert.
//
// Es ist dieselbe Datei, aus der `pnpm codegen` die Typen erzeugt. Die Referenz kann damit
// nicht von dem abweichen, was diese Anwendung selbst abfragt.
import schemaSDL from '../../../../schema.graphql?raw';
import { buildSchemaDoc } from '$lib/schemaDoc';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { doc: buildSchemaDoc(schemaSDL) };
};
