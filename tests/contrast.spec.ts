import AxeBuilder from '@axe-core/playwright';
import { test, expect, gotoRendered } from './fixtures';
import { THEME_COOKIE, THEMES } from '../src/lib/themes';

/**
 * Kontrast über **alle** angebotenen Themes.
 *
 * Die Prüfung in a11y.spec.ts sieht nur das Standard-Theme. Das genügt hier nicht: Kontrast
 * ist in dieser App keine Eigenschaft einer Komponente, sondern des Paares aus Komponente und
 * Theme. Zwölf Themes stehen zur Wahl, jedes bringt eigene Farbwerte mit, und ein Wert, der
 * auf `nord` bequem passt, kann auf `winter` durchfallen — gemessen: `base-content` bei 70 %
 * Deckkraft ergibt auf `nord` 4.59:1 und auf `winter` 3.87:1.
 *
 * Genau das hat die erste Fassung dieser Oberfläche verletzt, gleich zweifach:
 *
 *  1. Die gedämpften Töne lagen bei 35 % bis 70 % Deckkraft. Erst ab 80 % hält *jedes* Theme
 *     die 4.5:1 aus WCAG 1.4.3 ein, deshalb gibt es nur noch die Stufen 100/90/80.
 *  2. `text-error` und `text-warning` standen als Textfarbe auf `base-100`. Die semantischen
 *     daisyUI-Farben sind aber Hintergrundfarben — als Text erreichen sie auf den hellen
 *     Themes 1.35:1 bis 3.5:1. Als Badge-Hintergrund werden sie mit ihrer `*-content`-Farbe
 *     gepaart, und dieses Paar ist auf Kontrast ausgelegt.
 *
 * Die Hochschule ist eine öffentliche Stelle; BayEGovG und BITV 2.0 gelten. Ein Theme, das
 * die Anwendung unlesbar macht, ist deshalb kein Schönheitsfehler — und da die Themeliste
 * kuratiert ist, ist „dann nimm ein anderes" keine Antwort, sondern eine Einladung.
 */
test.describe('Kontrast über alle Themes', () => {
	for (const theme of THEMES) {
		test(`${theme.label} (${theme.value})`, async ({ page, context }) => {
			await context.addCookies([
				{ name: THEME_COOKIE, value: theme.value, url: 'http://localhost:4173' }
			]);

			await gotoRendered(page, '/');

			// Das Theme muss wirklich anliegen, sonst prüfen zwölf Tests zwölfmal dasselbe.
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme.value);

			const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

			expect(
				results.violations,
				results.violations
					.flatMap((v) =>
						v.nodes.map((n) => `${theme.value}: ${n.target.join(' ')}\n  ${n.failureSummary}`)
					)
					.join('\n')
			).toEqual([]);
		});
	}
});
