import { describe, expect, it } from 'vitest';
import { ACCOUNT_ITEMS, isActive, NAV_ITEMS, visibleNavItems } from './navigation';

describe('isActive', () => {
	it('marks the start page only on exactly /', () => {
		const start = { emoji: '🏠', label: 'Start', href: '/' as const, hint: '' };
		expect(isActive(start, '/')).toBe(true);
		expect(isActive(start, '/module')).toBe(false);
	});

	it('never marks areas that have no route', () => {
		expect(isActive({ emoji: '📚', label: 'Module', hint: '' }, '/module')).toBe(false);
	});
});

describe('NAV_ITEMS', () => {
	it('has an emoji and a hint for every entry', () => {
		for (const item of NAV_ITEMS) {
			expect(item.emoji, item.label).not.toBe('');
			expect(item.hint, item.label).not.toBe('');
		}
	});

	it('uses every label only once', () => {
		const labels = NAV_ITEMS.map((i) => i.label);
		expect(new Set(labels).size).toBe(labels.length);
	});
});

describe('ACCOUNT_ITEMS', () => {
	it('has a destination for every entry', () => {
		// Unlike NAV_ITEMS there are no "still to come" entries here: the account menu shows tools
		// that exist, and a dead entry in it would just be a click into nothing.
		for (const item of ACCOUNT_ITEMS) {
			expect(item.href).toBeTruthy();
			expect(item.hint).toBeTruthy();
		}
	});

	it('does not overlap with the area bar', () => {
		// Two ways to the same destination in one navigation means one of them looks wrong as
		// soon as the other is marked active.
		const areas = new Set(NAV_ITEMS.map((item) => item.href).filter(Boolean));
		for (const item of ACCOUNT_ITEMS) {
			expect(areas.has(item.href)).toBe(false);
		}
	});

	it('marks sub-pages as active', () => {
		const tokens = ACCOUNT_ITEMS.find((item) => item.href === '/konto/tokens')!;
		expect(isActive(tokens, '/konto/tokens')).toBe(true);

		const api = ACCOUNT_ITEMS.find((item) => item.href === '/api-doku')!;
		expect(isActive(api, '/api-doku/schema')).toBe(true);
		expect(isActive(api, '/')).toBe(false);
	});
});

describe('visibleNavItems', () => {
	it('shows entries with no role requirement to everybody', () => {
		const items = [{ emoji: '🏠', label: 'Start', href: '/' as const, hint: 'x' }];
		expect(visibleNavItems(items, [])).toEqual(items);
	});

	it('hides what the role is missing for', () => {
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

	it('accepts any one of the named roles', () => {
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

	it('shows the administration area to administrators only', () => {
		// Cosmetic, not a lock — that is in policy.MayAdministerPeople and applies to the token
		// door too. Checked anyway: somebody who sees the entry and gets a refusal on every click
		// learns to ignore refusals.
		const labels = (roles: string[]) => visibleNavItems(ACCOUNT_ITEMS, roles).map((i) => i.label);
		expect(labels(['LECTURER'])).not.toContain('Verwaltung');
		expect(labels(['ADMIN'])).toContain('Verwaltung');
	});
});
