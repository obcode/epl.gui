import { describe, expect, it } from 'vitest';
import {
	ASSUME_NONE,
	assumeHeaderValue,
	parseAssumedRoles,
	serializeAssumedRoles
} from './assumedRoles';

describe('parseAssumedRoles', () => {
	it('unterscheidet „nicht verengt" von „auf nichts verengt"', () => {
		// Der ganze Grund, warum es ASSUME_NONE gibt. Die beiden Zustände sind verschieden:
		// fehlend heißt „beurteile mich normal", NONE heißt „beurteile mich wie jemanden ohne
		// jede Rolle" — und das ist eine echte Ansicht, nämlich die einer frisch angelegten
		// Person, der noch niemand etwas gegeben hat.
		expect(parseAssumedRoles(undefined)).toBeUndefined();
		expect(parseAssumedRoles(ASSUME_NONE)).toEqual([]);
	});

	it('liest eine Liste', () => {
		expect(parseAssumedRoles('LECTURER,DEANS_OFFICE')).toEqual(['LECTURER', 'DEANS_OFFICE']);
		expect(parseAssumedRoles(' LECTURER , DEANS_OFFICE ')).toEqual(['LECTURER', 'DEANS_OFFICE']);
	});

	it('verwirft, was nicht wie eine Rolle aussieht', () => {
		// Fehlerfreundlich und nicht fehlerhart: ein kaputter Cookie darf niemanden aussperren,
		// ohne dass er wüsste warum. Und er kann ohnehin nichts gewinnen — das Backend
		// schneidet die Auswahl mit den gehaltenen Rollen.
		expect(parseAssumedRoles('<script>')).toBeUndefined();
		expect(parseAssumedRoles('lecturer')).toBeUndefined();
		expect(parseAssumedRoles('')).toBeUndefined();
		expect(parseAssumedRoles('LECTURER,<script>')).toEqual(['LECTURER']);
	});
});

describe('serializeAssumedRoles', () => {
	it('ist die Umkehrung von parseAssumedRoles', () => {
		for (const roles of [[], ['LECTURER'], ['LECTURER', 'ADMIN']]) {
			expect(parseAssumedRoles(serializeAssumedRoles(roles))).toEqual(roles);
		}
	});
});

describe('assumeHeaderValue', () => {
	it('schickt keinen Header, wenn nicht verengt wird', () => {
		expect(assumeHeaderValue(undefined)).toBeUndefined();
	});

	it('schickt einen leeren Header für „ohne jede Rolle"', () => {
		// Leerer String, nicht undefined: das Backend unterscheidet „Header fehlt" von „Header
		// ist leer", und diese Unterscheidung ist genau die aus dem ersten Test hier.
		expect(assumeHeaderValue([])).toBe('');
	});

	it('schickt die Auswahl als Liste', () => {
		expect(assumeHeaderValue(['LECTURER', 'ADMIN'])).toBe('LECTURER,ADMIN');
	});
});
