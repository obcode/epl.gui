import { describe, expect, it } from 'vitest';
import { authContext } from './backend';

// No network, no mocks: all that is checked is that the AsyncLocalStorage carries the identity
// across await boundaries. That is exactly the property the header relay to the backend rests
// on — were it lost, the SSR hop would carry on unauthenticated without anything failing
// anywhere.
describe('authContext', () => {
	it('carries the identity across await boundaries', async () => {
		await authContext.run({ remoteUser: 'prof.eins@example.org' }, async () => {
			await Promise.resolve();
			expect(authContext.getStore()?.remoteUser).toBe('prof.eins@example.org');
		});
	});

	it('is empty outside a run()', () => {
		expect(authContext.getStore()).toBeUndefined();
	});

	it('isolates concurrent requests from one another', async () => {
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
