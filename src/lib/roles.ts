import type { Role } from '$lib/gql/__generated__/graphql';

/**
 * Die Rollen auf Deutsch.
 *
 * Hier passiert die Übersetzung, die das Backend bewusst nicht macht: dort heißt alles
 * englisch, weil dort alles englisch heißt, und die Zuordnung zur Fakultätssprache steht
 * genau einmal — im Doc-Kommentar von `policy.Role` und hier. Zwei Stellen, keine dritte.
 */
export const ROLE_LABELS: Record<Role, string> = {
	LECTURER: 'Dozent:in',
	SUBJECT_GROUP_LEAD: 'Fachgruppenleitung',
	PROGRAMME_LEAD: 'Studiengangsleitung',
	DEANS_OFFICE: 'Dekanat',
	ADMIN: 'Administration'
};

/**
 * Kurzbeschreibung, was eine Rolle darf. Erscheint in der Verwaltung neben der Checkbox,
 * damit „was gebe ich dieser Person eigentlich" nicht aus dem Namen erraten werden muss.
 */
export const ROLE_HINTS: Record<Role, string> = {
	LECTURER: 'Eigenes Profil, eigene Kompetenzen, eigene Wünsche. Hat fast jede:r.',
	SUBJECT_GROUP_LEAD: 'Besetzt die Instanzen einer Fachgruppe.',
	PROGRAMME_LEAD: 'Meldet den Bedarf eines Studiengangs an.',
	DEANS_OFFICE: 'Liest studiengangsübergreifend, pflegt die Deputats-Ampel.',
	ADMIN: 'Verwaltet Personen, Rollen und Tokens. Liest bewusst keine Wünsche.'
};

/**
 * Die Reihenfolge, in der Rollen angezeigt werden: „wie viel vom Prozess berührt die Rolle".
 * Dieselbe wie `policy.AllRoles()`, damit eine Liste hier und eine Liste dort gleich aussehen.
 */
export const ALL_ROLES: readonly Role[] = [
	'LECTURER',
	'SUBJECT_GROUP_LEAD',
	'PROGRAMME_LEAD',
	'DEANS_OFFICE',
	'ADMIN'
] as const;

/** Beschriftung für eine Rolle, mit dem rohen Wert als Rückfall. */
export function roleLabel(role: string): string {
	return ROLE_LABELS[role as Role] ?? role;
}

/** Mehrere Rollen als lesbare Aufzählung, in der Reihenfolge von ALL_ROLES. */
export function roleLabels(roles: readonly string[]): string {
	return sortRoles(roles).map(roleLabel).join(', ');
}

/** Sortiert Rollen in die Anzeigereihenfolge. Unbekannte wandern ans Ende. */
export function sortRoles(roles: readonly string[]): string[] {
	return [...roles].sort((a, b) => {
		const ia = ALL_ROLES.indexOf(a as Role);
		const ib = ALL_ROLES.indexOf(b as Role);
		return (ia < 0 ? ALL_ROLES.length : ia) - (ib < 0 ? ALL_ROLES.length : ib);
	});
}

/** Hält diese Rollenmenge mindestens eine der genannten? */
export function hasAnyRole(held: readonly string[], wanted: readonly Role[]): boolean {
	return wanted.some((role) => held.includes(role));
}

/**
 * Name einer Person, wie er angezeigt wird.
 *
 * Ein leerer Name ist der Normalfall und kein Fehler: angelegt wird mit der Mailadresse
 * allein, weil sie das Einzige ist, was stimmen muss. Der Name kommt später — von der Person
 * selbst oder aus dem ZPA. Bis dahin ist die Adresse die ehrlichste Anzeige; einen Namen aus
 * ihr abzuleiten rät, wie Leute sich selbst schreiben, und liegt bei jedem Titel, jedem
 * Doppelnamen und jedem Umlaut daneben.
 */
export function displayName(person: { name?: string | null; mail: string }): string {
	const name = person.name?.trim();
	return name && name.length > 0 ? name : person.mail;
}
