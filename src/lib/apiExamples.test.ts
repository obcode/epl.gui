import { describe, expect, it } from 'vitest';
import { EXAMPLE_QUERY, examples, tokenEndpoint } from './apiExamples';

describe('tokenEndpoint', () => {
	it('turns the browser door into the token door', () => {
		expect(tokenEndpoint('https://tallox.example.org/query')).toBe(
			'https://tallox.example.org/api/graphql'
		);
	});

	it('works when the variable is set without /query too', () => {
		expect(tokenEndpoint('https://tallox.example.org')).toBe(
			'https://tallox.example.org/api/graphql'
		);
		expect(tokenEndpoint('https://tallox.example.org/')).toBe(
			'https://tallox.example.org/api/graphql'
		);
	});

	it('keeps the port of local development', () => {
		expect(tokenEndpoint('http://localhost:8080/query')).toBe('http://localhost:8080/api/graphql');
	});

	it('falls back to a relative path without configuration', () => {
		// No invented hostname: relative is right in production (same origin) and visibly wrong
		// locally, which beats being plausibly wrong.
		expect(tokenEndpoint('')).toBe('/api/graphql');
		expect(tokenEndpoint('   ')).toBe('/api/graphql');
	});
});

describe('examples', () => {
	const all = examples('https://tallox.example.org/api/graphql');

	it('names the endpoint in every example', () => {
		// An example with a different URL from the box above it is exactly the kind of
		// contradiction somebody turns into a support question.
		for (const example of all) {
			expect(example.code).toContain('https://tallox.example.org/api/graphql');
		}
	});

	it('never writes the token into the source', () => {
		// The instructions have to demonstrate what they ask for: the likeliest way a token goes
		// missing is a script with the token in it.
		for (const example of all) {
			expect(example.code).toMatch(/TALLOX_TOKEN/);
			expect(example.code).not.toMatch(/tallox_[0-9A-Z]{16}_/);
		}
	});

	it('uses a query that works in an empty system', () => {
		// `me` answers "does my token work, and who am I with it" — and needs no domain data,
		// which does not exist on the first day.
		expect(EXAMPLE_QUERY).toContain('me');
		for (const example of all) {
			expect(example.code).toContain(EXAMPLE_QUERY);
		}
	});

	it('has unique identifiers for the tab switch', () => {
		const ids = all.map((example) => example.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
