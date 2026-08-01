import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from '$env/dynamic/private';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { GraphQLClient, type Variables } from 'graphql-request';
import { assumeHeaderValue } from '$lib/assumedRoles';

/**
 * Identität des laufenden Requests.
 *
 * Warum AsyncLocalStorage und nicht `event.locals` durchreichen: der SSR-Hop läuft
 * containerintern gegen `http://tallox-api:8080/query` und umgeht damit den Auth-Proxy. Das
 * Backend sieht also kein X-Remote-User, wenn wir es nicht selbst mitschicken. Es über die
 * Signatur jeder load()-Funktion und jedes /gui-api-Handlers zu fädeln wäre eine Änderung an
 * dutzenden Stellen — und eine vergessene Stelle wäre ein stiller Autorisierungsfehler.
 */
export type AuthContext = {
	remoteUser?: string;
	remoteDisplayname?: string;
	/**
	 * Die Rollenverengung aus dem Cookie, siehe $lib/assumedRoles.
	 *
	 * `undefined` heißt „nicht verengt", ein leeres Array heißt „auf gar keine Rolle verengt".
	 * Die beiden sind verschiedene Zustände und werden als „kein Header" bzw. „Header mit
	 * leerem Wert" ans Backend weitergegeben.
	 */
	assumedRoles?: string[];
};

export const authContext = new AsyncLocalStorage<AuthContext>();

function serverUrl(): string {
	// NIE auf die öffentliche URL zeigen lassen: der SSR-Prozess hat kein OIDC-Cookie und
	// bekäme die Login-Seite des IdP als HTML zurück. Symptom ist dann ein 500er auf einer
	// beliebigen Seite, nicht etwa ein 401.
	return env.TALLOX_SERVER || 'http://localhost:8080/query';
}

/**
 * GraphQL-Client für den aktuellen Request.
 *
 * Header werden immer NEU gebaut, nie aus dem eingehenden Request kopiert. Ein vom Client
 * mitgeschickter Authorization- oder X-Remote-Header darf niemals ans Backend durchgereicht
 * werden.
 */
export function backendClient(ctx?: AuthContext): GraphQLClient {
	const { remoteUser, remoteDisplayname, assumedRoles } = ctx ?? authContext.getStore() ?? {};

	const headers: Record<string, string> = {};
	if (remoteUser) headers['X-Remote-User'] = remoteUser;
	if (remoteDisplayname) headers['X-Remote-Displayname'] = remoteDisplayname;

	// Der einzige Header hier, der Rechte betrifft und trotzdem nicht vom Proxy kommt. Das ist
	// in Ordnung, weil er nur wegnehmen kann: das Backend schneidet die Auswahl mit den
	// tatsächlich gehaltenen Rollen. Der leere String ist ein gültiger Wert und bedeutet
	// „beurteile mich wie jemanden ohne jede Rolle" — deshalb die Prüfung auf undefined und
	// nicht auf truthiness.
	const assume = assumeHeaderValue(assumedRoles);
	if (assume !== undefined) headers['X-Tallox-Assume-Roles'] = assume;

	return new GraphQLClient(serverUrl(), { headers });
}

/**
 * Kurzform für den Normalfall: eine Anfrage mit der Identität des laufenden Requests.
 *
 * Nimmt bewusst nur ein `TypedDocumentNode` aus `$lib/gql/__generated__`, keinen String. Der
 * Ergebnistyp kommt damit aus dem Dokument selbst — ein `<T>`, das man von Hand danebenschreibt,
 * ist nur eine Behauptung und wird beim nächsten Schemawechsel still falsch.
 */
export function backendRequest<TResult, TVariables extends Variables>(
	document: TypedDocumentNode<TResult, TVariables>,
	variables?: TVariables
): Promise<TResult> {
	// Der Cast weitet ausschließlich den Variablen-Typparameter. graphql-request entscheidet
	// über einen bedingten Typ, ob `variables` Pflicht ist, und der lässt sich für ein noch
	// generisches TVariables nicht auflösen. Nach außen bleibt die Signatur eng.
	//
	// Bewusst KEIN Parameter für Header: die baut backendClient() aus der Identität des
	// Requests, und eine Stelle, an der ein Aufrufer welche mitgeben kann, ist die Stelle, an
	// der irgendwann ein durchgereichter Authorization-Header steht.
	const widened = document as TypedDocumentNode<TResult, Variables>;
	return backendClient().request<TResult>(widened, variables);
}
