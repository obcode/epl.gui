import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, gotoRendered, openDropdown } from './fixtures';
import { THEME_COOKIE, THEMES } from '../src/lib/themes';

async function expectNoContrastViolations(page: Page, theme: string): Promise<void> {
	const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

	expect(
		results.violations,
		results.violations
			.flatMap((v) => v.nodes.map((n) => `${theme}: ${n.target.join(' ')}\n  ${n.failureSummary}`))
			.join('\n')
	).toEqual([]);
}

/**
 * Misst den Kontrast eines Elements gegen seinen eigenen Hintergrund selbst, nach WCAG 2.1.
 *
 * Warum von Hand und nicht mit axe: daisyUI legt auf den markierten Menüeintrag zusätzlich zur
 * Hintergrundfarbe ein `background-image` (`--fx-noise`, ein Data-URI-SVG). Für axe ist ein
 * Element mit Hintergrundbild nicht entscheidbar — die Regel meldet es als `incomplete`, nicht
 * als `violation`. Eine Prüfung auf `results.violations` ist an dieser Stelle also blind, und
 * zwar lautlos: sie bleibt grün, auch wenn dort dunkel auf dunkel steht. Genau das war der
 * Fall, und genau deshalb reicht die axe-Prüfung oben hier nicht.
 *
 * Die Farben werden über ein 1×1-Canvas nach sRGB aufgelöst statt aus dem Text von
 * `getComputedStyle` geparst: die Themes sind in `oklch` notiert, und die serialisierte
 * Rechenform ist je nach Farbraum `rgb()`, `oklch()` oder `color(...)`. Der Browser kann das
 * ohnehin besser umrechnen als ein regulärer Ausdruck.
 */
async function contrastRatio(page: Page, selector: string): Promise<number> {
	return page.locator(selector).evaluate((node) => {
		const toSrgb = (color: string): [number, number, number] => {
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = 1;
			const ctx = canvas.getContext('2d')!;
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, 1, 1);
			const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
			return [r, g, b];
		};

		const luminance = (rgb: [number, number, number]): number => {
			const [r, g, b] = rgb.map((channel) => {
				const s = channel / 255;
				return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};

		const style = getComputedStyle(node);
		const a = luminance(toSrgb(style.color));
		const b = luminance(toSrgb(style.backgroundColor));
		return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
	});
}

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

			await expectNoContrastViolations(page, theme.value);
		});
	}
});

/**
 * Dieselbe Prüfung mit **offenen** Menüs — und das ist keine Fleißaufgabe.
 *
 * a11y.spec.ts klappt die beiden Menüs auf, aber nur im Standard-Theme; contrast.spec.ts
 * durchläuft alle zwölf Themes, sah sie aber nur zugeklappt. In der Lücke dazwischen lag ein
 * echter Befund: der markierte Eintrag (die aktuelle Seite in der Bereichsnavigation, das
 * gewählte Theme in der Designwahl) bekommt von daisyUI `neutral` als Hintergrund. Der
 * Menü-Kontrast-Block in app.css drehte die Vordergrundfarbe pauschal auf `base-content`
 * zurück — auf `nord` unauffällig, weil dort beides hell auf dunkel ist, und auf **allen
 * hellen Themes** dunkel auf dunkel, also unlesbar.
 *
 * Der markierte Eintrag ist genau die Stelle, an der man sich verortet. Unterhalb von 1024px
 * läuft außerdem die gesamte Navigation über dieses Menü.
 *
 * Die axe-Prüfung allein hätte den Befund **nicht** gefunden, auch mit offenem Menü nicht:
 * daisyUI legt auf den markierten Eintrag ein `background-image`, und damit meldet axe ihn als
 * `incomplete` statt als `violation`. Deshalb misst `contrastRatio()` hier zusätzlich selbst —
 * siehe die Begründung dort. Nachgestellt: mit dem alten app.css blieben alle zwölf
 * axe-Läufe grün, während der Eintrag auf den hellen Themes unlesbar war.
 */
test.describe('Kontrast bei offenen Menüs, über alle Themes', () => {
	for (const theme of THEMES) {
		test(`${theme.label} (${theme.value})`, async ({ page, context }) => {
			await context.addCookies([
				{ name: THEME_COOKIE, value: theme.value, url: 'http://localhost:4173' }
			]);

			// Unter lg trägt der Hamburger die Navigation, und dort ist auf `/` der Eintrag
			// „Start" markiert — der Fall, um den es geht. Die Designwahl bringt ihren
			// markierten Eintrag auf jeder Breite mit.
			await page.setViewportSize({ width: 375, height: 812 });
			await gotoRendered(page, '/');
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme.value);

			await openDropdown(page, 'Bereiche');
			await expect(page.getByRole('link', { name: /Start/ })).toHaveClass(/menu-active/);
			await expectNoContrastViolations(page, `${theme.value}, Bereichsmenü`);
			expect(
				await contrastRatio(page, '.dropdown-content a.menu-active'),
				`${theme.value}: die aktuelle Seite im Bereichsmenü`
			).toBeGreaterThanOrEqual(4.5);

			// Erst schließen, sonst überlagern sich zwei offene Menüs und axe misst durch das
			// verdeckte hindurch. daisyUI hält ein Dropdown über den Fokus offen — `blur()` ist
			// also das, was es schließt, nicht ein Klick daneben (der ginge ins offene Menü).
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

			// Nicht `/Design/` wie in a11y.spec.ts: dort wird bei Desktopbreite geprüft, hier bei
			// 375px. Das Label „Design" ist unter `sm` ausgeblendet, und damit ist der
			// zugängliche Name des Auslösers nicht mehr sein Inhalt, sondern sein `title`.
			await openDropdown(page, /Design|Darstellung wählen/);
			await expectNoContrastViolations(page, `${theme.value}, Designwahl`);
			expect(
				await contrastRatio(page, '.dropdown-content button.menu-active'),
				`${theme.value}: das gewählte Theme in der Designwahl`
			).toBeGreaterThanOrEqual(4.5);
		});
	}
});
