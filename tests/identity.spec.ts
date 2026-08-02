import { test, expect, PERSONAS, gotoRendered } from './fixtures';

/**
 * The identity relay — the one mechanism only an end-to-end test can check.
 *
 * The SSR process talks to the backend container-internally and thereby bypasses the auth
 * proxy. So the backend sees no `X-Remote-User` unless the GUI sends it itself. That happens in
 * `src/lib/server/backend.ts` via AsyncLocalStorage, set once in `hooks.server.ts` —
 * deliberately not threaded through every `load()` signature, because one forgotten place would
 * be a silent authorization failure.
 *
 * "Silent" is the problem here: if the relay fails, every page renders as anonymous and looks
 * completely normal doing it. A unit test on `backendClient()` only proves the function builds
 * headers — not that the request carries them.
 */
test.describe('identity', () => {
	test('access is anonymous without the proxy header', async ({ page }) => {
		await gotoRendered(page, '/');

		await expect(page.getByText(/Kein\s+X-Remote-User\s+gesetzt/)).toBeVisible();
	});

	test('the user set by the proxy appears on the page', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/');

		await expect(page.getByText(PERSONAS.eins.mail)).toBeVisible();
		await expect(page.getByText(/Kein\s+X-Remote-User/)).toHaveCount(0);
	});

	test("two people see their own identity, not each other's", async ({ asPersona }) => {
		// Two contexts in parallel. The defect this catches is state held per process instead of
		// per request — AsyncLocalStorage is exactly the construction where that can go wrong,
		// and under load it would show up as a swapped identity. In this project that means:
		// somebody sees another person's wishes.
		const [eins, zwei] = await Promise.all([asPersona(PERSONAS.eins), asPersona(PERSONAS.zwei)]);

		await Promise.all([gotoRendered(eins, '/'), gotoRendered(zwei, '/')]);

		await expect(eins.getByText(PERSONAS.eins.mail)).toBeVisible();
		await expect(eins.getByText(PERSONAS.zwei.mail)).toHaveCount(0);

		await expect(zwei.getByText(PERSONAS.zwei.mail)).toBeVisible();
		await expect(zwei.getByText(PERSONAS.eins.mail)).toHaveCount(0);
	});

	test('an Authorization header sent by the client is not forwarded', async ({ browser }) => {
		// `backendClient()` builds its headers from scratch. Were it to copy those of the
		// incoming request instead, a browser could pass its own bearer token to the backend —
		// past the door it is not meant for. All that counts here is that the page renders
		// normally and the header has no effect.
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
