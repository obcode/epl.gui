import { test, expect, gotoRendered } from './fixtures';

/**
 * Tablet-first, wie in CLAUDE.md festgelegt: ab 768px voll benutzbar, bei 375px sauber.
 *
 * Der Fehler, den das fängt, ist immer derselbe und immer unsichtbar auf dem Rechner, auf dem
 * er entsteht: eine breite Tabelle oder eine lange Zeile schiebt den Body über den Viewport
 * hinaus. Auf einem Desktop-Monitor merkt das niemand; auf dem Tablet in der Sitzung, in der
 * die Zuteilung besprochen wird, wackelt die ganze Seite horizontal.
 */
/**
 * `known` markiert die Breiten, die aktuell überlaufen — bekannt, nicht behoben, blockiert
 * nicht. Der Test bleibt stehen und läuft als `fixme` durch den Bericht, statt gelöscht oder
 * auf einen bequemen Wert gelockert zu werden.
 *
 * Der Befund: bei 768px ist die Seite 883px breit, bei 1024px 1117px. Die Bereichsleiste
 * schaltet auf `md:` (768px) auf sieben nebeneinanderstehende Einträge um und passt dort nicht
 * — ausgerechnet an der Breite, ab der CLAUDE.md volle Benutzbarkeit zusagt. Bei 375px trägt
 * der Hamburger, bei 1440px ist genug Platz; deshalb fällt es genau dazwischen auf.
 *
 * Die Behebung ist eine Entscheidung: Umschaltpunkt auf `lg:` schieben (Tablet bekommt den
 * Hamburger), die Leiste in einen eigenen `overflow-x-auto` legen, oder weniger Einträge
 * zeigen. Alle drei sind vertretbar, keine ist die offensichtliche.
 */
const VIEWPORTS = [
	{ name: 'Handy', width: 375, height: 812, known: false },
	{ name: 'Tablet hochkant', width: 768, height: 1024, known: true },
	{ name: 'Tablet quer', width: 1024, height: 768, known: true },
	{ name: 'Desktop', width: 1440, height: 900, known: false }
] as const;

test.describe('Darstellung über Breiten', () => {
	for (const viewport of VIEWPORTS) {
		test(`${viewport.name} (${viewport.width}px) scrollt nicht horizontal`, async ({ page }) => {
			test.fixme(
				viewport.known,
				`Die Bereichsleiste läuft bei ${viewport.width}px über — sie schaltet auf md: ` +
					`(768px) auf sieben nebeneinanderstehende Einträge um und passt dort nicht.`
			);

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

	test('unter 768px trägt der Hamburger die Navigation', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await gotoRendered(page, '/');

		const burger = page.getByRole('button', { name: 'Bereiche' });
		await expect(burger).toBeVisible();

		await burger.click();
		await expect(page.getByRole('banner').getByRole('list').last()).toBeVisible();
	});

	test('ab 768px steht die Bereichsleiste nebeneinander', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoRendered(page, '/');

		// Umgekehrte Richtung: der Hamburger verschwindet. Ohne diese Hälfte wäre ein Layout,
		// das beide Varianten gleichzeitig zeigt, für den Test in Ordnung.
		await expect(page.getByRole('button', { name: 'Bereiche' })).toBeHidden();
	});
});
