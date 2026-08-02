/**
 * The examples on the API page, as functions of the endpoint URL.
 *
 * Not as text in the markup, for two reasons. The URL differs between development and
 * production, and a hard-coded hostname in a public repository would not be allowed anyway.
 * And an example offered for copying ought to be checked — here a module test is enough, in
 * markup it would take a browser test.
 */

export type Example = {
	id: string;
	label: string;
	language: string;
	code: string;
};

/**
 * The example query is deliberately `me`.
 *
 * It answers the only question anybody has at the start — does my token work, and who am I
 * with it — and it works before there is any domain data at all. An example that needs data
 * which does not exist in an empty system is an example that fails on the first try.
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
 * The endpoint URL for token calls, derived from the backend's browser URL.
 *
 * `PUBLIC_TALLOX_SERVER` points at the browser door (`…/query`); the token door is the same
 * host with a different path. Derived rather than configured separately: a second variable
 * would be a second place that can be wrong — and in production it would only be noticed when
 * a colleague uses the URL she copied.
 */
export function tokenEndpoint(publicServerUrl: string): string {
	const base = publicServerUrl.trim().replace(/\/+$/, '');
	if (base === '') return '/api/graphql';

	// With or without a trailing /query — both occur, depending on what somebody wrote into
	// the environment.
	return `${base.replace(/\/query$/, '')}/api/graphql`;
}
