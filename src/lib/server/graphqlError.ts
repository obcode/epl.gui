/**
 * Was von einem fehlgeschlagenen Backend-Aufruf beim Benutzer ankommen darf.
 *
 * Das Backend liefert Ablehnungen als GraphQL-Fehler mit `extensions.code` und einem
 * deutschen Satz. Der **Code** ist der Vertrag zwischen den beiden Repos; der Satz ist die
 * Hälfte, die jemand nach einer Support-Frage umformuliert. Diese Datei liest deshalb den
 * Code und reicht den Satz nur durch — sie trifft keine Entscheidung anhand des Textes.
 *
 * Und sie ist die Stelle, an der die Regel aus CLAUDE.md hängt: **keine rohen
 * Backend-Fehlertexte auf Schreibpfaden**. Alles, was nicht als bewusst formulierte Ablehnung
 * erkennbar ist, wird zu einem generischen Satz — eine durchgereichte
 * Unique-Constraint-Verletzung verrät sonst, dass sich schon jemand eingetragen hat.
 */

/** Eine Ablehnung, wie die Seite sie anzeigt. */
export type BackendRefusal = {
	/** Maschinenlesbarer Code aus `extensions.code`, oder `UNKNOWN`. */
	code: string;
	/** Satz für die Anzeige. Deutsch, vom Backend oder von hier. */
	message: string;
};

/**
 * Codes, deren Text wir vom Backend übernehmen.
 *
 * Eine Allowlist und keine Denylist: ein Fehler ohne bekannten Code ist per Definition einer,
 * über den niemand nachgedacht hat, und genau dessen Text darf nicht auf die Seite. Neue
 * Codes wandern bewusst hier hinein — das ist der Moment, in dem jemand liest, was der Text
 * verrät.
 */
const PASS_THROUGH = new Set([
	'INTERACTIVE_ONLY',
	'TOKEN_DESCRIPTION_REQUIRED',
	'TOKEN_DESCRIPTION_TOO_LONG',
	'TOKEN_LIFETIME_OUT_OF_RANGE',
	'TOKEN_NOT_FOUND',
	'UNAUTHENTICATED',
	// Die Verwaltung. Anders als beim Wunsch-Schreibpfad verrät hier nichts etwas: wer diese
	// Sätze zu sehen bekommt, sitzt vor einer Liste, die ohnehin alle Personen zeigt.
	// „Diese Person gibt es schon" ist dort schlicht die nützlichere Auskunft.
	'FORBIDDEN',
	'LAST_ADMIN',
	'INVALID_MAIL',
	'INVALID_ID',
	'PERSON_EXISTS',
	'PERSON_NOT_FOUND',
	'NAME_TOO_LONG',
	'UNKNOWN_ROLE',
	'GRANT_EXPIRY_OUT_OF_RANGE'
]);

/** Was angezeigt wird, wenn der Fehler keiner der bekannten ist. */
export const GENERIC_MESSAGE = 'Das hat nicht geklappt. Bitte später erneut versuchen.';

type GraphQLErrorish = {
	message?: unknown;
	extensions?: { code?: unknown } | null;
};

/**
 * Übersetzt einen von `backendRequest` geworfenen Fehler in etwas Anzeigbares.
 *
 * graphql-request wirft einen `ClientError` mit `response.errors`; ein Netzwerkfehler wirft
 * etwas ganz anderes. Beides landet hier, und beides muss zu einem Satz führen, den man einer
 * Kollegin zeigen kann.
 */
export function toRefusal(error: unknown): BackendRefusal {
	for (const entry of graphqlErrors(error)) {
		const code = typeof entry.extensions?.code === 'string' ? entry.extensions.code : '';
		const message = typeof entry.message === 'string' ? entry.message.trim() : '';

		if (PASS_THROUGH.has(code) && message) {
			return { code, message };
		}
		if (code) {
			// Bekannter Code, unbekannter Text (oder umgekehrt): der Code hilft beim Suchen im
			// Log, der Text bleibt generisch.
			return { code, message: GENERIC_MESSAGE };
		}
	}
	return { code: 'UNKNOWN', message: GENERIC_MESSAGE };
}

/**
 * Der HTTP-Status, unter dem das Backend abgelehnt hat — oder `undefined`, wenn es gar nicht
 * geantwortet hat.
 *
 * Nötig, weil die Ablehnungen aus `internal/auth` alle denselben Code `UNAUTHENTICATED`
 * tragen und der Unterschied zwischen „für diese Kennung gibt es kein Konto" (401) und „ich
 * kann gerade niemanden prüfen, die Datenbank startet neu" (503) genau im Status steckt.
 * Ohne diese Unterscheidung wird ein Deploy zu einer Welle von Leuten, die glauben, ihr
 * Zugang sei weg.
 */
export function httpStatusOf(error: unknown): number | undefined {
	if (!error || typeof error !== 'object') return undefined;
	const status = (error as { response?: { status?: unknown } }).response?.status;
	return typeof status === 'number' ? status : undefined;
}

/** Holt die GraphQL-Fehlerliste aus dem, was graphql-request geworfen hat. */
function graphqlErrors(error: unknown): GraphQLErrorish[] {
	if (!error || typeof error !== 'object') return [];

	const response = (error as { response?: { errors?: unknown } }).response;
	if (!response || !Array.isArray(response.errors)) return [];

	return response.errors.filter(
		(entry): entry is GraphQLErrorish => !!entry && typeof entry === 'object'
	);
}
