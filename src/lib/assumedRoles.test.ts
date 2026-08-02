import { describe, expect, it } from 'vitest';
import {
	ASSUME_NONE,
	assumeHeaderValue,
	parseAssumedRoles,
	serializeAssumedRoles
} from './assumedRoles';

describe('parseAssumedRoles', () => {
	it('tells "not narrowed" apart from "narrowed to nothing"', () => {
		// The whole reason ASSUME_NONE exists. The two states are different: missing means "judge
		// me normally", NONE means "judge me as somebody with no role at all" — and that is a
		// real view, namely the one a freshly created person has before anybody has given her
		// anything.
		expect(parseAssumedRoles(undefined)).toBeUndefined();
		expect(parseAssumedRoles(ASSUME_NONE)).toEqual([]);
	});

	it('reads a list', () => {
		expect(parseAssumedRoles('LECTURER,DEANS_OFFICE')).toEqual(['LECTURER', 'DEANS_OFFICE']);
		expect(parseAssumedRoles(' LECTURER , DEANS_OFFICE ')).toEqual(['LECTURER', 'DEANS_OFFICE']);
	});

	it('discards anything that does not look like a role', () => {
		// Forgiving rather than strict: a broken cookie must not lock anybody out without their
		// knowing why. And it cannot gain anything anyway — the backend intersects the selection
		// with the roles held.
		expect(parseAssumedRoles('<script>')).toBeUndefined();
		expect(parseAssumedRoles('lecturer')).toBeUndefined();
		expect(parseAssumedRoles('')).toBeUndefined();
		expect(parseAssumedRoles('LECTURER,<script>')).toEqual(['LECTURER']);
	});
});

describe('serializeAssumedRoles', () => {
	it('is the inverse of parseAssumedRoles', () => {
		for (const roles of [[], ['LECTURER'], ['LECTURER', 'ADMIN']]) {
			expect(parseAssumedRoles(serializeAssumedRoles(roles))).toEqual(roles);
		}
	});
});

describe('assumeHeaderValue', () => {
	it('sends no header when nothing is narrowed', () => {
		expect(assumeHeaderValue(undefined)).toBeUndefined();
	});

	it('sends an empty header for "no role at all"', () => {
		// Empty string, not undefined: the backend tells "header missing" from "header is empty",
		// and that distinction is exactly the one from the first test here.
		expect(assumeHeaderValue([])).toBe('');
	});

	it('sends the selection as a list', () => {
		expect(assumeHeaderValue(['LECTURER', 'ADMIN'])).toBe('LECTURER,ADMIN');
	});
});
