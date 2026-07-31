import { test, expect, gotoRendered, openDropdown } from './fixtures';

/**
 * Tablet-first, wie in CLAUDE.md festgelegt: ab 768px voll benutzbar, bei 375px sauber.
 *
 * Der Fehler, den das fängt, ist immer derselbe und immer unsichtbar auf dem Rechner, auf dem
 * er entsteht: eine breite Tabelle oder eine lange Zeile schiebt den Body über den Viewport
 * hinaus. Auf einem Desktop-Monitor merkt das niemand; auf dem Tablet in der Sitzung, in der
 * die Zuteilung besprochen wird, wackelt die ganze Seite horizontal.
 */
/**
 * Die Breiten, an denen gemessen wird. Keine Ausnahmen mehr: der Überlauf, den dieser Test
 * bei seinem ersten Lauf gefunden hat, ist behoben.
 *
 * Der Befund war echt — 883px bei 768px Viewport, 1117px bei 1024px. Die Bereichsleiste
 * schaltete auf `md:` (768px) auf sieben nebeneinanderstehende Einträge um und passte dort
 * nicht, ausgerechnet ab der Breite, an der CLAUDE.md volle Benutzbarkeit zusagt. Bei 375px
 * trug der Hamburger, bei 1440px war Platz genug; deshalb fiel es genau dazwischen auf.
 *
 * Behoben durch zwei Änderungen in NavBar.svelte, die zusammengehören: die Leiste schaltet
 * erst ab `lg` (1024px) um, und der Marken-Untertitel erst ab `xl`. Die erste allein genügt
 * nicht — `lg` bedeutet *ab* 1024px, also zeigt sich die Leiste bei genau 1024 und braucht
 * dort weiterhin 1117px. Erst der Platz aus dem zweiten Schritt bringt sie unter.
 */
const VIEWPORTS = [
	{ name: 'Handy', width: 375, height: 812 },
	{ name: 'Tablet hochkant', width: 768, height: 1024 },
	{ name: 'Tablet quer', width: 1024, height: 768 },
	{ name: 'Desktop', width: 1440, height: 900 }
] as const;

test.describe('Darstellung über Breiten', () => {
	for (const viewport of VIEWPORTS) {
		test(`${viewport.name} (${viewport.width}px) scrollt nicht horizontal`, async ({ page }) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await gotoRendered(page, '/');

			const overflow = await page.evaluate(() => {
				const el = document.documentElement;
				return { scroll: el.scrollWidth, client: el.clientWidth };
			});

			// Ein Pixel Toleranz für Subpixel-Rundung bei fraktionalen Layoutbreiten.
			expect(
				overflow.scroll,
				`Die Seite ist ${overflow.scroll}px breit bei ${overflow.client}px Viewport — ` +
					`etwas darin hat keine Breitenbegrenzung. Breite Inhalte gehören in einen ` +
					`eigenen overflow-x-auto-Container, nicht in den Body.`
			).toBeLessThanOrEqual(overflow.client + 1);
		});
	}

	test('unter 1024px trägt der Hamburger die Navigation', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoRendered(page, '/');

		await expect(page.getByRole('button', { name: 'Bereiche' })).toBeVisible();

		await openDropdown(page, 'Bereiche');
		await expect(page.getByRole('banner').getByRole('list').last()).toBeVisible();
	});

	test('ab 1024px steht die Bereichsleiste nebeneinander', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await gotoRendered(page, '/');

		// Umgekehrte Richtung: der Hamburger verschwindet. Ohne diese Hälfte wäre ein Layout,
		// das beide Varianten gleichzeitig zeigt, für den Test in Ordnung.
		await expect(page.getByRole('button', { name: 'Bereiche' })).toBeHidden();
	});
});
