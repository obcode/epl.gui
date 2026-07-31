import { describe, expect, it } from 'vitest';
import { isActive, NAV_ITEMS } from './navigation';

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
