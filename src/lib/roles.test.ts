import { describe, expect, it } from 'vitest';
import {
	ALL_ROLES,
	ROLE_HINTS,
	ROLE_LABELS,
	displayName,
	mayPreviewRoles,
	roleLabel,
	sortRoles
} from './roles';

describe('ROLE_LABELS', () => {
	it('übersetzt jede Rolle, die es gibt', () => {
		// Die Zuordnung Englisch → Fakultätssprache steht an genau zwei Stellen: im
		// Doc-Kommentar von policy.Role und hier. Eine fehlende Übersetzung würde in der
		// Oberfläche als LECTURER auftauchen, was für niemanden ein Wort ist.
		for (const role of ALL_ROLES) {
			expect(ROLE_LABELS[role], role).toBeTruthy();
			expect(ROLE_HINTS[role], role).toBeTruthy();
		}
	});

	it('lässt eine unbekannte Rolle unübersetzt durch, statt sie zu verschlucken', () => {
		// Wenn das Backend eine Rolle bekommt, die diese Version der GUI noch nicht kennt, ist
		// sie roh anzuzeigen besser als sie wegzulassen: eine Verwaltung, die eine vergebene
		// Rolle nicht anzeigt, behauptet, jemand habe sie nicht.
		expect(roleLabel('FUTURE_ROLE')).toBe('FUTURE_ROLE');
	});
});

describe('sortRoles', () => {
	it('sortiert in die Reihenfolge von ALL_ROLES', () => {
		expect(sortRoles(['ADMIN', 'LECTURER', 'DEANS_OFFICE'])).toEqual([
			'LECTURER',
			'DEANS_OFFICE',
			'ADMIN'
		]);
	});

	it('hängt Unbekanntes hinten an, statt es zu verlieren', () => {
		expect(sortRoles(['FUTURE_ROLE', 'LECTURER'])).toEqual(['LECTURER', 'FUTURE_ROLE']);
	});
});

describe('displayName', () => {
	it('zeigt die Adresse, solange kein Name da ist', () => {
		// Der Normalfall und kein Fehler: angelegt wird mit der Adresse allein, weil sie das
		// Einzige ist, was stimmen muss. Einen Namen aus ihr abzuleiten würde raten, wie Leute
		// sich selbst schreiben, und läge bei jedem Titel und jedem Umlaut daneben.
		expect(displayName({ mail: 'prof.eins@example.org', name: '' })).toBe('prof.eins@example.org');
		expect(displayName({ mail: 'prof.eins@example.org', name: null })).toBe(
			'prof.eins@example.org'
		);
		expect(displayName({ mail: 'prof.eins@example.org', name: '   ' })).toBe(
			'prof.eins@example.org'
		);
	});

	it('zeigt den Namen, sobald es einen gibt', () => {
		expect(displayName({ mail: 'prof.eins@example.org', name: 'Prof. Eins' })).toBe('Prof. Eins');
	});
});

describe('mayPreviewRoles', () => {
	it('bietet die Vorschau nur der Administration an', () => {
		// Nicht aus Sicherheitsgründen — die Verengung kann per Konstruktion nichts hinzufügen.
		// Eine Studiengangsleitung hält zwei Rollen und hat trotzdem keinen Anlass, einen Knopf
		// zu sehen, der ihren Bedarfsbereich verschwinden lässt.
		expect(mayPreviewRoles(['LECTURER'])).toBe(false);
		expect(mayPreviewRoles(['LECTURER', 'PROGRAMME_LEAD'])).toBe(false);
		expect(mayPreviewRoles(['DEANS_OFFICE', 'LECTURER'])).toBe(false);
		expect(mayPreviewRoles(['ADMIN'])).toBe(true);
		expect(mayPreviewRoles(['LECTURER', 'ADMIN'])).toBe(true);
	});

	it('fragt die gehaltenen Rollen, nicht die effektiven', () => {
		// Der Punkt der Signatur: eine Administration, die sich gerade auf LECTURER verengt
		// hat, wirkt nicht mehr als ADMIN — hielte man sich an die effektiven Rollen, wäre das
		// Menü genau dann weg, wenn man es zum Zurückkommen braucht.
		const granted = ['LECTURER', 'ADMIN'];
		const effectiveWhileNarrowed = ['LECTURER'];

		expect(mayPreviewRoles(granted)).toBe(true);
		expect(mayPreviewRoles(effectiveWhileNarrowed)).toBe(false);
	});
});
