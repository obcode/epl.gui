import { describe, expect, it, vi, beforeEach } from 'vitest';

const backendRequest = vi.fn();
vi.mock('./backend', () => ({ backendRequest }));

const { loadServerBuildInfo } = await import('./buildInfo');

/**
 * The footer hangs on every page, so every page hangs on this function.
 *
 * The behaviour that matters here is the one in the failure case: an unreachable backend must
 * not make the whole application answer with a 500. The moment that happens is, of all times,
 * the deploy — the API container is restarting, and anybody with a page open would get an error
 * instead of an interface. A "—" in the footer is the more useful answer.
 */
describe('loadServerBuildInfo', () => {
	beforeEach(() => {
		backendRequest.mockReset();
	});

	it('passes the backend version stamp through', async () => {
		backendRequest.mockResolvedValue({
			buildInfo: { version: '1.2.3', commit: '0123456', builtAt: '2026-07-31T09:00:00Z' }
		});

		await expect(loadServerBuildInfo()).resolves.toEqual({
			version: '1.2.3',
			commit: '0123456',
			builtAt: '2026-07-31T09:00:00Z'
		});
	});

	it('returns null rather than throwing when the backend does not answer', async () => {
		backendRequest.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:8080'));

		await expect(loadServerBuildInfo()).resolves.toBeNull();
	});

	it('returns null for an HTML response too', async () => {
		// The realistic case behind a wrongly set TALLOX_SERVER: the SSR process has no OIDC
		// cookie and gets the IdP's login page back as HTML. That is not a network failure but a
		// parse failure — and has to take the same route.
		backendRequest.mockRejectedValue(new SyntaxError('Unexpected token < in JSON at position 0'));

		await expect(loadServerBuildInfo()).resolves.toBeNull();
	});
});
