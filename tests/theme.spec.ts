import { test, expect, gotoRendered } from './fixtures';
import { THEME_COOKIE } from '../src/lib/themes';

/**
 * The theme along its full path: click → cookie → next SSR request → first byte.
 *
 * `resolveTheme()` is checked in vitest, but the property that makes this a cookie rather than
 * localStorage in the first place can only be checked in a browser: that a full reload does
 * **not** briefly flash the default theme. That is not a unit test subject but a question about
 * what is in the first byte delivered.
 */
test.describe('theme', () => {
	test('has no data-theme in the markup without a cookie', async ({ page }) => {
		await gotoRendered(page, '/');

		// Only without `data-theme` do `--default` and `--prefersdark` apply — the page then
		// follows the operating system. An empty or even a set attribute would break exactly
		// that.
		await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	});

	test('a choice survives a full reload and is already rendered server-side', async ({ page }) => {
		await gotoRendered(page, '/');

		await page.getByRole('button', { name: /Design/ }).click();
		await page.getByRole('button', { name: 'Dracula', exact: true }).click();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');

		const cookies = await page.context().cookies();
		expect(cookies.find((c) => c.name === THEME_COOKIE)?.value).toBe('dracula');

		// The actual test: the server's response has to contain the attribute already. Checking
		// via the DOM after loading would also succeed if a script set it afterwards — and that
		// setting-afterwards is precisely the flash this is meant to avoid.
		const response = await page.goto('/');
		expect(await response!.text()).toContain('data-theme="dracula"');
	});

	test('a tampered cookie does not reach the markup', async ({ page, context }) => {
		// The resolved value is written into the <html> tag unescaped. That is why
		// `resolveTheme()` is an allowlist and not escaping — whoever can set the cookie must not
		// be able to write anything into the markup with it.
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
