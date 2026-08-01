import { describe, expect, it } from 'vitest';
import { ACCOUNT_ITEMS, isActive, NAV_ITEMS, visibleNavItems } from './navigation';

describe('isActive', () => {
	it('markiert die Startseite nur bei genau /', () => {
		const start = { emoji: '🏠', label: 'Start', href: '/' as const, hint: '' };
		expect(isActive(start, '/')).toBe(true);
		expect(isActive(start, '/module')).toBe(false);
	});

	it('markiert Bereiche ohne Route nie', () => {
		expect(isActive({ emoji: '📚', label: 'Module', hint: '' }, '/module')).toBe(false);
	});
});

describe('NAV_ITEMS', () => {
	it('hat zu jedem Eintrag ein Emoji und einen Hinweis', () => {
		for (const item of NAV_ITEMS) {
			expect(item.emoji, item.label).not.toBe('');
			expect(item.hint, item.label).not.toBe('');
		}
	});

	it('vergibt jedes Label nur einmal', () => {
		const labels = NAV_ITEMS.map((i) => i.label);
		expect(new Set(labels).size).toBe(labels.length);
	});
});

describe('ACCOUNT_ITEMS', () => {
	it('hat für jeden Eintrag ein Ziel', () => {
		// Anders als bei NAV_ITEMS gibt es hier keine „entsteht noch"-Einträge: das Kontomenü
		// zeigt Werkzeuge, die es gibt, und ein toter Eintrag darin wäre nur ein Klick ins
		// Leere.
		for (const item of ACCOUNT_ITEMS) {
			expect(item.href).toBeTruthy();
			expect(item.hint).toBeTruthy();
		}
	});

	it('überschneidet sich nicht mit der Bereichsleiste', () => {
		// Zwei Wege zum selben Ziel in einer Navigation heißt, dass einer von beiden falsch
		// aussieht, sobald einer aktiv markiert ist.
		const areas = new Set(NAV_ITEMS.map((item) => item.href).filter(Boolean));
		for (const item of ACCOUNT_ITEMS) {
			expect(areas.has(item.href)).toBe(false);
		}
	});

	it('markiert Unterseiten als aktiv', () => {
		const tokens = ACCOUNT_ITEMS.find((item) => item.href === '/konto/tokens')!;
		expect(isActive(tokens, '/konto/tokens')).toBe(true);

		const api = ACCOUNT_ITEMS.find((item) => item.href === '/api-doku')!;
		expect(isActive(api, '/api-doku/schema')).toBe(true);
		expect(isActive(api, '/')).toBe(false);
	});
});

describe('visibleNavItems', () => {
	it('zeigt Einträge ohne Rollenangabe allen', () => {
		const items = [{ emoji: '🏠', label: 'Start', href: '/' as const, hint: 'x' }];
		expect(visibleNavItems(items, [])).toEqual(items);
	});

	it('blendet aus, wofür die Rolle fehlt', () => {
		const items = [
			{ emoji: '📊', label: 'Statistik', hint: 'x', roles: ['DEANS_OFFICE'] as const },
			{ emoji: '✋', label: 'Wünsche', hint: 'x' }
		];
		expect(visibleNavItems(items, ['LECTURER']).map((i) => i.label)).toEqual(['Wünsche']);
		expect(visibleNavItems(items, ['DEANS_OFFICE']).map((i) => i.label)).toEqual([
			'Statistik',
			'Wünsche'
		]);
	});

	it('reicht eine der genannten Rollen', () => {
		const items = [
			{
				emoji: '🧩',
				label: 'Zuteilung',
				hint: 'x',
				roles: ['SUBJECT_GROUP_LEAD', 'PROGRAMME_LEAD', 'DEANS_OFFICE'] as const
			}
		];
		expect(visibleNavItems(items, ['PROGRAMME_LEAD'])).toHaveLength(1);
	});

	it('zeigt die Verwaltung nur der Administration', () => {
		// Kosmetik, kein Riegel — der steht in policy.MayAdministerPeople und gilt auch für die
		// Token-Tür. Trotzdem geprüft: wer den Eintrag sieht und bei jedem Klick eine Ablehnung
		// bekommt, lernt, Ablehnungen zu ignorieren.
		const labels = (roles: string[]) => visibleNavItems(ACCOUNT_ITEMS, roles).map((i) => i.label);
		expect(labels(['LECTURER'])).not.toContain('Verwaltung');
		expect(labels(['ADMIN'])).toContain('Verwaltung');
	});
});
