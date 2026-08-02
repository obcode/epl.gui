import { test, expect, PERSONAS, gotoRendered } from './fixtures';

/**
 * Token management, against the real stack.
 *
 * What is checked here cannot be shown by a unit test: that a token this page creates then works
 * against the *other* door. The route there runs through the identity relay in the SSR, through
 * the mutation in the backend, through hashing the secret and back through authentication — and
 * every one of those stations can be correct on its own while the result is unusable.
 */
test.describe('Personal Access Tokens', () => {
	test('creating shows the token exactly once, and it works', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/konto/tokens');

		const description = `E2E ${Date.now()}`;
		await page.getByLabel('Wofür?').fill(description);
		await page.getByRole('button', { name: 'Anlegen' }).click();

		const secretField = page.getByLabel('Neues Token');
		await expect(secretField).toBeVisible();

		const secret = await secretField.inputValue();
		expect(secret).toMatch(/^tallox_[0-9A-HJKMNP-TV-Z]{16}_[A-Za-z0-9_-]{43}$/);

		// The actual proof: the token just issued authenticates against the token door, as its
		// owner.
		const response = await page.request.post(
			`${process.env.TALLOX_SERVER?.replace('/query', '') ?? 'http://localhost:8080'}/api/graphql`,
			{
				headers: { Authorization: `Bearer ${secret}` },
				data: { query: '{ me { mail } }' }
			}
		);
		expect(response.ok()).toBe(true);
		expect(await response.json()).toMatchObject({ data: { me: { mail: PERSONAS.eins.mail } } });

		// And after a reload the secret is gone — it exists only in the response to the mutation.
		// A page that still shows it on second look has stored it somewhere.
		await gotoRendered(page, '/konto/tokens');
		await expect(page.getByLabel('Neues Token')).toHaveCount(0);
		await expect(page.getByText(description)).toBeVisible();
	});

	test('revoking makes the token unusable immediately', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.zwei);
		await gotoRendered(page, '/konto/tokens');

		const description = `Revocation ${Date.now()}`;
		await page.getByLabel('Wofür?').fill(description);
		await page.getByRole('button', { name: 'Anlegen' }).click();

		const secret = await page.getByLabel('Neues Token').inputValue();
		const endpoint = `${process.env.TALLOX_SERVER?.replace('/query', '') ?? 'http://localhost:8080'}/api/graphql`;

		const before = await page.request.post(endpoint, {
			headers: { Authorization: `Bearer ${secret}` },
			data: { query: '{ me { mail } }' }
		});
		expect(before.ok()).toBe(true);

		// By the description and not by `.first()`.
		//
		// After creating, SvelteKit reloads the list; `.first()` therefore sometimes hit the new
		// and sometimes still the old first row — the test then revoked a different token, and
		// the one under test kept working. Reported as "flaky", but in fact a test that
		// intermittently checked something other than what its name says.
		const row = page.getByRole('row').filter({ hasText: description });
		await expect(row).toBeVisible();
		await row.getByRole('button', { name: 'Widerrufen' }).click();
		await expect(row.getByText('widerrufen')).toBeVisible();

		const after = await page.request.post(endpoint, {
			headers: { Authorization: `Bearer ${secret}` },
			data: { query: '{ me { mail } }' }
		});
		expect(after.status()).toBe(401);
	});

	test("nobody sees another person's tokens", async ({ asPersona }) => {
		const marker = `Only for Eins ${Date.now()}`;

		const eins = await asPersona(PERSONAS.eins);
		await gotoRendered(eins, '/konto/tokens');
		await eins.getByLabel('Wofür?').fill(marker);
		await eins.getByRole('button', { name: 'Anlegen' }).click();
		await expect(eins.getByLabel('Neues Token')).toBeVisible();

		const zwei = await asPersona(PERSONAS.zwei);
		await gotoRendered(zwei, '/konto/tokens');

		// A token is a credential; seeing another person's list means knowing which ids exist —
		// and the id is what a revocation takes.
		await expect(zwei.getByText(marker)).toHaveCount(0);
	});

	test('the page is accessible', async ({ asPersona, checkA11y }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/konto/tokens');
		await checkA11y(page);
	});
});
