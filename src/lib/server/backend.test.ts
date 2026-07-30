import { describe, expect, it } from 'vitest';
import { authContext } from './backend';

// Kein Netzwerk, keine Mocks: geprüft wird nur, dass der AsyncLocalStorage die Identität
// über await-Grenzen hinweg trägt. Genau das ist die Eigenschaft, auf der die
// Header-Weitergabe an das Backend beruht — ginge sie verloren, liefe der SSR-Hop
// unauthentifiziert weiter, ohne dass irgendwo etwas fehlschlägt.
describe('authContext', () => {
	it('trägt die Identität über await-Grenzen', async () => {
		await authContext.run({ remoteUser: 'prof.eins@example.org' }, async () => {
			await Promise.resolve();
			expect(authContext.getStore()?.remoteUser).toBe('prof.eins@example.org');
		});
	});

	it('ist außerhalb eines run() leer', () => {
		expect(authContext.getStore()).toBeUndefined();
	});

	it('isoliert nebenläufige Requests voneinander', async () => {
		const seen: (string | undefined)[] = [];
		await Promise.all([
			authContext.run({ remoteUser: 'eins@example.org' }, async () => {
				await new Promise((r) => setTimeout(r, 10));
				seen.push(authContext.getStore()?.remoteUser);
			}),
			authContext.run({ remoteUser: 'zwei@example.org' }, async () => {
				seen.push(authContext.getStore()?.remoteUser);
			})
		]);
		expect(seen.sort()).toEqual(['eins@example.org', 'zwei@example.org']);
	});
});
