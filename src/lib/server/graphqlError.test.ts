import { describe, expect, it } from 'vitest';
import { GENERIC_MESSAGE, toRefusal } from './graphqlError';

/** So wirft graphql-request: ein Error mit einer `response.errors`-Liste. */
function clientError(errors: unknown[]): unknown {
	return Object.assign(new Error('GraphQL Error'), { response: { errors } });
}

describe('toRefusal', () => {
	it('reicht bekannte Ablehnungen im Wortlaut durch', () => {
		const refusal = toRefusal(
			clientError([
				{
					message: 'Dieses Token existiert nicht.',
					extensions: { code: 'TOKEN_NOT_FOUND' }
				}
			])
		);

		expect(refusal).toEqual({
			code: 'TOKEN_NOT_FOUND',
			message: 'Dieses Token existiert nicht.'
		});
	});

	it('ersetzt unbekannte Fehler durch einen allgemeinen Satz', () => {
		// Die Regel aus CLAUDE.md: keine rohen Backend-Fehlertexte auf Schreibpfaden. Eine
		// durchgereichte Unique-Verletzung verriete später, dass sich schon jemand
		// eingetragen hat — deshalb eine Allowlist und keine Denylist.
		const refusal = toRefusal(
			clientError([
				{
					message:
						'ERROR: duplicate key value violates unique constraint "wish_owner_key" (SQLSTATE 23505)'
				}
			])
		);

		expect(refusal.message).toBe(GENERIC_MESSAGE);
		expect(refusal.message).not.toContain('SQLSTATE');
		expect(refusal.message).not.toContain('unique');
	});

	it('behält den Code, verwirft aber den Text eines unbekannten Codes', () => {
		// Der Code hilft beim Suchen im Log; der Text ist von niemandem für Anzeige geprüft
		// worden.
		const refusal = toRefusal(
			clientError([{ message: 'table "person" does not exist', extensions: { code: 'INTERNAL' } }])
		);

		expect(refusal.code).toBe('INTERNAL');
		expect(refusal.message).toBe(GENERIC_MESSAGE);
	});

	it('kommt mit allem zurecht, was kein GraphQL-Fehler ist', () => {
		// Ein Netzwerkfehler wirft etwas ganz anderes, und auch dann muss ein anzeigbarer Satz
		// herauskommen statt „undefined" auf der Seite.
		for (const thrown of [
			new Error('fetch failed'),
			undefined,
			null,
			'kaputt',
			{ response: {} },
			{ response: { errors: 'nope' } },
			clientError([]),
			clientError([null])
		]) {
			const refusal = toRefusal(thrown);
			expect(refusal.message).toBe(GENERIC_MESSAGE);
			expect(refusal.code).toBe('UNKNOWN');
		}
	});

	it('nimmt die erste verwertbare Ablehnung', () => {
		const refusal = toRefusal(
			clientError([
				{ message: 'Nicht angemeldet.', extensions: { code: 'UNAUTHENTICATED' } },
				{ message: 'egal', extensions: { code: 'TOKEN_NOT_FOUND' } }
			])
		);

		expect(refusal.code).toBe('UNAUTHENTICATED');
	});

	it('vertraut einem bekannten Code ohne Text nicht', () => {
		const refusal = toRefusal(clientError([{ extensions: { code: 'TOKEN_NOT_FOUND' } }]));
		expect(refusal.message).toBe(GENERIC_MESSAGE);
	});
});
