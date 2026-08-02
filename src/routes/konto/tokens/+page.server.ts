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
 * `myTokens` is nullable in the schema, and that is not sloppiness: through a Personal Access
 * Token the field answers `null` instead of failing the whole request. This page runs through
 * the browser door and therefore always sees a list — the distinction is written out anyway,
 * because `null` and "no tokens" are two different facts and the page must not present the
 * first as the second.
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

		// The lifetime is checked in the backend, not here — here only what a form field delivers
		// is translated. A second limit in the GUI would be a second truth.
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
			// The plaintext token comes back here exactly once and is stored nowhere — not in the
			// session, not in a cookie, not in the log. Anybody who loses it creates a new one
			// and revokes this one.
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
