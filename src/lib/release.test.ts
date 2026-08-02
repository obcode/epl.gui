import { describe, expect, it } from 'vitest';
import { releaseUrl } from './release';

describe('releaseUrl', () => {
	it('points at the tag of the respective repository', () => {
		expect(releaseUrl('gui', 'v1.1.0')).toBe(
			'https://github.com/obcode/tallox.gui/releases/tag/v1.1.0'
		);
		expect(releaseUrl('server', 'v1.1.0')).toBe(
			'https://github.com/obcode/tallox.go/releases/tag/v1.1.0'
		);
	});

	it('adds a missing v prefix', () => {
		expect(releaseUrl('gui', '1.1.0')).toBe(
			'https://github.com/obcode/tallox.gui/releases/tag/v1.1.0'
		);
	});

	// This is the function's actual purpose: the versions that are NOT linked. `-dirty` and
	// `-3-gabc1234` come from `git describe` during local development and would pass as a semver
	// prerelease — the link would point at a release that never existed.
	it('links nothing that belongs to no release', () => {
		for (const version of [
			'dev',
			'unknown',
			'v1.0.0-dirty',
			'v1.0.0-3-gabc1234',
			'v1.0.0-3-gabc1234-dirty',
			'abc1234',
			''
		]) {
			expect(releaseUrl('gui', version), version).toBeNull();
		}
	});
});
