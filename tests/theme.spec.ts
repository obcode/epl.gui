import { test, expect, gotoRendered } from './fixtures';
import { THEME_COOKIE } from '../src/lib/themes';

/**
 * Das Theme über den vollen Weg: Klick → Cookie → nächster SSR-Request → erstes Byte.
 *
 * `resolveTheme()` ist in vitest geprüft, aber die Eigenschaft, um derentwillen es überhaupt
 * ein Cookie und kein localStorage ist, lässt sich nur im Browser prüfen: dass beim vollen
 * Neuladen **nicht** kurz das Default-Theme aufblitzt. Das ist kein Unit-Test-Thema, sondern
 * eine Frage danach, was im ersten ausgelieferten Byte steht.
 */
test.describe('Theme', () => {
	test('ohne Cookie steht kein data-theme im Markup', async ({ page }) => {
		await gotoRendered(page, '/');

		// Nur ohne `data-theme` greifen `--default` und `--prefersdark` — die Seite folgt dann
		// dem Betriebssystem. Ein leeres oder gar gesetztes Attribut bräche genau das.
		await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	});

	test('eine Wahl überlebt den vollen Reload und wird schon serverseitig gerendert', async ({
		page
	}) => {
		await gotoRendered(page, '/');

		await page.getByRole('button', { name: /Design/ }).click();
		await page.getByRole('button', { name: 'Dracula', exact: true }).click();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');

		const cookies = await page.context().cookies();
		expect(cookies.find((c) => c.name === THEME_COOKIE)?.value).toBe('dracula');

		// Der eigentliche Test: die Antwort des Servers muss das Attribut bereits enthalten.
		// Über das DOM nach dem Laden zu prüfen würde auch dann gelingen, wenn ein Skript es
		// nachträglich setzt — und genau dieses Nachsetzen ist das Aufblitzen, das vermieden
		// werden soll.
		const response = await page.goto('/');
		expect(await response!.text()).toContain('data-theme="dracula"');
	});

	test('ein manipulierter Cookie landet nicht im Markup', async ({ page, context }) => {
		// Der aufgelöste Wert wird ungeescaped in das <html>-Tag geschrieben. Deshalb ist
		// `resolveTheme()` eine Allowlist und kein Escaping — wer den Cookie setzen kann, darf
		// damit nichts in das Markup schreiben können.
		await context.addCookies([
			{
				name: THEME_COOKIE,
				value: 'dracula" onload="alert(1)',
				url: 'http://localhost:4173'
			}
		]);

		const response = await page.goto('/');
		const html = await response!.text();

		expect(html).not.toContain('onload=');
		await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	});
});
