import type { ServerBuildInfo } from '$lib/buildInfo';
import { graphql } from '$lib/gql/__generated__';
import { backendRequest } from './backend';

const BuildInfoQuery = graphql(`
	query BuildInfo {
		buildInfo {
			version
			commit
			builtAt
		}
	}
`);

/**
 * Versionsstempel des Backends für den Footer.
 *
 * Schluckt jeden Fehler und liefert dann `null`. Das ist hier kein nachlässiges
 * Fehler-Handling, sondern die eigentliche Anforderung: der Footer hängt an jeder Seite, und
 * ein nicht erreichbares Backend darf nicht dazu führen, dass jede einzelne Seite mit 500
 * antwortet — gerade während eines Deploys, wenn der API-Container gerade neu startet, wäre
 * das die Fehlermeldung, die man am wenigsten gebrauchen kann. Der Footer zeigt dann „—",
 * und genau das ist die nützliche Information.
 */
export async function loadServerBuildInfo(): Promise<ServerBuildInfo | null> {
	try {
		const data = await backendRequest(BuildInfoQuery);
		return data.buildInfo;
	} catch {
		return null;
	}
}
