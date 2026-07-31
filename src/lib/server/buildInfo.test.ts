import { describe, expect, it, vi, beforeEach } from 'vitest';

const backendRequest = vi.fn();
vi.mock('./backend', () => ({ backendRequest }));

const { loadServerBuildInfo } = await import('./buildInfo');

/**
 * Der Footer hängt an jeder Seite, also hängt jede Seite an dieser Funktion.
 *
 * Das Verhalten, das hier zählt, ist das im Fehlerfall: ein nicht erreichbares Backend darf
 * nicht dazu führen, dass die gesamte Anwendung mit 500 antwortet. Der Moment, in dem das
 * passiert, ist ausgerechnet der Deploy — der API-Container startet neu, und wer gerade eine
 * Seite offen hat, bekäme statt einer Oberfläche einen Fehler. Ein „—" im Footer ist die
 * nützlichere Antwort.
 */
describe('loadServerBuildInfo', () => {
	beforeEach(() => {
		backendRequest.mockReset();
	});

	it('reicht den Versionsstempel des Backends durch', async () => {
		backendRequest.mockResolvedValue({
			buildInfo: { version: '1.2.3', commit: '0123456', builtAt: '2026-07-31T09:00:00Z' }
		});

		await expect(loadServerBuildInfo()).resolves.toEqual({
			version: '1.2.3',
			commit: '0123456',
			builtAt: '2026-07-31T09:00:00Z'
		});
	});

	it('liefert null statt zu werfen, wenn das Backend nicht antwortet', async () => {
		backendRequest.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:8080'));

		await expect(loadServerBuildInfo()).resolves.toBeNull();
	});

	it('liefert auch bei einer HTML-Antwort null', async () => {
		// Der realistische Fall hinter einem falsch gesetzten TALLOX_SERVER: der SSR-Prozess
		// hat kein OIDC-Cookie und bekommt die Login-Seite des IdP als HTML zurück. Das ist
		// kein Netzwerkfehler, sondern ein Parse-Fehler — und muss denselben Weg nehmen.
		backendRequest.mockRejectedValue(new SyntaxError('Unexpected token < in JSON at position 0'));

		await expect(loadServerBuildInfo()).resolves.toBeNull();
	});
});
