import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { anchorFor, buildSchemaDoc, describeBlocks, inlineSegments } from './schemaDoc';

const SDL = `
"""Der Einstieg."""
type Query {
	"Die anfragende Person."
	me: Person
	"Tokens der anfragenden Person."
	myTokens: [PersonalAccessToken!]
}

type Mutation {
	"Legt ein Token an."
	createPersonalAccessToken(
		"Wofür es ist."
		description: String!
		expiresInDays: Int
	): PersonalAccessToken!
}

"""Eine Person."""
type Person {
	id: ID!
	roles: [Role!]!
	alt: String @deprecated(reason: "Heißt jetzt id.")
}

type PersonalAccessToken {
	id: ID!
	createdAt: Time!
}

"""Eine Rolle."""
enum Role {
	"Lehrende Person."
	LECTURER
	ADMIN
}

"""Ein Zeitpunkt."""
scalar Time
`;

describe('buildSchemaDoc', () => {
	const doc = buildSchemaDoc(SDL);

	it('stellt Query und Mutation nach vorn', () => {
		// Die Wurzeltypen sind das, was jemand sucht: was kann ich abfragen, was kann ich
		// ändern. Alphabetisch einsortiert stünde Mutation zwischen zwei Datentypen.
		expect(doc.roots.map((t) => t.name)).toEqual(['Query', 'Mutation']);
	});

	it('sortiert den Rest alphabetisch', () => {
		const names = doc.types.map((t) => t.name);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
	});

	it('lässt Introspection-Typen weg', () => {
		const all = [...doc.roots, ...doc.types].map((t) => t.name);
		expect(all.some((name) => name.startsWith('__'))).toBe(false);
	});

	it('lässt die eingebauten Skalare weg, nicht aber die eigenen', () => {
		// String und Int erklären sich selbst; Time trägt eine Beschreibung, die jemand
		// geschrieben hat, und ist genau deshalb erklärungsbedürftig.
		const names = doc.types.map((t) => t.name);
		expect(names).not.toContain('String');
		expect(names).not.toContain('Boolean');
		expect(names).toContain('Time');
	});

	it('übernimmt Beschreibungen von Typen, Feldern und Argumenten', () => {
		// Die Beschreibungen sind der eigentliche Inhalt der Referenz — ohne sie ist sie nur
		// eine Liste von Namen, die man auch per Introspection bekommt.
		const query = doc.roots.find((t) => t.name === 'Query');
		expect(query?.description).toBe('Der Einstieg.');
		expect(query?.fields.find((f) => f.name === 'me')?.description).toBe('Die anfragende Person.');

		const mutation = doc.roots.find((t) => t.name === 'Mutation');
		const create = mutation?.fields.find((f) => f.name === 'createPersonalAccessToken');
		expect(create?.args.find((a) => a.name === 'description')?.description).toBe('Wofür es ist.');
	});

	it('behält die Nullbarkeit im Typnamen', () => {
		// `[PersonalAccessToken!]` gegen `[PersonalAccessToken!]!` ist hier keine Feinheit: die
		// nullable Liste ist die Art, wie @interactiveOnly antwortet, ohne die Abfrage zu
		// kippen. Wer die Referenz liest, muss den Unterschied sehen.
		const query = doc.roots.find((t) => t.name === 'Query');
		expect(query?.fields.find((f) => f.name === 'myTokens')?.type).toBe('[PersonalAccessToken!]');
		expect(query?.fields.find((f) => f.name === 'me')?.type).toBe('Person');
	});

	it('nennt veraltete Felder als solche', () => {
		const person = doc.types.find((t) => t.name === 'Person');
		expect(person?.fields.find((f) => f.name === 'alt')?.deprecationReason).toBe('Heißt jetzt id.');
	});

	it('listet Enum-Werte mit ihren Beschreibungen', () => {
		const role = doc.types.find((t) => t.name === 'Role');
		expect(role?.kind).toBe('enum');
		expect(role?.values.map((v) => v.name)).toEqual(['LECTURER', 'ADMIN']);
		expect(role?.values[0].description).toBe('Lehrende Person.');
	});
});

describe('das echte Schema', () => {
	// Gegen die eingecheckte Datei, nicht nur gegen ein Beispiel: sie ist die Quelle sowohl
	// für die Referenz als auch für `pnpm codegen`. Wenn sie sich so ändert, dass die Referenz
	// leer bliebe, soll das hier auffallen und nicht auf der Seite.
	const doc = buildSchemaDoc(readFileSync('schema.graphql', 'utf8'));

	it('hat einen Query-Typ mit Feldern', () => {
		expect(doc.roots[0].name).toBe('Query');
		expect(doc.roots[0].fields.length).toBeGreaterThan(0);
	});

	it('beschreibt jeden Wurzelfeld-Eintrag', () => {
		// Ein Feld ohne Beschreibung ist in der Referenz eine Zeile, die nichts erklärt. Das
		// ist im Backend-Schema zu beheben, nicht hier.
		for (const root of doc.roots) {
			for (const field of root.fields) {
				expect(field.description, `${root.name}.${field.name} hat keine Beschreibung`).toBeTruthy();
			}
		}
	});
});

describe('anchorFor', () => {
	it('erzeugt eine Sprungmarke ohne Sonderzeichen', () => {
		expect(anchorFor('PersonalAccessToken')).toBe('typ-PersonalAccessToken');
		expect(anchorFor('Foo Bar!')).toBe('typ-FooBar');
	});
});

describe('describeBlocks', () => {
	it('macht aus harten Umbrüchen wieder Fließtext', () => {
		// Der eigentliche Befund: die Beschreibungen sind im Schema auf knapp 100 Zeichen
		// umbrochen, weil sie dort Quelltext sind. Auf einer Seite endete die Zeile damit
		// mitten im Satz, an einer Stelle, die mit der Breite des Browsers nichts zu tun hat.
		const blocks = describeBlocks(
			'Nullable on purpose, and the null is the interesting part: through a\n' +
				'Personal Access Token this field answers null rather than failing.'
		);

		expect(blocks).toHaveLength(1);
		expect(blocks[0].text).toBe(
			'Nullable on purpose, and the null is the interesting part: through a ' +
				'Personal Access Token this field answers null rather than failing.'
		);
		expect(blocks[0].text).not.toContain('\n');
	});

	it('behält Absätze als Absätze', () => {
		// Die Leerzeile ist eine Aussage: ohne sie wird aus einer strukturierten Erklärung
		// eine Textwand, und das wäre die Überkorrektur zum ursprünglichen Fehler.
		const blocks = describeBlocks('Erster Absatz.\nnoch erster.\n\nZweiter Absatz.');

		expect(blocks.map((b) => b.text)).toEqual(['Erster Absatz. noch erster.', 'Zweiter Absatz.']);
	});

	it('lässt eingerückte Blöcke in Ruhe', () => {
		// Heute gibt es im Schema keine. Ein Beispielaufruf in einer Beschreibung ist aber
		// absehbar, und durch einen Reflow geschickt wäre er unlesbar.
		const blocks = describeBlocks(
			'Aufruf:\n\n    curl -H "Authorization: Bearer …" \\\n      https://…'
		);

		expect(blocks[0]).toEqual({ kind: 'text', text: 'Aufruf:' });
		expect(blocks[1].kind).toBe('code');
		expect(blocks[1].text).toContain('\n');
	});

	it('kommt mit fehlenden und leeren Beschreibungen zurecht', () => {
		expect(describeBlocks(null)).toEqual([]);
		expect(describeBlocks(undefined)).toEqual([]);
		expect(describeBlocks('   \n\n  ')).toEqual([]);
	});

	it('räumt Windows-Zeilenenden und doppelte Leerzeichen auf', () => {
		expect(describeBlocks('Eine Zeile\r\nund noch eine')[0].text).toBe('Eine Zeile und noch eine');
	});

	it('reflowt jede Beschreibung des echten Schemas ohne Rest-Umbruch', () => {
		// Gegen die eingecheckte Datei: wenn im Backend jemand eine Beschreibung mit einer
		// Struktur schreibt, die hier falsch behandelt wird, soll das auffallen.
		const doc = buildSchemaDoc(readFileSync('schema.graphql', 'utf8'));

		for (const type of [...doc.roots, ...doc.types]) {
			for (const block of describeBlocks(type.description)) {
				if (block.kind === 'text') expect(block.text).not.toContain('\n');
			}
			for (const field of type.fields) {
				for (const block of describeBlocks(field.description)) {
					if (block.kind === 'text') expect(block.text).not.toContain('\n');
				}
			}
		}
	});
});

describe('inlineSegments', () => {
	it('zeichnet Backtick-Abschnitte als Code aus', () => {
		// GraphQL-Beschreibungen sind Markdown, und das Schema benutzt das: `null`,
		// `@interactiveOnly`, `/api/graphql`. Wörtlich angezeigt sehen die Backticks aus wie
		// ein Formatierungsfehler.
		expect(inlineSegments('antwortet `null` statt zu scheitern')).toEqual([
			{ code: false, text: 'antwortet ' },
			{ code: true, text: 'null' },
			{ code: false, text: ' statt zu scheitern' }
		]);
	});

	it('kommt mit einem einzelnen Backtick zurecht', () => {
		// Ein unpaariger Backtick ist ein Tippfehler im Schema, kein Grund, den Rest des
		// Absatzes zu verlieren.
		expect(inlineSegments('ein ` einzelner')).toEqual([
			{ code: false, text: 'ein ' },
			{ code: true, text: ' einzelner' }
		]);
	});

	it('gibt Text ohne Backticks unverändert zurück', () => {
		expect(inlineSegments('ganz normaler Satz')).toEqual([
			{ code: false, text: 'ganz normaler Satz' }
		]);
	});
});
