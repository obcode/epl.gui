import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { graphql } from '$lib/gql/__generated__';
import type { Role } from '$lib/gql/__generated__/graphql';
import { backendRequest } from '$lib/server/backend';
import { toRefusal } from '$lib/server/graphqlError';
import { ALL_ROLES } from '$lib/roles';

const PeopleDocument = graphql(`
	query People($search: String, $includeInactive: Boolean) {
		people(search: $search, includeInactive: $includeInactive) {
			id
			mail
			name
			roles
		}
	}
`);

const CreatePersonDocument = graphql(`
	mutation CreatePerson($mail: String!, $name: String) {
		createPerson(mail: $mail, name: $name) {
			id
			mail
		}
	}
`);

const SetPersonRolesDocument = graphql(`
	mutation SetPersonRoles($id: ID!, $roles: [Role!]!, $expiresAt: Time) {
		setPersonRoles(id: $id, roles: $roles, expiresAt: $expiresAt) {
			id
			roles
		}
	}
`);

const SetPersonActiveDocument = graphql(`
	mutation SetPersonActive($id: ID!, $active: Boolean!) {
		setPersonActive(id: $id, active: $active) {
			id
		}
	}
`);

/**
 * Die Personenliste.
 *
 * `people` ist `@interactiveOnly` und ADMIN-only, also liefert das Backend hier entweder die
 * Liste oder eine Ablehnung. Die Ablehnung wird als 403 weitergereicht und nicht abgefangen:
 * wer diese Seite ohne die Rolle aufruft, soll den Grund sehen und nicht eine leere Tabelle,
 * die aussieht, als gäbe es niemanden im System. Eine leere Liste und „Du darfst das nicht"
 * sind verschiedene Auskünfte, und die erste ist die beunruhigendere.
 *
 * 403 statt des rohen Fehlers, damit `+error.svelte` einen Satz zeigt statt eines Stacktrace —
 * und mit dem Text des Backends, der auf der Allowlist in graphqlError.ts steht.
 */
export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q') ?? '';
	const includeInactive = url.searchParams.get('inaktiv') === '1';

	try {
		const data = await backendRequest(PeopleDocument, {
			search: search === '' ? null : search,
			includeInactive
		});
		return { people: data.people ?? [], search, includeInactive };
	} catch (err) {
		error(403, toRefusal(err).message);
	}
};

/**
 * Schreibende Aktionen als Form Actions und nicht als /gui-api-Proxys.
 *
 * Sie gehören zu genau dieser Seite und werden von nichts anderem gebraucht, und als Formulare
 * funktionieren sie ohne Javascript — was für den Bildschirm, auf dem der Zugang zum System
 * verwaltet wird, die richtige Eigenschaft ist. `/gui-api/` bleibt für das, was mehrere Seiten
 * teilen.
 */
export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const mail = String(form.get('mail') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();

		// Die eigentliche Prüfung steht im Backend (domain.ValidateMail) und gilt für beide
		// Türen. Hier nur der Fall, für den ein Roundtrip zu schade ist.
		if (mail === '') {
			return fail(400, { error: 'Bitte eine Mailadresse angeben.' });
		}

		try {
			await backendRequest(CreatePersonDocument, { mail, name: name === '' ? null : name });
		} catch (error) {
			return fail(400, { error: toRefusal(error).message });
		}
		return { created: mail };
	},

	roles: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		// Der ganze Satz, nicht Zu- und Abgänge: das ist es, was der Bildschirm zeigt, und
		// add/remove verliert gegen ein Rennen, sobald zwei Leute dieselbe Person offen haben.
		const roles = form
			.getAll('roles')
			.map(String)
			.filter((role): role is Role => (ALL_ROLES as readonly string[]).includes(role));

		// Eine Befristung gilt nur für die Rollen, die NEU dazukommen — so steht es im Schema.
		// „DEANS_OFFICE bis heute Abend" ist damit ein Vorgang und nicht zwei.
		const until = String(form.get('expiresAt') ?? '').trim();
		let expiresAt: string | null = null;
		if (until !== '') {
			const parsed = new Date(until);
			if (Number.isNaN(parsed.getTime())) {
				return fail(400, { error: 'Das Datum konnte nicht gelesen werden.' });
			}
			expiresAt = parsed.toISOString();
		}

		try {
			await backendRequest(SetPersonRolesDocument, { id, roles, expiresAt });
		} catch (error) {
			return fail(400, { error: toRefusal(error).message });
		}
		return { saved: id };
	},

	active: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const active = form.get('active') === '1';

		try {
			await backendRequest(SetPersonActiveDocument, { id, active });
		} catch (error) {
			// Hierher kommt unter anderem LAST_ADMIN. Der Satz stammt vom Backend und steht auf
			// der Allowlist in graphqlError.ts — er erklärt, was zu tun ist, und das ist an
			// dieser Stelle mehr wert als eine generische Formulierung.
			return fail(400, { error: toRefusal(error).message });
		}
		return { saved: id };
	}
};
