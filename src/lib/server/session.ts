import { graphql } from '$lib/gql/__generated__';
import type { SessionQuery } from '$lib/gql/__generated__/graphql';
import { backendRequest } from './backend';
import { httpStatusOf } from './graphqlError';

const SessionDocument = graphql(`
	query Session {
		session {
			narrowed
			interactive
			effectiveRoles
			grantedRoles
			person {
				id
				mail
				name
			}
		}
	}
`);

export type SessionInfo = SessionQuery['session'];

/**
 * Was beim Laden der Sitzung herauskommen kann.
 *
 * Drei Ausgänge und nicht zwei, weil „das Backend antwortet nicht" und „dieses Konto darf
 * nicht" für die Benutzerin völlig verschiedene Nachrichten sind — und weil die zweite bisher
 * als die erste angezeigt wurde. Wer eine HM-Kennung hat, aber keine Zeile in `person`, kam
 * durch den Auth-Proxy und bekam vom Backend einen 401; die GUI schluckte den und schrieb
 * „Backend nicht erreichbar" in den Footer. Die nützliche Auskunft wäre gewesen: „Du hast
 * keinen Zugang, wende Dich an die Administration."
 */
export type SessionResult =
	| { kind: 'ok'; session: SessionInfo }
	/** Angemeldet beim IdP, aber diese Installation kennt die Kennung nicht (oder nicht mehr). */
	| { kind: 'no-access'; message: string }
	/** Backend weg, Datenbank weg, Deploy läuft. Vorübergehend, und nicht die Schuld der Person. */
	| { kind: 'unreachable' };

/** Was angezeigt wird, wenn das Backend keinen eigenen Satz mitgeliefert hat. */
export const NO_ACCESS_MESSAGE =
	'Für diese Kennung gibt es in Tallox kein Konto. Bitte bei der Administration melden.';

/**
 * Lädt die Sitzung und ordnet den Fehlerfall ein.
 *
 * Die Unterscheidung hängt am HTTP-Status, nicht am Fehlercode: die Ablehnungen aus
 * `internal/auth` tragen alle `UNAUTHENTICATED`, und der Unterschied zwischen „kein Konto"
 * (401) und „ich kann gerade niemanden prüfen" (503) steckt genau im Status. Das ist im
 * Backend eine bewusste Entscheidung — einer Kollegin zu sagen, ihr Zugang sei ungültig,
 * während die Datenbank neu startet, ist der Weg zu einem Ticket über ein Problem, das es
 * nicht gibt.
 */
export async function loadSession(): Promise<SessionResult> {
	try {
		const data = await backendRequest(SessionDocument);
		return { kind: 'ok', session: data.session };
	} catch (error) {
		if (httpStatusOf(error) === 401) {
			return { kind: 'no-access', message: refusalMessage(error) };
		}
		return { kind: 'unreachable' };
	}
}

/**
 * Der Satz des Backends, wenn es einen mitgeschickt hat.
 *
 * Hier ausnahmsweise durchgereicht statt über die Allowlist in graphqlError.ts: die
 * Ablehnungen von `internal/auth` sind für genau diese Situation geschriebene deutsche Sätze
 * („Dieses Konto ist deaktiviert"), und sie unterscheiden Fälle, die die Person kennen muss.
 * Sie entstehen vor jedem Datenzugriff und können deshalb nichts über Daten verraten.
 */
function refusalMessage(error: unknown): string {
	const errors = (error as { response?: { errors?: { message?: unknown }[] } })?.response?.errors;
	const first = errors?.[0]?.message;
	return typeof first === 'string' && first.trim() !== '' ? first.trim() : NO_ACCESS_MESSAGE;
}
