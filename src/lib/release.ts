/**
 * Verknüpfung einer angezeigten Version mit ihrem Release auf GitHub.
 *
 * Beide Repos werden von semantic-release getaggt (`v1.2.3`), und die Workflows reichen genau
 * diesen Tag als Bauzeit-Variable weiter — die angezeigte Version *ist* damit der Tagname.
 */

export const REPOS = {
	gui: 'obcode/tallox.gui',
	server: 'obcode/tallox.go'
} as const;

export type Repo = keyof typeof REPOS;

/**
 * Nur eine reine `vX.Y.Z` gehört zu einem Release. Alles andere entsteht abseits eines
 * Releases und hat keine Seite, auf die man zeigen könnte:
 *
 * - `dev` — Backend ohne ldflags
 * - `v1.0.0-dirty`, `v1.0.0-3-gabc1234` — `git describe` in der lokalen Entwicklung
 * - `abc1234` — Repo ohne Tags
 *
 * Der zweite Fall ist der Grund, warum hier kein großzügiges Semver-Muster steht: `-dirty`
 * sieht wie ein Prerelease aus und ergäbe einen Link auf ein Release, das es nie gab.
 */
const RELEASE_TAG = /^v?\d+\.\d+\.\d+$/;

/** Die URL des Releases, oder `null`, wenn die Version zu keinem gehört. */
export function releaseUrl(repo: Repo, version: string): string | null {
	if (!RELEASE_TAG.test(version)) return null;
	const tag = version.startsWith('v') ? version : `v${version}`;
	return `https://github.com/${REPOS[repo]}/releases/tag/${tag}`;
}
