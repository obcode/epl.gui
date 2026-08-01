import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { anchorFor, buildSchemaDoc } from './schemaDoc';

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
