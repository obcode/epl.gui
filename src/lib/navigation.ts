import type { RouteId } from '$app/types';
import type { Role } from '$lib/gql/__generated__/graphql';
import { hasAnyRole } from '$lib/roles';

/**
 * Die Bereiche der Anwendung, in der Reihenfolge des Planungsprozesses.
 *
 * Bereiche ohne `href` sind noch nicht gebaut. Sie stehen trotzdem hier und werden gedämpft
 * und ohne Link dargestellt — das ist eine bewusste Entscheidung gegen zwei Alternativen:
 * eine Navigation mit einem einzigen Eintrag zeigt die Struktur des Prozesses nicht, und
 * Platzhalterseiten, die nur „kommt noch" sagen, sind Klickwege ins Leere. So ist auf einen
 * Blick sichtbar, worauf das Werkzeug hinausläuft, ohne etwas vorzutäuschen.
 *
 * Wenn ein Bereich entsteht: Route anlegen, hier `href` ergänzen — mehr nicht.
 */
export type NavItem = {
	emoji: string;
	label: string;
	href?: RouteId;
	/** Kurze Erläuterung, erscheint als title. */
	hint: string;
	/**
	 * Wer den Eintrag sieht. Fehlt das Feld, sehen ihn alle.
	 *
	 * **Kosmetik, kein Riegel.** Dieselbe API ist mit einem Personal Access Token direkt
	 * erreichbar, unter Umgehung dieser Anwendung — was hier versteckt wird, ist damit nicht
	 * geschützt, sondern nur nicht im Weg. Der Riegel steht in `internal/policy`.
	 *
	 * Was es trotzdem wert ist: eine Dozentin, die „Statistik" und „Bedarf" im Menü sieht und
	 * bei jedem Klick eine Ablehnung bekommt, lernt, Ablehnungen zu ignorieren.
	 */
	roles?: readonly Role[];
};

export const NAV_ITEMS: readonly NavItem[] = [
	{ emoji: '🏠', label: 'Start', href: '/', hint: 'Übersicht' },
	{ emoji: '📚', label: 'Module', hint: 'Modulkatalog mit Heimatstudiengang' },
	{ emoji: '🗓️', label: 'Semester', hint: 'Semester, Phasen und Meilensteine' },
	{
		emoji: '🎯',
		label: 'Bedarf',
		hint: 'Welche Instanzen müssen angeboten werden?',
		roles: ['PROGRAMME_LEAD', 'DEANS_OFFICE']
	},
	{ emoji: '✋', label: 'Wünsche', hint: 'Interesse an Instanz-Teilen bekunden' },
	{
		emoji: '🧩',
		label: 'Zuteilung',
		hint: 'Instanzen besetzen',
		roles: ['SUBJECT_GROUP_LEAD', 'PROGRAMME_LEAD', 'DEANS_OFFICE']
	},
	{
		emoji: '📊',
		label: 'Statistik',
		hint: 'Auswertungen für das Dekanat',
		roles: ['DEANS_OFFICE']
	}
];

/** Nur exakte Treffer: sonst wäre bei `/` jeder Eintrag aktiv. */
export function isActive(item: NavItem, pathname: string): boolean {
	if (!item.href) return false;
	if (item.href === '/') return pathname === '/';
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Was nicht zum Planungsprozess gehört, aber trotzdem erreichbar sein muss.
 *
 * Getrennt von NAV_ITEMS, weil die Bereichsleiste die *Schritte des Prozesses* zeigt —
 * Konto und API sind keine Schritte, sondern Werkzeuge. In die Leiste einsortiert würden sie
 * die Reihenfolge unlesbar machen, die dort der ganze Punkt ist; sie stehen deshalb im Menü
 * bei der Identität.
 */
export const ACCOUNT_ITEMS: readonly NavItem[] = [
	{
		emoji: '🔑',
		label: 'Tokens',
		href: '/konto/tokens',
		hint: 'Personal Access Tokens für eigene Auswertungen'
	},
	{
		emoji: '📖',
		label: 'API-Doku',
		href: '/api-doku',
		hint: 'Wie man die API aus einem Skript benutzt'
	},
	{
		emoji: '🛠️',
		label: 'Verwaltung',
		href: '/verwaltung/personen',
		hint: 'Wer Tallox benutzen darf, und mit welchen Rollen',
		roles: ['ADMIN']
	},
	{
		emoji: '🔍',
		label: 'Diagnose',
		href: '/verwaltung/diagnose',
		hint: 'Warum sieht jemand etwas nicht? Entscheidungen, keine Inhalte',
		roles: ['ADMIN']
	}
];

/**
 * Filtert Einträge auf die, die diese Rollen sehen sollen.
 *
 * Bekommt die **effektiven** Rollen aus `session.effectiveRoles`, nicht die gehaltenen: wer
 * sich gerade verengt hat, soll auch das Menü der verengten Rolle sehen — sonst zeigt die
 * Vorschau etwas anderes als das, wonach der Server den Request beurteilt, und beantwortet
 * damit genau die Frage nicht, für die es sie gibt.
 */
export function visibleNavItems(
	items: readonly NavItem[],
	roles: readonly string[]
): readonly NavItem[] {
	return items.filter((item) => !item.roles || hasAnyRole(roles, item.roles));
}
