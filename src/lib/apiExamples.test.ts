import { describe, expect, it } from 'vitest';
import { EXAMPLE_QUERY, examples, tokenEndpoint } from './apiExamples';

describe('tokenEndpoint', () => {
	it('macht aus der Browser-Tür die Token-Tür', () => {
		expect(tokenEndpoint('https://tallox.example.org/query')).toBe(
			'https://tallox.example.org/api/graphql'
		);
	});

	it('funktioniert auch, wenn die Variable ohne /query gesetzt ist', () => {
		expect(tokenEndpoint('https://tallox.example.org')).toBe(
			'https://tallox.example.org/api/graphql'
		);
		expect(tokenEndpoint('https://tallox.example.org/')).toBe(
			'https://tallox.example.org/api/graphql'
		);
	});

	it('behält den Port der lokalen Entwicklung', () => {
		expect(tokenEndpoint('http://localhost:8080/query')).toBe('http://localhost:8080/api/graphql');
	});

	it('fällt ohne Konfiguration auf einen relativen Pfad zurück', () => {
		// Kein erfundener Hostname: relativ ist in der Produktion richtig (gleiche Origin) und
		// lokal sichtbar falsch, was besser ist als plausibel falsch.
		expect(tokenEndpoint('')).toBe('/api/graphql');
		expect(tokenEndpoint('   ')).toBe('/api/graphql');
	});
});

describe('examples', () => {
	const all = examples('https://tallox.example.org/api/graphql');

	it('nennt in jedem Beispiel den Endpunkt', () => {
		// Ein Beispiel mit einer anderen URL als der Kasten darüber ist genau die Sorte
		// Widerspruch, die jemand in eine Support-Frage verwandelt.
		for (const example of all) {
			expect(example.code).toContain('https://tallox.example.org/api/graphql');
		}
	});

	it('schreibt das Token nie in den Quelltext', () => {
		// Die Anleitung selbst muss vormachen, was sie fordert: der wahrscheinlichste Weg, auf
		// dem ein Token abhandenkommt, ist ein Skript mit dem Token darin.
		for (const example of all) {
			expect(example.code).toMatch(/TALLOX_TOKEN/);
			expect(example.code).not.toMatch(/tallox_[0-9A-Z]{16}_/);
		}
	});

	it('benutzt eine Abfrage, die im leeren System funktioniert', () => {
		// `me` beantwortet „geht mein Token, und als wer gelte ich" — und braucht keine
		// Fachdaten, die es am ersten Tag noch nicht gibt.
		expect(EXAMPLE_QUERY).toContain('me');
		for (const example of all) {
			expect(example.code).toContain(EXAMPLE_QUERY);
		}
	});

	it('hat eindeutige Kennungen für die Umschaltung', () => {
		const ids = all.map((example) => example.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
