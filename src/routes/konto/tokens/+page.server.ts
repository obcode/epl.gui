import { fail } from '@sveltejs/kit';
import { graphql } from '$lib/gql/__generated__';
import { backendRequest } from '$lib/server/backend';
import { toRefusal } from '$lib/server/graphqlError';
import type { Actions, PageServerLoad } from './$types';

const MyTokens = graphql(`
	query MyTokens {
		myTokens {
			id
			description
			createdAt
			expiresAt
			lastUsedAt
			revokedAt
		}
	}
`);

const CreateToken = graphql(`
	mutation CreatePersonalAccessToken($description: String!, $expiresInDays: Int) {
		createPersonalAccessToken(description: $description, expiresInDays: $expiresInDays) {
			secret
			token {
				id
				description
				createdAt
				expiresAt
				lastUsedAt
				revokedAt
			}
		}
	}
`);

const RevokeToken = graphql(`
	mutation RevokePersonalAccessToken($id: ID!) {
		revokePersonalAccessToken(id: $id) {
			id
		}
	}
`);

/**
 * `myTokens` ist im Schema nullable, und das ist keine Nachlässigkeit: über ein Personal
 * Access Token antwortet das Feld `null` statt die ganze Anfrage scheitern zu lassen. Diese
 * Seite läuft über die Browser-Tür, sieht also immer eine Liste — die Unterscheidung steht
 * hier trotzdem, weil `null` und „keine Tokens" zwei verschiedene Sachverhalte sind und die
 * Seite den ersten nicht als den zweiten darstellen darf.
 */
export const load: PageServerLoad = async () => {
	const data = await backendRequest(MyTokens);
	return { tokens: data.myTokens ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const description = String(form.get('description') ?? '');
		const rawDays = String(form.get('expiresInDays') ?? '').trim();

		// Die Gültigkeit wird im Backend geprüft, nicht hier — hier wird nur übersetzt, was
		// ein Formularfeld liefert. Eine zweite Grenze in der GUI wäre eine zweite Wahrheit.
		const expiresInDays = rawDays === '' ? null : Number(rawDays);
		if (expiresInDays !== null && !Number.isInteger(expiresInDays)) {
			return fail(400, {
				code: 'TOKEN_LIFETIME_OUT_OF_RANGE',
				message: 'Bitte eine ganze Zahl von Tagen angeben.',
				description
			});
		}

		try {
			const data = await backendRequest(CreateToken, { description, expiresInDays });
			// Das Klartext-Token wandert genau einmal hierher zurück und wird nirgends
			// gespeichert — nicht in der Session, nicht in einem Cookie, nicht im Log. Wer es
			// verliert, legt ein neues an und widerruft dieses.
			return { created: data.createPersonalAccessToken };
		} catch (error) {
			const refusal = toRefusal(error);
			return fail(400, { ...refusal, description });
		}
	},

	revoke: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		try {
			await backendRequest(RevokeToken, { id });
			return { revoked: id };
		} catch (error) {
			return fail(400, toRefusal(error));
		}
	}
};
