import { test, expect, PERSONAS, gotoRendered } from './fixtures';

/**
 * Die Tokenverwaltung, gegen den echten Stack.
 *
 * Was hier geprüft wird, kann kein Unit-Test zeigen: dass ein Token, das diese Seite anlegt,
 * anschließend gegen die *andere* Tür funktioniert. Der Weg dorthin führt durch die
 * Identitätsweitergabe im SSR, durch die Mutation im Backend, durch das Hashen des Secrets
 * und wieder zurück durch die Authentifizierung — und jede dieser Stationen kann für sich
 * korrekt sein, während das Ergebnis unbrauchbar ist.
 */
test.describe('Personal Access Tokens', () => {
	test('anlegen zeigt das Token genau einmal, und es funktioniert', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/konto/tokens');

		const description = `E2E ${Date.now()}`;
		await page.getByLabel('Wofür?').fill(description);
		await page.getByRole('button', { name: 'Anlegen' }).click();

		const secretField = page.getByLabel('Neues Token');
		await expect(secretField).toBeVisible();

		const secret = await secretField.inputValue();
		expect(secret).toMatch(/^tallox_[0-9A-HJKMNP-TV-Z]{16}_[A-Za-z0-9_-]{43}$/);

		// Der eigentliche Beweis: das eben ausgegebene Token authentifiziert gegen die
		// Token-Tür, als seine Eigentümerin.
		const response = await page.request.post(
			`${process.env.TALLOX_SERVER?.replace('/query', '') ?? 'http://localhost:8080'}/api/graphql`,
			{
				headers: { Authorization: `Bearer ${secret}` },
				data: { query: '{ me { mail } }' }
			}
		);
		expect(response.ok()).toBe(true);
		expect(await response.json()).toMatchObject({ data: { me: { mail: PERSONAS.eins.mail } } });

		// Und nach dem Neuladen ist das Secret weg — es existiert nur in der Antwort auf die
		// Mutation. Eine Seite, die es beim zweiten Blick noch zeigt, hat es irgendwo abgelegt.
		await gotoRendered(page, '/konto/tokens');
		await expect(page.getByLabel('Neues Token')).toHaveCount(0);
		await expect(page.getByText(description)).toBeVisible();
	});

	test('widerrufen macht das Token sofort unbrauchbar', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.zwei);
		await gotoRendered(page, '/konto/tokens');

		const description = `Widerruf ${Date.now()}`;
		await page.getByLabel('Wofür?').fill(description);
		await page.getByRole('button', { name: 'Anlegen' }).click();

		const secret = await page.getByLabel('Neues Token').inputValue();
		const endpoint = `${process.env.TALLOX_SERVER?.replace('/query', '') ?? 'http://localhost:8080'}/api/graphql`;

		const before = await page.request.post(endpoint, {
			headers: { Authorization: `Bearer ${secret}` },
			data: { query: '{ me { mail } }' }
		});
		expect(before.ok()).toBe(true);

		// Über die Beschreibung und nicht über `.first()`.
		//
		// Nach dem Anlegen lädt SvelteKit die Liste neu; `.first()` traf deshalb mal die neue
		// und mal noch die alte erste Zeile — der Test widerrief dann ein anderes Token, und
		// das hier geprüfte funktionierte weiter. Als „flaky" gemeldet, tatsächlich aber ein
		// Test, der zeitweise etwas anderes prüfte als sein Name sagt.
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

	test('niemand sieht die Tokens einer anderen Person', async ({ asPersona }) => {
		const marker = `Nur für Eins ${Date.now()}`;

		const eins = await asPersona(PERSONAS.eins);
		await gotoRendered(eins, '/konto/tokens');
		await eins.getByLabel('Wofür?').fill(marker);
		await eins.getByRole('button', { name: 'Anlegen' }).click();
		await expect(eins.getByLabel('Neues Token')).toBeVisible();

		const zwei = await asPersona(PERSONAS.zwei);
		await gotoRendered(zwei, '/konto/tokens');

		// Ein Token ist eine Zugangsdatei; die Liste einer anderen Person zu sehen heißt zu
		// wissen, welche IDs es gibt — und die ID ist es, was ein Widerruf nimmt.
		await expect(zwei.getByText(marker)).toHaveCount(0);
	});

	test('die Seite ist barrierefrei', async ({ asPersona, checkA11y }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/konto/tokens');
		await checkA11y(page);
	});
});
