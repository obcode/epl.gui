import { expect } from '@playwright/test';
import { PERSONAS, gotoRendered, test } from './fixtures';

/**
 * Wer die Verwaltung sieht, wer sie benutzen kann, und was die Rollenvorschau tut.
 *
 * Der Riegel steht im Backend und wird dort geprüft, durch beide Türen. Was hier geprüft wird,
 * kann keine Go-Testebene sehen: dass die Navigation aus den *effektiven* Rollen gebaut wird
 * und nicht aus den gehaltenen, dass der Cookie tatsächlich bis ans Backend durchkommt, und
 * dass der Rückweg aus einer Verengung erreichbar bleibt, in der die Verwaltung gerade
 * verschwunden ist.
 */

test.describe('Verwaltung', () => {
	test('erscheint im Menü nur für die Administration', async ({ asPersona }) => {
		const admin = await asPersona(PERSONAS.sechs);
		await admin.goto('/');
		await expect(admin.getByRole('button', { name: PERSONAS.sechs.name })).toBeVisible();

		const lecturer = await asPersona(PERSONAS.eins);
		await lecturer.goto('/');
		// Kosmetik, aber die richtige: wer den Eintrag sieht und bei jedem Klick eine Ablehnung
		// bekommt, lernt, Ablehnungen zu ignorieren.
		await expect(lecturer.getByRole('link', { name: /Verwaltung/ })).toHaveCount(0);
	});

	test('listet die Personen für die Administration', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/verwaltung/personen');

		await expect(page.getByRole('heading', { name: 'Personen und Rollen' })).toBeVisible();
		await expect(page.getByText(PERSONAS.eins.name)).toBeVisible();
	});

	test('weist eine Dozentin ab, statt ihr eine leere Liste zu zeigen', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		const response = await page.goto('/verwaltung/personen');

		// Eine leere Tabelle und „Du darfst das nicht" sind verschiedene Auskünfte, und die
		// erste sähe aus, als gäbe es niemanden im System.
		expect(response?.status()).toBeGreaterThanOrEqual(400);
		await expect(page.getByText(PERSONAS.zwei.mail)).toHaveCount(0);
	});
});

test.describe('Personen anlegen und Rollen setzen', () => {
	test('legt mit der Mailadresse allein an und vergibt danach Rollen', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/verwaltung/personen');

		// Eine Adresse pro Lauf: Personen werden nie gelöscht, also würde ein fester Wert beim
		// zweiten Lauf an PERSON_EXISTS scheitern — und das sähe aus wie ein Fehler in der
		// Anwendung statt wie eine Datenbank mit Gedächtnis.
		const mail = `neu.${Date.now()}@example.org`;

		await page.getByLabel('Mailadresse').fill(mail);
		await page.getByRole('button', { name: 'Anlegen' }).click();

		// Ohne Namen angelegt: dann steht die Adresse da, wo sonst der Name steht. Das ist der
		// Normalfall und keine Lücke — der Name kommt später, von der Person selbst oder aus
		// dem ZPA.
		await page.getByRole('searchbox', { name: 'Suchen' }).fill(mail);
		await page.getByRole('button', { name: 'Anwenden' }).click();
		const row = page.getByRole('row').filter({ hasText: mail });
		await expect(row).toContainText('— noch keine —');

		// Rollen sind ein eigener Schritt, auch für LECTURER: wer was darf, soll eine Liste
		// sein, die jemand geschrieben hat, und kein Standard, den niemand gewählt hat.
		await row.getByRole('button', { name: 'Bearbeiten' }).click();
		await page.getByRole('checkbox', { name: /Dozent:in/ }).check();
		await page.getByRole('button', { name: 'Rollen speichern' }).click();

		await expect(page.getByRole('row').filter({ hasText: mail })).toContainText('Dozent:in');
	});

	test('lässt die letzte Administration nicht entfernen', async ({ asPersona }) => {
		// Der Sicherheitsstrick, von der Oberfläche aus gesehen. Die Regel selbst steht in
		// einer Transaktion in internal/store und wird dort gegen die Datenbank geprüft; hier
		// zählt nur, dass sie über den Bildschirm erreichbar ist, über den man den Schaden
		// anrichten würde, und dass sie als lesbarer Satz ankommt und nicht als 500er.
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/verwaltung/personen');

		// Vorbedingung, und sie wird geprüft statt angenommen: die Regel greift nur, wenn es
		// genau eine Administration gibt. Gäbe es lokal eine zweite, würde dieser Test die
		// Persona tatsächlich deaktivieren — und jeder weitere Lauf begänne mit einer
		// ausgesperrten Testidentität, die sich über die Oberfläche nicht reaktivieren lässt.
		// In CI setzt der Seed den Zustand, lokal kann er abweichen.
		const admins = await page.getByRole('row').filter({ hasText: 'Administration' }).count();
		test.skip(admins !== 1, `Diese Datenbank hat ${admins} Administrationen, der Test braucht 1.`);

		await page.getByRole('searchbox', { name: 'Suchen' }).fill(PERSONAS.sechs.mail);
		await page.getByRole('button', { name: 'Anwenden' }).click();
		const row = page.getByRole('row').filter({ hasText: PERSONAS.sechs.mail });
		await row.getByRole('button', { name: 'Bearbeiten' }).click();
		await page.getByRole('button', { name: 'Konto deaktivieren' }).click();

		await expect(page.getByText('Nicht gespeichert')).toBeVisible();
		await expect(page.getByText(/ohne Administration/)).toBeVisible();
	});
});

test.describe('Bereiche nach Rolle', () => {
	test('zeigt Bedarf der Planung und Statistik nur dem Dekanat', async ({ asPersona }) => {
		// Auf die Bereichsleiste eingegrenzt: „Bedarf" steht auch im Einleitungssatz der
		// Startseite, und ein Test, der die ganze Seite absucht, prüft am Ende die Prosa.
		const lecturer = await asPersona(PERSONAS.eins);
		await lecturer.goto('/');
		// .first(): die Leiste rendert jeden Bereich zweimal — einmal nebeneinander ab lg,
		// einmal im Hamburger-Menü darunter. Dass beide dieselben Einträge tragen, ist Absicht
		// und wird in responsive.spec.ts geprüft.
		const lecturerNav = lecturer.getByRole('navigation');
		await expect(lecturerNav.getByText('Wünsche').first()).toBeVisible();
		await expect(lecturerNav.getByText('Bedarf')).toHaveCount(0);
		await expect(lecturerNav.getByText('Statistik')).toHaveCount(0);

		// Vier plant, sieht also Bedarf und Zuteilung — aber nicht die Statistik. Genau diese
		// Zwischenstufe ist der Grund, warum die Sichtbarkeit eine Liste von Rollen pro
		// Bereich ist und keine Rangfolge.
		const planner = await asPersona(PERSONAS.vier);
		await planner.goto('/');
		const plannerNav = planner.getByRole('navigation');
		await expect(plannerNav.getByText('Bedarf').first()).toBeVisible();
		await expect(plannerNav.getByText('Zuteilung').first()).toBeVisible();
		await expect(plannerNav.getByText('Statistik')).toHaveCount(0);
	});
});

test.describe('Rollenvorschau', () => {
	test('nimmt Rechte weg und stellt sie zurück', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/');

		// Ohne Verengung: die Verwaltung ist erreichbar.
		await expect(page.getByRole('button', { name: /Rolle/ })).toBeVisible();

		// Als Dozent:in ansehen. Der Cookie geht an den SSR-Prozess, der ihn als
		// X-Tallox-Assume-Roles ans Backend weiterreicht — dieser ganze Weg ist der Grund,
		// warum das hier und nicht in vitest steht.
		await page
			.context()
			.addCookies([{ name: 'tallox_assume', value: 'LECTURER', url: page.url() }]);
		await page.reload();

		await expect(page.getByRole('status')).toContainText('Vorschau');
		const denied = await page.goto('/verwaltung/personen');
		expect(denied?.status()).toBeGreaterThanOrEqual(400);

		// Und der Rückweg. Er muss aus genau diesem Zustand erreichbar sein: eine Verengung,
		// die man nur dort beenden kann, wo sie den Zugang gerade wegnimmt, ist eine Falle.
		await page.goto('/');
		await page.getByRole('button', { name: 'Zurück zu meinen Rollen' }).first().click();
		await expect(page.getByRole('status')).toHaveCount(0);
	});

	test('gibt niemandem eine Rolle, die er nicht hat', async ({ asPersona }) => {
		// Der Kern der Sache. Der Cookie ist nicht vertrauenswürdig und muss es nicht sein:
		// das Backend schneidet die Auswahl mit den tatsächlich gehaltenen Rollen, und ein
		// Schnitt kann nichts hinzufügen. Wäre das je nicht so, wäre die Vorschau eine
		// Rechteausweitung per Cookie.
		const page = await asPersona(PERSONAS.eins);
		await page.goto('/');
		await page.context().addCookies([{ name: 'tallox_assume', value: 'ADMIN', url: page.url() }]);
		await page.reload();

		await expect(page.getByRole('link', { name: /Verwaltung/ })).toHaveCount(0);

		const response = await page.goto('/verwaltung/personen');
		expect(response?.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Kein Konto', () => {
	test('sagt das, statt das Backend für kaputt zu erklären', async ({ browser }) => {
		// Jemand mit HM-Kennung, den diese Installation nicht kennt: durch den Auth-Proxy
		// gekommen, aber ohne Zeile in `person`. Vorher endete das als „Backend nicht
		// erreichbar" im Footer — eine Auskunft, die nach einer Störung klingt und den einen
		// Schritt verschweigt, der hilft.
		const context = await browser.newContext({
			extraHTTPHeaders: { 'X-Remote-User': 'niemand@example.org' }
		});
		const page = await context.newPage();

		const response = await page.goto('/');
		expect(response?.status()).toBe(403);
		// src/error.html und nicht +error.svelte: SvelteKit rendert für einen Fehler im
		// Root-Layout kein +error.svelte, weil dessen Rahmen genau das ist, was fehlgeschlagen
		// ist. Die Seite trägt deshalb ihr eigenes CSS und braucht die App nicht.
		await expect(page.getByRole('heading', { name: 'Kein Zugang zu Tallox' })).toBeVisible();

		await context.close();
	});
});

test.describe('Barrierefreiheit', () => {
	test('die Verwaltung ist barrierefrei', async ({ asPersona, checkA11y }) => {
		const page = await asPersona(PERSONAS.sechs);
		await gotoRendered(page, '/verwaltung/personen');
		await checkA11y(page);
	});

	test('der Vorschau-Streifen ist barrierefrei', async ({ asPersona, checkA11y }) => {
		// Eigener Test, weil der Streifen nur unter einer Bedingung existiert und die
		// bestehende a11y-Prüfung ihn deshalb nie zu sehen bekommt. Er trägt eine semantische
		// Farbe als Hintergrund — genau die Konstellation, an der in diesem Projekt schon
		// einmal ein Kontrastbefund hing.
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/');
		await page
			.context()
			.addCookies([{ name: 'tallox_assume', value: 'LECTURER', url: page.url() }]);
		await gotoRendered(page, '/');

		await expect(page.getByRole('status')).toBeVisible();
		await checkA11y(page);
	});
});

test.describe('Diagnose', () => {
	test('beantwortet die Supportfrage mit Entscheidungen, nicht mit Inhalten', async ({
		asPersona
	}) => {
		// Das Feld ist @interactiveOnly, und die API-Konsole unter /api-doku geht bewusst durch
		// die Token-Tür. Ohne diese Seite gäbe es in Produktion also gar keinen Weg, es zu
		// benutzen — genau das war beim ersten Anlauf der Fall.
		const page = await asPersona(PERSONAS.sechs);
		await page.goto(`/verwaltung/diagnose?mail=${encodeURIComponent(PERSONAS.eins.mail)}`);

		await expect(page.getByRole('heading', { name: PERSONAS.eins.name })).toBeVisible();
		await expect(page.getByText('policy.MayAdministerPeople')).toBeVisible();
		// Eine Dozentin verwaltet nicht und liest keine fremden Wünsche — beide Antworten
		// stehen da, mit Begründung.
		await expect(page.getByText(/Nur Planung und Dekanat/)).toBeVisible();
	});

	test('sagt bei einer unbekannten Adresse genau das', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.sechs);
		await page.goto('/verwaltung/diagnose?mail=gibtesnicht%40example.org');

		await expect(page.getByText('Unbekannt')).toBeVisible();
	});

	test('ist für eine Dozentin nicht erreichbar', async ({ asPersona }) => {
		const page = await asPersona(PERSONAS.eins);
		const response = await page.goto(
			`/verwaltung/diagnose?mail=${encodeURIComponent(PERSONAS.zwei.mail)}`
		);
		expect(response?.status()).toBeGreaterThanOrEqual(400);
	});

	test('die Seite ist barrierefrei', async ({ asPersona, checkA11y }) => {
		const page = await asPersona(PERSONAS.sechs);
		await gotoRendered(page, `/verwaltung/diagnose?mail=${encodeURIComponent(PERSONAS.eins.mail)}`);
		await checkA11y(page);
	});
});
