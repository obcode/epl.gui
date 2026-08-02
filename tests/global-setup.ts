import { execFileSync } from 'node:child_process';
import { seedSql } from './seed';

/**
 * Creates the cast before the first test runs.
 *
 * Through `psql` rather than through a Postgres client as a dependency: the GUI never speaks to
 * the database, and a library for it in `package.json` would be an invitation to do exactly
 * that one day. `psql` exists in the DevContainer and on the GitHub runner.
 *
 * Without `TALLOX_DB_URL` nothing happens. Locally the run then goes against the development
 * database, where the people usually already exist; a setup that aborted without a database
 * would make `pnpm test:e2e` unusable on a machine without Postgres, even though most tests
 * need no identity.
 */
export default function globalSetup(): void {
	const url = process.env.TALLOX_DB_URL;
	if (!url) {
		console.warn('[e2e] TALLOX_DB_URL is not set — no people will be created.');
		return;
	}

	try {
		execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-q'], {
			input: seedSql(),
			stdio: ['pipe', 'inherit', 'inherit']
		});
	} catch (error) {
		// Fail loudly. A silent failure here would produce a row of 401s in tests that are not
		// about signing in at all — and the cause would be written down nowhere.
		throw new Error(
			'[e2e] Could not create the people. Is the database running, and has the backend ' +
				'already applied its migrations?',
			{ cause: error }
		);
	}
}
