import { describe, expect, it } from 'vitest';
import { resolveTheme, SYSTEM_THEME, themeAttribute, THEMES } from './themes';

describe('resolveTheme', () => {
	it('nimmt einen bekannten Themenamen an', () => {
		expect(resolveTheme('dracula')).toBe('dracula');
	});

	it('fällt ohne Cookie auf die Systemeinstellung zurück', () => {
		expect(resolveTheme(undefined)).toBe(SYSTEM_THEME);
		expect(resolveTheme(null)).toBe(SYSTEM_THEME);
		expect(resolveTheme('')).toBe(SYSTEM_THEME);
	});

	// Der aufgelöste Wert wird ohne Escaping in das <html>-Tag geschrieben. Die Allowlist ist
	// damit die einzige Grenze zwischen einem selbst gesetzten Cookie und dem Markup — wäre
	// sie ein Regex oder ein Escaper, wäre das hier eine Injektionsstelle.
	it('weist alles ab, was nicht in der Liste steht', () => {
		expect(resolveTheme('gibtsnicht')).toBe(SYSTEM_THEME);
		expect(resolveTheme('nord" onload="alert(1)')).toBe(SYSTEM_THEME);
		expect(resolveTheme(SYSTEM_THEME)).toBe(SYSTEM_THEME);
	});
});

describe('themeAttribute', () => {
	it('erzeugt data-theme für eine getroffene Wahl', () => {
		expect(themeAttribute('nord')).toBe('data-theme="nord"');
	});

	// Nicht `data-theme=""`: daisyUI wertet --default und --prefersdark nur aus, wenn das
	// Attribut ganz fehlt. Ein leeres Attribut bliebe stumm auf dem Fallback stehen.
	it('lässt das Attribut bei der Systemeinstellung ganz weg', () => {
		expect(themeAttribute(SYSTEM_THEME)).toBe('');
	});
});

describe('THEMES', () => {
	it('enthält helle und dunkle Themes', () => {
		expect(THEMES.some((t) => t.dark)).toBe(true);
		expect(THEMES.some((t) => !t.dark)).toBe(true);
	});

	it('hat keine doppelten Werte', () => {
		const values = THEMES.map((t) => t.value);
		expect(new Set(values).size).toBe(values.length);
	});
});
