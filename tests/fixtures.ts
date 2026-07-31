import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Die Personen, mit denen die E2E-Tests arbeiten.
 *
 * Namensgleich mit `internal/testdata` im Backend, damit ein Szenario in beiden Repos
 * dieselbe Besetzung hat: wer im Go-Test die Eigentümerin des Wunsches ist, ist es hier auch.
 * Ohne das liest man einen fehlgeschlagenen E2E-Test und muss erst rekonstruieren, welche
 * Adresse eigentlich die interessante war.
 *
 * Alles erfunden, alles unter `example.org` (RFC 2606). Dieses Repo ist öffentlich — hier
 * steht nie der Name einer echten Kollegin.
 */
export const PERSONAS = {
	/** Eigentümerin des Datensatzes, für den getestet wird. */
	eins: { mail: 'prof.eins@example.org', name: 'Prof. Eins' },
	/** Unbeteiligte Kollegin — die Person, vor der die Wunsch-Vertraulichkeit schützt. */
	zwei: { mail: 'prof.zwei@example.org', name: 'Prof. Zwei' },
	/** Planerin: sieht Wünsche vor der Veröffentlichung, weil der Prozess es verlangt. */
	vier: { mail: 'prof.vier@example.org', name: 'Prof. Vier' }
} as const;

export type Persona = (typeof PERSONAS)[keyof typeof PERSONAS];

type Fixtures = {
	/**
	 * Meldet den Browser-Kontext als diese Person an.
	 *
	 * Setzt `X-Remote-User` so, wie es in der Produktion **Caddy → oauth2-proxy** tut. Der
	 * Test spielt hier den Proxy, nicht den Client: eingehende `X-Remote-*` verwirft Caddy,
	 * ein Browser kann sich damit also nicht selbst anmelden. Genau deshalb steht der Header
	 * in einer Fixture und nicht verstreut in den Specs — sonst liest sich irgendwann
	 * jemand zusammen, dass die GUI Identität vom Client entgegennimmt.
	 */
	asPersona: (persona: Persona) => Promise<Page>;

	/** Barrierefreiheitsprüfung für die aktuelle Seite. */
	checkA11y: (page: Page) => Promise<void>;
};

/**
 * Regeln, die aktuell verletzt werden und deshalb nicht blockieren.
 *
 * Diese Liste ist eine Schuld, keine Konfiguration. Sie steht hier, damit die übrigen rund
 * neunzig axe-Regeln überhaupt scharf sein können — ohne sie wäre die einzige Alternative,
 * die Prüfung ganz abzuschalten, und dann fiele auch jede *neue* Verletzung unter den Tisch.
 *
 * Jeder Eintrag braucht eine Begründung und gehört wieder entfernt, sobald er behoben ist.
 * `tests/a11y.spec.ts` führt für jeden Eintrag zusätzlich einen eigenen, als `fixme`
 * markierten Test — so taucht die offene Stelle in jedem Bericht namentlich auf, statt
 * lautlos zu verschwinden.
 *
 * - `color-contrast`: die Statustöne aus CLAUDE.md (`text-base-content/60`, `/45`, `/35`)
 *   unterschreiten auf mehreren daisyUI-Themes das 4.5:1 aus WCAG 1.4.3. Das ist keine
 *   einzelne kaputte Stelle, sondern eine Entscheidung über die Design-Tokens — und die
 *   gehört getroffen, nicht von einem Test erzwungen.
 */
export const KNOWN_A11Y_DEBT = ['color-contrast'] as const;

export const test = base.extend<Fixtures>({
	asPersona: async ({ browser }, use) => {
		const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];

		await use(async (persona: Persona) => {
			const context = await browser.newContext({
				extraHTTPHeaders: {
					'X-Remote-User': persona.mail,
					'X-Remote-Displayname': persona.name
				}
			});
			contexts.push(context);
			return context.newPage();
		});

		for (const context of contexts) {
			await context.close();
		}
	},

	// Playwright liest die Fixture-Abhängigkeiten aus dem Destrukturierungsmuster des ersten
	// Parameters und lehnt alles andere ab — ein benannter Parameter ist hier ein Laufzeit-
	// fehler, kein Stilfrage. Diese Fixture braucht keine Abhängigkeiten, also bleibt das
	// Muster leer.
	// eslint-disable-next-line no-empty-pattern
	checkA11y: async ({}, use) => {
		await use(async (page: Page) => {
			const results = await new AxeBuilder({ page })
				// WCAG 2.1 AA. Die Hochschule ist eine öffentliche Stelle: Barrierefreiheit ist
				// hier keine Kür, sondern BayEGovG/BITV — und im Nachhinein nachzurüsten ist
				// deutlich teurer, als es von Anfang an im Gate zu haben.
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.disableRules([...KNOWN_A11Y_DEBT])
				.analyze();

			expect(
				results.violations,
				// Die Standardmeldung ist ein Objekt-Dump. Diese Zusammenfassung sagt, welche
				// Regel wo verletzt ist — der Unterschied zwischen "CI ist rot" und "ich weiß,
				// was ich reparieren muss".
				results.violations
					.map(
						(v) =>
							`${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`
					)
					.join('\n')
			).toEqual([]);
		});
	}
});

export { expect };

/**
 * Wartet, bis die Seite serverseitig gerendert ist.
 *
 * `waitForLoadState('networkidle')` wäre das Naheliegende und ist hier falsch: die App hat
 * keine Hintergrund-Requests, `networkidle` wartet also nur eine feste Zeit ab und macht die
 * Suite langsam, ohne etwas zu garantieren.
 */
export async function gotoRendered(page: Page, path: string): Promise<void> {
	await page.goto(path, { waitUntil: 'domcontentloaded' });
	await page.locator('main').waitFor({ state: 'visible' });
}
