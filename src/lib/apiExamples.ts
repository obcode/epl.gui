/**
 * Die Beispiele auf der API-Seite, als Funktionen der Endpunkt-URL.
 *
 * Nicht als Text im Markup, aus zwei Gründen. Die URL unterscheidet sich zwischen
 * Entwicklung und Produktion, und ein hartkodierter Hostname in einem öffentlichen Repository
 * wäre ohnehin nicht erlaubt. Und: ein Beispiel, das jemand zum Kopieren anbietet, sollte
 * geprüft sein — hier reicht dafür ein Modultest, im Markup bräuchte es einen Browsertest.
 */

export type Example = {
	id: string;
	label: string;
	language: string;
	code: string;
};

/**
 * Die Beispielabfrage ist bewusst `me`.
 *
 * Sie beantwortet die einzige Frage, die man am Anfang hat — funktioniert mein Token, und als
 * wen gelte ich damit — und sie funktioniert, bevor es irgendwelche Fachdaten gibt. Ein
 * Beispiel, das Daten braucht, die im leeren System nicht existieren, ist ein Beispiel, das
 * beim ersten Versuch scheitert.
 */
export const EXAMPLE_QUERY = '{ me { mail name roles } }';

export function examples(endpoint: string): Example[] {
	return [
		{
			id: 'curl',
			label: 'curl',
			language: 'bash',
			code: `export TALLOX_TOKEN=tallox_…

curl -sS ${endpoint} \\
  -H "Authorization: Bearer $TALLOX_TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"query":"${EXAMPLE_QUERY}"}'`
		},
		{
			id: 'python',
			label: 'Python',
			language: 'python',
			code: `import os, requests

response = requests.post(
    "${endpoint}",
    headers={"Authorization": f"Bearer {os.environ['TALLOX_TOKEN']}"},
    json={"query": "${EXAMPLE_QUERY}"},
    timeout=30,
)
response.raise_for_status()
print(response.json()["data"]["me"])`
		},
		{
			id: 'r',
			label: 'R',
			language: 'r',
			code: `library(httr2)

request("${endpoint}") |>
  req_auth_bearer_token(Sys.getenv("TALLOX_TOKEN")) |>
  req_body_json(list(query = "${EXAMPLE_QUERY}")) |>
  req_perform() |>
  resp_body_json()`
		}
	];
}

/**
 * Die Endpunkt-URL für Token-Aufrufe, abgeleitet aus der Browser-URL des Backends.
 *
 * `PUBLIC_TALLOX_SERVER` zeigt auf die Browser-Tür (`…/query`); die Token-Tür ist derselbe
 * Host mit einem anderen Pfad. Abgeleitet statt zusätzlich konfiguriert: eine zweite Variable
 * wäre eine zweite Stelle, die falsch stehen kann — und in Produktion würde man es erst
 * merken, wenn eine Kollegin die kopierte URL benutzt.
 */
export function tokenEndpoint(publicServerUrl: string): string {
	const base = publicServerUrl.trim().replace(/\/+$/, '');
	if (base === '') return '/api/graphql';

	// Mit oder ohne /query am Ende — beides kommt vor, je nachdem, was jemand in die
	// Umgebung geschrieben hat.
	return `${base.replace(/\/query$/, '')}/api/graphql`;
}
