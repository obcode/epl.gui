import { test, expect, PERSONAS, gotoRendered } from './fixtures';

/**
 * Die Identitätsweitergabe — der eine Mechanismus, den nur ein E2E-Test prüfen kann.
 *
 * Der SSR-Prozess spricht containerintern mit dem Backend und umgeht dabei den Auth-Proxy.
 * Das Backend sieht also kein `X-Remote-User`, wenn die GUI es nicht selbst mitschickt. Das
 * passiert in `src/lib/server/backend.ts` über AsyncLocalStorage, gesetzt einmal in
 * `hooks.server.ts` — bewusst nicht durch jede `load()`-Signatur gefädelt, weil eine
 * vergessene Stelle ein stiller Autorisierungsfehler wäre.
 *
 * "Still" ist hier das Problem: fällt die Weitergabe aus, wird jede Seite als anonym gerendert
 * und sieht dabei völlig normal aus. Ein Unit-Test auf `backendClient()` beweist nur, dass die
 * Funktion Header baut — nicht, dass der Request sie auch trägt.
 */
test.describe('Identität', () => {
	test('ohne Proxy-Header ist der Zugriff anonym', async ({ page }) => {
		await gotoRendered(page, '/');

		await expect(page.getByText(/Kein\s+X-Remote-User\s+gesetzt/)).toBeVisible();
	});

	test('der vom Proxy gesetzte Nutzer erscheint auf der Seite', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/');

		await expect(page.getByText(PERSONAS.eins.mail)).toBeVisible();
		await expect(page.getByText(/Kein\s+X-Remote-User/)).toHaveCount(0);
	});

	test('zwei Personen sehen ihre eigene Identität, nicht die der anderen', async ({
		asPersona
	}) => {
		// Zwei Kontexte parallel. Der Fehler, den das fängt, ist ein pro Prozess statt pro
		// Request gehaltener Zustand — der AsyncLocalStorage ist genau die Konstruktion, bei
		// der das schiefgehen kann, und unter Last würde es sich als vertauschte Identität
		// zeigen. In diesem Projekt heißt das: jemand sieht die Wünsche einer anderen Person.
		const [eins, zwei] = await Promise.all([asPersona(PERSONAS.eins), asPersona(PERSONAS.zwei)]);

		await Promise.all([gotoRendered(eins, '/'), gotoRendered(zwei, '/')]);

		await expect(eins.getByText(PERSONAS.eins.mail)).toBeVisible();
		await expect(eins.getByText(PERSONAS.zwei.mail)).toHaveCount(0);

		await expect(zwei.getByText(PERSONAS.zwei.mail)).toBeVisible();
		await expect(zwei.getByText(PERSONAS.eins.mail)).toHaveCount(0);
	});

	test('ein vom Client mitgeschickter Authorization-Header wird nicht weitergereicht', async ({
		browser
	}) => {
		// `backendClient()` baut seine Header von Grund auf neu. Würde es stattdessen die des
		// eingehenden Requests kopieren, könnte ein Browser sein eigenes Bearer-Token an das
		// Backend durchreichen — und damit an der Türe vorbei, für die es gar nicht gedacht
		// ist. Hier zählt nur, dass die Seite normal rendert und der Header nichts bewirkt.
		const context = await browser.newContext({
			extraHTTPHeaders: { Authorization: 'Bearer tallox_AAAAAAAAAAAAAAAA_nonsense' }
		});
		const page = await context.newPage();

		await gotoRendered(page, '/');

		await expect(page.getByRole('heading', { name: 'Einsatzplanung', level: 1 })).toBeVisible();
		await expect(page.getByText(/Kein\s+X-Remote-User\s+gesetzt/)).toBeVisible();

		await context.close();
	});
});
