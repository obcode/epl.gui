import type { CodegenConfig } from '@graphql-codegen/cli';

// client-preset mit Documents-Glob, nicht nur Schema-Typen.
//
// Bewusste Abweichung vom Schwesterprojekt: dort erzeugt der Codegen 4375 Zeilen Typen, die
// genau eine Datei importiert — die Abfrageergebnisse sind faktisch `any`. Mit dem
// client-preset ist jedes `graphql(...)`-Dokument typisiert, und `graphql-request` liefert
// das passende Ergebnis, ohne dass man den Typ von Hand danebenschreibt.
//
// Quelle ist die eingecheckte schema.graphql, nicht das laufende Backend: so funktioniert
// `pnpm codegen` offline und in der CI. Aktualisiert wird sie mit `pnpm run update-schema`.
const config: CodegenConfig = {
	schema: './schema.graphql',
	documents: ['src/**/*.{ts,svelte}', '!src/lib/gql/__generated__/**'],
	ignoreNoDocuments: true,
	generates: {
		'./src/lib/gql/__generated__/': {
			preset: 'client',
			config: {
				useTypeImports: true
			}
		}
	}
};

export default config;
