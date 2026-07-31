import AxeBuilder from '@axe-core/playwright';
import { test, expect, KNOWN_A11Y_DEBT, PERSONAS, gotoRendered } from './fixtures';

/**
 * Barrierefreiheit, automatisiert geprüft.
 *
 * Die Hochschule ist eine öffentliche Stelle — BayEGovG und BITV 2.0 gelten, das ist keine
 * Kür. Und diese Prüfung gehört an den Anfang: axe findet Kontrast- und Rollenfehler, die
 * einzeln je zwei Minuten kosten und in einer fertigen Oberfläche mit sieben Bereichen ein
 * eigenes Projekt werden.
 *
 * Automatisierte Prüfung fängt ungefähr ein Drittel der realen Probleme. Sie ersetzt keinen
 * Tastaturdurchlauf — deshalb steht dieser hier daneben und nicht anstelle.
 */
test.describe('Barrierefreiheit', () => {
	test('Startseite, anonym', async ({ page, checkA11y }) => {
		await gotoRendered(page, '/');
		await checkA11y(page);
	});

	test('Startseite, angemeldet', async ({ asPersona, checkA11y }) => {
		// Angemeldet ist ein anderes Markup: die Identität in der Leiste, andere Karteninhalte.
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/');
		await checkA11y(page);
	});

	test('mit offenem Theme-Menü', async ({ page, checkA11y }) => {
		// Dropdowns sind der klassische Fundort: ein `tabindex` auf einem nicht-interaktiven
		// Element, ein fehlendes `aria-label`. Zugeklappt prüft axe das Menü gar nicht.
		await gotoRendered(page, '/');
		await page.getByRole('button', { name: /Design/ }).click();
		await checkA11y(page);
	});

	test('mobil, mit offenem Bereichsmenü', async ({ page, checkA11y }) => {
		// Unter 768px trägt der Hamburger die Navigation. Das ist anderes Markup als die
		// Leiste darüber und wird von der Desktop-Prüfung nie angefasst.
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoRendered(page, '/');
		await page.getByRole('button', { name: 'Bereiche' }).click();
		await checkA11y(page);
	});

	// Für jede Regel aus KNOWN_A11Y_DEBT ein eigener Test, damit die offene Stelle namentlich
	// in jedem Bericht auftaucht. `fixme` heißt: bekannt, nicht behoben, blockiert nicht —
	// im Gegensatz zu `skip`, das auch für "läuft hier nicht" steht und deshalb übersehen wird.
	//
	// Wer das repariert, entfernt den Eintrag aus KNOWN_A11Y_DEBT und dieses `fixme`; ab dann
	// bewacht die reguläre Prüfung die Regel mit.
	for (const rule of KNOWN_A11Y_DEBT) {
		test(`offen: ${rule}`, async ({ page }) => {
			test.fixme(
				true,
				`${rule} ist auf der Startseite verletzt. Bei color-contrast betrifft das die ` +
					`Statustöne text-base-content/60, /45 und /35 aus CLAUDE.md — eine ` +
					`Entscheidung über die Design-Tokens, keine einzelne kaputte Stelle.`
			);

			await gotoRendered(page, '/');
			const results = await new AxeBuilder({ page }).withRules([rule]).analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('die Seite ist per Tastatur bedienbar', async ({ page }) => {
		await gotoRendered(page, '/');

		// Kein axe-Thema: axe prüft Markup, nicht Fokusreihenfolge. Hier geht es nur um die
		// Grundzusicherung, dass Tab überhaupt irgendwo landet und nicht in einer Falle endet.
		await page.keyboard.press('Tab');

		const focused = await page.evaluate(() => {
			const el = document.activeElement;
			return el ? `${el.tagName.toLowerCase()}` : null;
		});

		test.expect(focused, 'nach dem ersten Tab ist nichts fokussiert').not.toBe(null);
		test.expect(focused).not.toBe('body');
	});
});
