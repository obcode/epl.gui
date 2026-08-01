import type { RouteId } from '$app/types';

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
};

export const NAV_ITEMS: readonly NavItem[] = [
	{ emoji: '🏠', label: 'Start', href: '/', hint: 'Übersicht' },
	{ emoji: '📚', label: 'Module', hint: 'Modulkatalog mit Heimatstudiengang' },
	{ emoji: '🗓️', label: 'Semester', hint: 'Semester, Phasen und Meilensteine' },
	{ emoji: '🎯', label: 'Bedarf', hint: 'Welche Instanzen müssen angeboten werden?' },
	{ emoji: '✋', label: 'Wünsche', hint: 'Interesse an Instanz-Teilen bekunden' },
	{ emoji: '🧩', label: 'Zuteilung', hint: 'Instanzen besetzen' },
	{ emoji: '📊', label: 'Statistik', hint: 'Auswertungen für das Dekanat' }
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
	}
];
