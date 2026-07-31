import { describe, expect, it } from 'vitest';
import { authContext, backendClient } from './backend';

/**
 * Die Header, die an das Backend gehen.
 *
 * `backendClient()` baut sie von Grund auf neu, statt sie aus dem eingehenden Request zu
 * kopieren. Das ist die Zusicherung, an der die ganze Auth-Trennung hängt: würde ein
 * `Authorization`-Header des Browsers durchgereicht, käme ein Personal Access Token an einer
 * Türe an, für die es nicht gedacht ist — und zwar mit der Identität, die der Proxy gerade
 * gesetzt hat.
 *
 * Geprüft wird hier die Konstruktion, nicht der Transport; dass der Request die Header auch
 * wirklich trägt, prüft tests/identity.spec.ts im echten Browser.
 */
describe('backendClient', () => {
	function headersOf(client: ReturnType<typeof backendClient>): Record<string, string> {
		return { ...((client.requestConfig.headers as Record<string, string>) ?? {}) };
	}

	it('schickt die Identität des laufenden Requests mit', async () => {
		await authContext.run(
			{ remoteUser: 'prof.eins@example.org', remoteDisplayname: 'Prof. Eins' },
			() => {
				const headers = headersOf(backendClient());

				expect(headers['X-Remote-User']).toBe('prof.eins@example.org');
				expect(headers['X-Remote-Displayname']).toBe('Prof. Eins');
			}
		);
	});

	it('schickt ohne Identität gar keine Auth-Header', () => {
		// Nicht etwa einen leeren X-Remote-User: ein Header mit leerem Wert ist für das
		// Backend etwas anderes als ein fehlender, und „anonym" muss eindeutig anonym sein.
		const headers = headersOf(backendClient());

		expect(headers['X-Remote-User']).toBeUndefined();
		expect(headers['X-Remote-Displayname']).toBeUndefined();
	});

	it('trägt niemals einen Authorization-Header', async () => {
		// Es gibt keinen Parameter, über den ein Aufrufer einen mitgeben könnte — genau das
		// ist Absicht. Dieser Test schlägt fehl, sobald jemand einen einbaut, und das ist die
		// Stelle, an der jemand die Absicht nachlesen soll, bevor er sie überschreibt.
		await authContext.run({ remoteUser: 'prof.zwei@example.org' }, () => {
			const headers = headersOf(backendClient());

			const authLike = Object.keys(headers).filter((k) => /^authorization$/i.test(k));
			expect(authLike).toEqual([]);
		});
	});

	it('hält zwei Identitäten auseinander', () => {
		// Explizit übergebener Kontext statt AsyncLocalStorage: derselbe Prozess, zwei
		// Clients, keine geteilte Kopfzeilen-Instanz. Ein zwischen Aufrufen wiederverwendetes
		// Header-Objekt würde hier auffallen — und in der Produktion wäre es die vertauschte
		// Identität unter Last.
		const eins = headersOf(backendClient({ remoteUser: 'prof.eins@example.org' }));
		const zwei = headersOf(backendClient({ remoteUser: 'prof.zwei@example.org' }));

		expect(eins['X-Remote-User']).toBe('prof.eins@example.org');
		expect(zwei['X-Remote-User']).toBe('prof.zwei@example.org');
	});
});
