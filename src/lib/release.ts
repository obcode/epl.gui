/**
 * Linking a displayed version to its release on GitHub.
 *
 * Both repositories are tagged by semantic-release (`v1.2.3`), and the workflows pass exactly
 * that tag through as a build-time variable — so the displayed version *is* the tag name.
 */

export const REPOS = {
	gui: 'obcode/tallox.gui',
	server: 'obcode/tallox.go'
} as const;

export type Repo = keyof typeof REPOS;

/**
 * Only a plain `vX.Y.Z` belongs to a release. Everything else comes into being away from one
 * and has no page to point at:
 *
 * - `dev` — the backend built without ldflags
 * - `v1.0.0-dirty`, `v1.0.0-3-gabc1234` — `git describe` during local development
 * - `abc1234` — a repository with no tags
 *
 * The second case is why there is no generous semver pattern here: `-dirty` looks like a
 * prerelease and would produce a link to a release that never existed.
 */
const RELEASE_TAG = /^v?\d+\.\d+\.\d+$/;

/** The release URL, or `null` when the version does not belong to one. */
export function releaseUrl(repo: Repo, version: string): string | null {
	if (!RELEASE_TAG.test(version)) return null;
	const tag = version.startsWith('v') ? version : `v${version}`;
	return `https://github.com/${REPOS[repo]}/releases/tag/${tag}`;
}
