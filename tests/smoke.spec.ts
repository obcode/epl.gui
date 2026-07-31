import { test, expect, gotoRendered } from './fixtures';

/**
 * Der Rauchtest. Läuft gegen einen echten Stack: SvelteKit-SSR → GraphQL-Backend → PostgreSQL.
 *
 * Was er absichert, prüft kein Unit-Test: dass die drei Teile zusammen überhaupt antworten.
 * Die häufigste Art, wie das bricht, ist keine kaputte Komponente, sondern eine falsche
 * `TALLOX_SERVER`-URL — und deren Symptom ist eine Seite, die rendert, aber überall leer ist.
 */
test.describe('Startseite', () => {
	test('rendert und nennt sich beim Namen', async ({ page }) => {
		await gotoRendered(page, '/');

		await expect(page.getByRole('heading', { name: 'Einsatzplanung', level: 1 })).toBeVisible();
		await expect(page.getByRole('banner').getByText('Tallox', { exact: true })).toBeVisible();
	});

	test('erreicht das Backend und zeigt dessen Version', async ({ page }) => {
		await gotoRendered(page, '/');

		// Die Karte sagt "Nicht erreichbar", wenn der SSR-Hop scheitert. Genau dieser Fall ist
		// der interessante: die Seite rendert dann trotzdem, und ohne diese Zusicherung wäre
		// ein E2E-Lauf gegen ein totes Backend grün.
		const backendCard = page
			.locator('div')
			.filter({ hasText: /^🔌 Backend/ })
			.last();
		await expect(backendCard).not.toContainText('Nicht erreichbar');

		// Der Footer bekommt seine Serverversion über denselben Weg. Bewusst nicht auf eine
		// Versionsnummer geprüft: ein lokal gebautes Backend meldet "dev", weil die Version
		// per ldflags erst beim Release gesetzt wird. Interessant ist nur das "—", denn das
		// bedeutet, die Antwort war leer statt fehlerhaft — ein anderer Fehler als ein
		// unerreichbares Backend, und einer, den die Karte oben nicht zeigt.
		const footer = page.getByRole('contentinfo');
		await expect(footer).toContainText(/Server\s+\S+/);
		await expect(footer).not.toContainText('Server —');
	});

	test('liefert eine vollständig ersetzte app.html aus', async ({ page }) => {
		// Aus Schaden klug: ein Kommentar in app.html, der einen sveltekit-Platzhalter im
		// Fließtext erwähnte, hat dessen Ersetzung auf sich gezogen. Das Stylesheet landete im
		// Kommentar, der echte Platzhalter blieb als sichtbarer Text im <head> stehen — und
		// weil Text dort ungültig ist, beendete der Browser den Kopf und zeigte
		// "%sveltekit.head%" oben links auf jeder Seite. Die Anwendung war unformatiert.
		//
		// Kein einziger der übrigen Tests hat das bemerkt: sie prüfen Inhalt und Verhalten,
		// und beides funktionierte weiter. Deshalb hier zwei stumpfe, aber wirksame Zusicherungen.
		const response = await page.goto('/');
		const html = await response!.text();

		const leftover = html.match(/%sveltekit\.[a-z]+%|%tallox\.[a-z]+%/i);
		expect(
			leftover?.[0],
			`app.html enthält einen nicht ersetzten Platzhalter (${leftover?.[0]}). ` +
				`Häufigste Ursache: derselbe Platzhalter wird weiter oben in einem Kommentar ` +
				`erwähnt und fängt die Ersetzung ab.`
		).toBeUndefined();

		// Ohne Stylesheet rendert die Seite weiter und liest sich in einem Test unauffällig —
		// sie sieht nur zerschossen aus. Das ist genau der Schaden, den obiger Fehler anrichtete.
		await expect(page.locator('head link[rel="stylesheet"]')).not.toHaveCount(0);
	});

	test('meldet einen Health-Check ohne jede Identität', async ({ request }) => {
		// Direkt gegen das Backend, ohne Browser und ohne Header. /healthz muss antworten,
		// bevor Datenbank, Auth-Proxy oder Session existieren — Container-Healthcheck und
		// deploy/smoketest hängen daran. Läge es je hinter der Auth-Middleware, würde sich
		// jedes Deployment auf einem gesunden Server selbst zurückrollen.
		const backend = process.env.TALLOX_SERVER ?? 'http://localhost:8080/query';
		const health = new URL('/healthz', backend).toString();

		const response = await request.get(health);
		expect(response.ok(), `GET ${health} antwortete mit ${response.status()}`).toBe(true);
		expect(await response.json()).toMatchObject({ status: 'ok' });
	});
});
