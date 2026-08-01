import { test, expect, PERSONAS, gotoRendered } from './fixtures';

/**
 * Die API-Dokumentation.
 *
 * Sie ist der Grund, warum die Doku in der Anwendung steht und nicht auf GitHub: sie nennt
 * den Endpunkt, und der Hostname der Produktion darf in keinem öffentlichen Repository
 * stehen. Eine Anleitung, die ihre wichtigste Angabe nicht enthalten darf, ist keine.
 */
test.describe('API-Dokumentation', () => {
	test('nennt den Endpunkt und den Weg zum Token', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/api-doku');

		// Der Endpunkt kommt aus der Konfiguration, nicht aus dem Markup — hier wird geprüft,
		// dass er überhaupt ankommt und auf die Token-Tür zeigt.
		await expect(page.getByText('/api/graphql').first()).toBeVisible();

		await page.getByRole('link', { name: /Konto → Tokens/ }).click();
		await expect(page).toHaveURL(/\/konto\/tokens$/);
	});

	test('erklärt, dass manche Felder über ein Token nicht antworten', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/api-doku');

		// Der Punkt, an dem sonst jede zweite Rückfrage entsteht: dieselbe Abfrage liefert je
		// nach Tür etwas anderes, und ohne diesen Absatz sieht das nach einem Fehler aus.
		await expect(page.getByText(/INTERACTIVE_ONLY/)).toBeVisible();
	});

	test('zeigt Beispiele für mehrere Sprachen, ohne Token im Quelltext', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/api-doku');

		for (const label of ['curl', 'Python', 'R']) {
			// exact: true — sonst trifft 'R' auch 'curl'.
			await page.getByRole('tab', { name: label, exact: true }).click();
			const code = page.locator('pre code').first();
			await expect(code).toContainText('TALLOX_TOKEN');
			// Die Anleitung macht vor, was sie fordert.
			await expect(code).not.toContainText(/tallox_[0-9A-Z]{16}_/);
		}
	});

	test('die Schema-Referenz kommt aus dem Schema', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		await gotoRendered(page, '/api-doku/schema');

		// Query zuerst — das ist, was jemand sucht. Und ein Feld, das es wirklich gibt.
		await expect(page.getByRole('heading', { name: 'Query', exact: false })).toBeVisible();
		await expect(page.getByText('myTokens').first()).toBeVisible();

		// Die Nullbarkeit steht mit dabei: `[PersonalAccessToken!]` ohne abschließendes `!` ist
		// genau die Art, wie @interactiveOnly antwortet, ohne die Abfrage zu kippen.
		await expect(page.getByText('[PersonalAccessToken!]').first()).toBeVisible();
	});

	test('beide Seiten sind barrierefrei', async ({ asPersona, checkA11y }) => {
		const page = await asPersona(PERSONAS.eins);

		await gotoRendered(page, '/api-doku');
		await checkA11y(page);

		await gotoRendered(page, '/api-doku/schema');
		await checkA11y(page);
	});
});
