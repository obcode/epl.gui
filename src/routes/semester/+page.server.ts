import { error, fail } from '@sveltejs/kit';
import { graphql } from '$lib/gql/__generated__';
import type { Phase } from '$lib/gql/__generated__/graphql';
import { backendRequest } from '$lib/server/backend';
import { toRefusal } from '$lib/server/graphqlError';
import type { Actions, PageServerLoad } from './$types';

const SemestersDocument = graphql(`
	query Semesters {
		semesters {
			id
			code
			phase
			reachablePhases
			wishesPublishedAt
		}
	}
`);

const CreateSemesterDocument = graphql(`
	mutation CreateSemester($code: String!) {
		createSemester(code: $code) {
			id
			code
		}
	}
`);

const AdvancePhaseDocument = graphql(`
	mutation AdvanceSemesterPhase($id: ID!, $to: Phase!) {
		advanceSemesterPhase(id: $id, to: $to) {
			id
			phase
		}
	}
`);

const PublishWishesDocument = graphql(`
	mutation PublishWishes($id: ID!) {
		publishWishes(id: $id) {
			id
			wishesPublishedAt
		}
	}
`);

/**
 * The list of semesters, and where each one stands.
 *
 * `semesters` requires a signed-in identity but no particular role — the phase is the answer to
 * "may I enter my wishes yet", and every lecturer needs it. A refusal here therefore means the
 * caller has no account at all, which the root layout already turns into its own page; passing
 * it on as a 403 keeps the two from being confused.
 */
export const load: PageServerLoad = async () => {
	try {
		const data = await backendRequest(SemestersDocument);
		return { semesters: data.semesters };
	} catch (err) {
		error(403, toRefusal(err).message);
	}
};

/**
 * The writes as form actions rather than /gui-api proxies.
 *
 * They belong to this page and nothing else needs them, and as forms they work without
 * JavaScript. For the screen the dean's office runs the process from, that is the right
 * property: switching a phase during a meeting should not depend on a bundle having loaded.
 */
export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const code = String(form.get('code') ?? '').trim();

		// The real validation is in the backend and applies to both doors — see
		// domain.ErrSemesterCodeInvalid. Only the case a round trip would be a waste on is
		// handled here.
		if (code === '') {
			return fail(400, { code: 'SEMESTER_CODE_INVALID', message: 'Bitte ein Semester angeben.' });
		}

		try {
			await backendRequest(CreateSemesterDocument, { code });
		} catch (err) {
			return fail(400, toRefusal(err));
		}
		return { created: code };
	},

	advance: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const to = String(form.get('to') ?? '') as Phase;

		try {
			await backendRequest(AdvancePhaseDocument, { id, to });
		} catch (err) {
			// PHASE_MOVED_ON arrives here: somebody else switched the semester between this page
			// rendering and the click. Its sentence asks for a reload, which is the useful
			// instruction — the page in front of the user is simply out of date.
			return fail(400, toRefusal(err));
		}
		return { advanced: id };
	},

	publish: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		// No second confirmation here. The one in the page is a dialogue for the person; a check
		// in this handler would be a rule, and the rule about who may publish lives in the
		// backend, where the token door meets it too.
		try {
			await backendRequest(PublishWishesDocument, { id });
		} catch (err) {
			return fail(400, toRefusal(err));
		}
		return { published: id };
	}
};
