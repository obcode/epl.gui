import { describe, expect, it } from 'vitest';
import { resolveTheme, SYSTEM_THEME, themeAttribute, THEMES } from './themes';

describe('resolveTheme', () => {
	it('accepts a known theme name', () => {
		expect(resolveTheme('dracula')).toBe('dracula');
	});

	it('falls back to the system setting without a cookie', () => {
		expect(resolveTheme(undefined)).toBe(SYSTEM_THEME);
		expect(resolveTheme(null)).toBe(SYSTEM_THEME);
		expect(resolveTheme('')).toBe(SYSTEM_THEME);
	});

	// The resolved value is written into the <html> tag without escaping. The allowlist is
	// therefore the only boundary between a self-set cookie and the markup — were it a regex or
	// an escaper, this would be an injection point.
	it('rejects everything that is not on the list', () => {
		expect(resolveTheme('gibtsnicht')).toBe(SYSTEM_THEME);
		expect(resolveTheme('nord" onload="alert(1)')).toBe(SYSTEM_THEME);
		expect(resolveTheme(SYSTEM_THEME)).toBe(SYSTEM_THEME);
	});
});

describe('themeAttribute', () => {
	it('produces data-theme for a choice that was made', () => {
		expect(themeAttribute('nord')).toBe('data-theme="nord"');
	});

	// Not `data-theme=""`: daisyUI only evaluates --default and --prefersdark when the attribute
	// is absent entirely. An empty attribute would sit silently on the fallback.
	it('omits the attribute entirely for the system setting', () => {
		expect(themeAttribute(SYSTEM_THEME)).toBe('');
	});
});

describe('THEMES', () => {
	it('contains light and dark themes', () => {
		expect(THEMES.some((t) => t.dark)).toBe(true);
		expect(THEMES.some((t) => !t.dark)).toBe(true);
	});

	it('has no duplicate values', () => {
		const values = THEMES.map((t) => t.value);
		expect(new Set(values).size).toBe(values.length);
	});
});
