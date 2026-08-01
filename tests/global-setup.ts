import { execFileSync } from 'node:child_process';
import { seedSql } from './seed';

/**
 * Legt die Besetzung an, bevor der erste Test läuft.
 *
 * Über `psql` und nicht über einen Postgres-Client als Abhängigkeit: die GUI spricht nie mit
 * der Datenbank, und eine Bibliothek dafür in `package.json` wäre eine Einladung, das eines
 * Tages doch zu tun. `psql` gibt es im DevContainer und auf dem GitHub-Runner.
 *
 * Ohne `TALLOX_DB_URL` passiert nichts. Lokal läuft der Lauf dann gegen die
 * Entwicklungsdatenbank, in der die Personen meist schon stehen; ein Setup, das ohne
 * Datenbank abbricht, würde `pnpm test:e2e` auf einem Rechner ohne Postgres unbenutzbar
 * machen, obwohl die meisten Tests keine Identität brauchen.
 */
export default function globalSetup(): void {
	const url = process.env.TALLOX_DB_URL;
	if (!url) {
		console.warn('[e2e] TALLOX_DB_URL ist nicht gesetzt — Personen werden nicht angelegt.');
		return;
	}

	try {
		execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-q'], {
			input: seedSql(),
			stdio: ['pipe', 'inherit', 'inherit']
		});
	} catch (error) {
		// Laut scheitern. Ein stiller Fehlschlag hier ergäbe eine Reihe von 401ern in Tests,
		// die von Anmeldung gar nicht handeln — und die Ursache stünde nirgends.
		throw new Error(
			'[e2e] Personen konnten nicht angelegt werden. Läuft die Datenbank, und hat das ' +
				'Backend seine Migrationen schon angewandt?',
			{ cause: error }
		);
	}
}
