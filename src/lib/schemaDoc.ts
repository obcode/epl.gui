import { buildSchema, GraphQLEnumType, GraphQLObjectType, GraphQLScalarType } from 'graphql';
import type { GraphQLNamedType } from 'graphql';

/**
 * Die API-Referenz aus dem Schema, nicht aus einem Text.
 *
 * Eine von Hand gepflegte Feldliste ist ab dem Tag falsch, an dem sie geschrieben wird — und
 * niemand merkt es, weil eine Dokumentation nicht rot wird. `schema.graphql` ist die
 * eingecheckte Kopie des Backend-Schemas (`pnpm run update-schema`), also genau das, was
 * `pnpm codegen` auch benutzt: die Referenz kann gar nicht von den typisierten Dokumenten
 * abweichen.
 *
 * **Was die Referenz nicht zeigen kann:** welche Felder `@interactiveOnly` sind. Die
 * GraphQL-Introspection liefert die *Definition* einer Direktive, aber nicht, wo sie
 * angewandt wurde — `schema.graphql` entsteht aus Introspection und weiß es damit selbst
 * nicht. Im Backend steht die Einschränkung deshalb in der Feldbeschreibung, und die kommt
 * hier mit. Die Konsole auf der Doku-Seite ist die zweite Antwort: wer es genau wissen will,
 * fragt das Feld mit einem Token ab und sieht `null`.
 */

export type FieldArg = {
	name: string;
	type: string;
	description: string | null;
	defaultValue: string | null;
};

export type SchemaField = {
	name: string;
	type: string;
	description: string | null;
	args: FieldArg[];
	deprecationReason: string | null;
};

export type SchemaType = {
	name: string;
	kind: 'object' | 'enum' | 'scalar';
	description: string | null;
	/** Nur bei Objekttypen. */
	fields: SchemaField[];
	/** Nur bei Enums. */
	values: { name: string; description: string | null }[];
};

export type SchemaDoc = {
	/** Query, Mutation und Subscription — in dieser Reihenfolge, soweit vorhanden. */
	roots: SchemaType[];
	/** Alles Übrige, alphabetisch. */
	types: SchemaType[];
};

/**
 * Baut die Referenz aus einem SDL-Text.
 *
 * Nimmt den Text als Parameter statt ihn selbst zu lesen: so ist die Funktion ohne
 * Dateisystem prüfbar, und die Seite entscheidet, woher das Schema kommt.
 */
export function buildSchemaDoc(sdl: string): SchemaDoc {
	const schema = buildSchema(sdl);

	const rootNames = [
		schema.getQueryType()?.name,
		schema.getMutationType()?.name,
		schema.getSubscriptionType()?.name
	].filter((name): name is string => !!name);

	const roots: SchemaType[] = [];
	const types: SchemaType[] = [];

	for (const type of Object.values(schema.getTypeMap())) {
		// Introspection-Typen (`__Schema`, `__Type`, …) sind Werkzeug, nicht Anwendung.
		if (type.name.startsWith('__')) continue;

		const described = describe(type);
		if (!described) continue;

		if (rootNames.includes(type.name)) roots.push(described);
		else types.push(described);
	}

	roots.sort((a, b) => rootNames.indexOf(a.name) - rootNames.indexOf(b.name));
	types.sort((a, b) => a.name.localeCompare(b.name));

	return { roots, types };
}

function describe(type: GraphQLNamedType): SchemaType | null {
	if (type instanceof GraphQLObjectType) {
		return {
			name: type.name,
			kind: 'object',
			description: type.description ?? null,
			fields: Object.values(type.getFields()).map((field) => ({
				name: field.name,
				type: field.type.toString(),
				description: field.description ?? null,
				deprecationReason: field.deprecationReason ?? null,
				args: field.args.map((arg) => ({
					name: arg.name,
					type: arg.type.toString(),
					description: arg.description ?? null,
					defaultValue: arg.defaultValue === undefined ? null : JSON.stringify(arg.defaultValue)
				}))
			})),
			values: []
		};
	}

	if (type instanceof GraphQLEnumType) {
		return {
			name: type.name,
			kind: 'enum',
			description: type.description ?? null,
			fields: [],
			values: type.getValues().map((value) => ({
				name: value.name,
				description: value.description ?? null
			}))
		};
	}

	if (type instanceof GraphQLScalarType) {
		// Die eingebauten Skalare erklären sich selbst und stünden nur im Weg. Eigene — Time,
		// später vielleicht mehr — tragen eine Beschreibung, die jemand geschrieben hat.
		const builtin = ['String', 'Int', 'Float', 'Boolean', 'ID'];
		if (builtin.includes(type.name)) return null;

		return {
			name: type.name,
			kind: 'scalar',
			description: type.description ?? null,
			fields: [],
			values: []
		};
	}

	return null;
}

/**
 * Ein Absatz einer Beschreibung, so wie er angezeigt wird.
 *
 * `code` behält seine Zeilenumbrüche, `text` wird neu umbrochen.
 */
export type DescriptionBlock = { kind: 'text' | 'code'; text: string };

/**
 * Bricht eine Beschreibung neu um.
 *
 * Die Beschreibungen im Schema sind Quelltext: sie sind auf knapp 100 Zeichen hart
 * umbrochen, weil sie in einer `.graphqls`-Datei gelesen werden. Introspection reicht diese
 * Zeilenumbrüche wörtlich weiter — sie stecken also in `schema.graphql` und damit hier. Auf
 * einer Seite ergibt das Zeilen, die mitten im Satz enden, und zwar an einer Stelle, die mit
 * der Breite des Browsers nichts zu tun hat.
 *
 * Einfach alle Umbrüche zu entfernen wäre falsch: die Leerzeile zwischen zwei Absätzen ist
 * eine Aussage, und ohne sie wird aus einer strukturierten Erklärung eine Textwand. Also:
 * Absätze bleiben, die harten Umbrüche innerhalb eines Absatzes verschwinden.
 *
 * Eingerückte Absätze bleiben, wie sie sind. Im heutigen Schema gibt es keine — aber ein
 * Beispielaufruf oder eine kleine Tabelle in einer Beschreibung ist absehbar, und die durch
 * einen Reflow zu schicken macht sie unlesbar.
 */
export function describeBlocks(description: string | null | undefined): DescriptionBlock[] {
	if (!description) return [];

	return description
		.replace(/\r\n/g, '\n')
		.split(/\n[ \t]*\n/)
		.map((paragraph) => paragraph.replace(/\s+$/, ''))
		.filter((paragraph) => paragraph.trim() !== '')
		.map((paragraph) => {
			const indented = paragraph.split('\n').some((line) => /^[ \t]{2,}\S/.test(line));
			if (indented) return { kind: 'code' as const, text: paragraph };

			return {
				kind: 'text' as const,
				text: paragraph.split('\n').join(' ').replace(/ {2,}/g, ' ')
			};
		});
}

/**
 * Ein Stück Fließtext, entweder normal oder als Code ausgezeichnet.
 */
export type InlineSegment = { code: boolean; text: string };

/**
 * Zerlegt einen Absatz an den Backticks.
 *
 * GraphQL-Beschreibungen sind laut Spezifikation Markdown, und im Schema wird das auch
 * benutzt: `null`, `@interactiveOnly`, `/api/graphql`. Wörtlich angezeigt stehen die
 * Backticks als Zeichen auf der Seite und sehen aus wie ein Formatierungsfehler — was sie
 * genau genommen auch sind.
 *
 * Zerlegt in Segmente statt HTML zu erzeugen: die Beschreibungen kommen aus einem anderen
 * Repository, und ein `{@html}` mit fremdem Text wäre eine Einladung, die man nicht
 * ausspricht. So bleibt jedes Segment ein Textknoten, den Svelte escaped.
 *
 * Mehr Markdown als das absichtlich nicht. Fett und Kursiv kommen in diesen Beschreibungen
 * kaum vor, und eine halbe Markdown-Implementierung von Hand ist der Anfang einer ganzen.
 */
export function inlineSegments(text: string): InlineSegment[] {
	const segments: InlineSegment[] = [];

	// Ungerade Anzahl Backticks: dann ist der letzte keiner, der etwas öffnet. split() liefert
	// die Teile abwechselnd, also fällt das von selbst richtig heraus.
	text.split('`').forEach((part, index) => {
		if (part === '') return;
		segments.push({ code: index % 2 === 1, text: part });
	});

	return segments;
}

/**
 * Ein Anker für die Sprungmarken. Nur Buchstaben und Ziffern, damit er in eine URL passt und
 * nicht mit einem CSS-Selektor kollidiert.
 */
export function anchorFor(typeName: string): string {
	return `typ-${typeName.replace(/[^A-Za-z0-9]/g, '')}`;
}
