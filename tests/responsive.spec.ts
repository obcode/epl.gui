import { test, expect, gotoRendered, openDropdown } from './fixtures';

/**
 * Tablet-first, as laid down in CLAUDE.md: fully usable from 768px, clean at 375px.
 *
 * The defect this catches is always the same and always invisible on the machine it arises on:
 * a wide table or a long line pushes the body past the viewport. Nobody notices on a desktop
 * monitor; on the tablet in the meeting where the assignment is discussed, the whole page wobbles
 * horizontally.
 */
/**
 * The widths that are measured. No exceptions any more: the overflow this test found on its
 * first run is fixed.
 *
 * The finding was real — 883px at a 768px viewport, 1117px at 1024px. The area bar switched to
 * seven side-by-side entries at `md:` (768px) and did not fit there, at exactly the width
 * CLAUDE.md promises full usability from. At 375px the hamburger carried it, at 1440px there was
 * room enough; which is why it showed up precisely in between.
 *
 * Fixed by two changes in NavBar.svelte that belong together: the bar only switches from `lg`
 * (1024px), and the brand subtitle only from `xl`. The first alone is not enough — `lg` means
 * *from* 1024px, so the bar appears at exactly 1024 and still needs 1117px there. Only the room
 * from the second step brings it under.
 */
const VIEWPORTS = [
	{ name: 'phone', width: 375, height: 812 },
	{ name: 'tablet portrait', width: 768, height: 1024 },
	{ name: 'tablet landscape', width: 1024, height: 768 },
	{ name: 'desktop', width: 1440, height: 900 }
] as const;

test.describe('rendering across widths', () => {
	for (const viewport of VIEWPORTS) {
		test(`${viewport.name} (${viewport.width}px) does not scroll horizontally`, async ({
			page
		}) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await gotoRendered(page, '/');

			const overflow = await page.evaluate(() => {
				const el = document.documentElement;
				return { scroll: el.scrollWidth, client: el.clientWidth };
			});

			// One pixel of tolerance for subpixel rounding at fractional layout widths.
			expect(
				overflow.scroll,
				`The page is ${overflow.scroll}px wide at a ${overflow.client}px viewport — ` +
					`something in it has no width limit. Wide content belongs in an ` +
					`overflow-x-auto container of its own, not in the body.`
			).toBeLessThanOrEqual(overflow.client + 1);
		});
	}

	test('below 1024px the hamburger carries the navigation', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await gotoRendered(page, '/');

		await expect(page.getByRole('button', { name: 'Bereiche' })).toBeVisible();

		await openDropdown(page, 'Bereiche');
		await expect(page.getByRole('banner').getByRole('list').last()).toBeVisible();
	});

	test('from 1024px the area bar stands side by side', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await gotoRendered(page, '/');

		// The other direction: the hamburger disappears. Without this half, a layout showing both
		// variants at once would be fine as far as the test is concerned.
		await expect(page.getByRole('button', { name: 'Bereiche' })).toBeHidden();
	});
});
