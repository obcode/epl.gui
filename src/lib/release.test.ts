import { describe, expect, it } from 'vitest';
import { releaseUrl } from './release';

describe('releaseUrl', () => {
	it('zeigt auf den Tag des jeweiligen Repos', () => {
		expect(releaseUrl('gui', 'v1.1.0')).toBe(
			'https://github.com/obcode/tallox.gui/releases/tag/v1.1.0'
		);
		expect(releaseUrl('server', 'v1.1.0')).toBe(
			'https://github.com/obcode/tallox.go/releases/tag/v1.1.0'
		);
	});

	it('ergänzt ein fehlendes v-Präfix', () => {
		expect(releaseUrl('gui', '1.1.0')).toBe(
			'https://github.com/obcode/tallox.gui/releases/tag/v1.1.0'
		);
	});

	// Das ist der eigentliche Zweck der Funktion: die Versionen, die NICHT verlinkt werden.
	// `-dirty` und `-3-gabc1234` kommen von `git describe` in der lokalen Entwicklung und
	// sähen als Semver-Prerelease durch — der Link ginge auf ein Release, das es nie gab.
	it('verlinkt nichts, was zu keinem Release gehört', () => {
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
