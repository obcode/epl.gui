import { describe, expect, it } from 'vitest';
import { authContext, backendClient } from './backend';

/**
 * The headers that go to the backend.
 *
 * `backendClient()` builds them from scratch rather than copying them from the incoming
 * request. That is the assurance the whole auth separation hangs on: were an `Authorization`
 * header from the browser forwarded, a Personal Access Token would arrive at a door it is not
 * meant for — carrying the identity the proxy has just set.
 *
 * What is checked here is the construction, not the transport; that the request really carries
 * the headers is checked by tests/identity.spec.ts in a real browser.
 */
describe('backendClient', () => {
	function headersOf(client: ReturnType<typeof backendClient>): Record<string, string> {
		return { ...((client.requestConfig.headers as Record<string, string>) ?? {}) };
	}

	it('sends the identity of the running request', async () => {
		await authContext.run(
			{ remoteUser: 'prof.eins@example.org', remoteDisplayname: 'Prof. Eins' },
			() => {
				const headers = headersOf(backendClient());

				expect(headers['X-Remote-User']).toBe('prof.eins@example.org');
				expect(headers['X-Remote-Displayname']).toBe('Prof. Eins');
			}
		);
	});

	it('sends no auth headers at all without an identity', () => {
		// Not an empty X-Remote-User: for the backend a header with an empty value is something
		// other than a missing one, and "anonymous" has to be unambiguously anonymous.
		const headers = headersOf(backendClient());

		expect(headers['X-Remote-User']).toBeUndefined();
		expect(headers['X-Remote-Displayname']).toBeUndefined();
	});

	it('never carries an Authorization header', async () => {
		// There is no parameter through which a caller could pass one — that is precisely the
		// intent. This test fails as soon as somebody adds one, and it is the place to read the
		// intent before overriding it.
		await authContext.run({ remoteUser: 'prof.zwei@example.org' }, () => {
			const headers = headersOf(backendClient());

			const authLike = Object.keys(headers).filter((k) => /^authorization$/i.test(k));
			expect(authLike).toEqual([]);
		});
	});

	it('keeps two identities apart', () => {
		// Context passed explicitly rather than via AsyncLocalStorage: the same process, two
		// clients, no shared header instance. A header object reused between calls would show up
		// here — and in production it would be a swapped identity under load.
		const eins = headersOf(backendClient({ remoteUser: 'prof.eins@example.org' }));
		const zwei = headersOf(backendClient({ remoteUser: 'prof.zwei@example.org' }));

		expect(eins['X-Remote-User']).toBe('prof.eins@example.org');
		expect(zwei['X-Remote-User']).toBe('prof.zwei@example.org');
	});
});
