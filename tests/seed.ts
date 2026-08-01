import { PERSONAS, type Persona } from './fixtures';

/**
 * Die Besetzung als SQL, für den Start eines E2E-Laufs.
 *
 * Seit das Backend Identität durchsetzt, ist eine Person ohne Zeile in `person` niemand: der
 * Proxy-Header wird gegen die Tabelle aufgelöst, und ohne Treffer antwortet jede Anfrage mit
 * 401. Vorher war das egal, weil keine Seite eine Identität brauchte — deshalb gab es diesen
 * Schritt bisher nicht.
 *
 * Erzeugt aus `PERSONAS` und nicht als Datei danebengelegt: eine zweite Liste mit denselben
 * Adressen wäre genau die Art von Duplikat, das beim Hinzufügen einer Person auseinanderläuft
 * — und der Fehler zeigte sich als 401 in einem Test, der von Personen gar nicht handelt.
 */

/** Rollen, die eine Persona im E2E-Lauf hält. Klein gehalten: mehr behauptet nur mehr. */
const ROLES: Record<string, readonly string[]> = {
	'prof.eins@example.org': ['LECTURER'],
	'prof.zwei@example.org': ['LECTURER'],
	// Vier plant — sie ist die Persona, an der eine Ausnahme sichtbar wird.
	'prof.vier@example.org': ['LECTURER', 'PROGRAMME_LEAD']
};

/** Verdoppelt einfache Anführungszeichen. Die Werte sind Konstanten aus diesem Repo, aber
 *  eine Zeichenkette, die ungeprüft in SQL wandert, ist eine Gewohnheit und keine Ausnahme. */
function quote(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

export function seedStatementsFor(personas: readonly Persona[]): string[] {
	const statements: string[] = [];

	for (const persona of personas) {
		// ON CONFLICT DO NOTHING: der Lauf startet gegen eine Datenbank, die von einem
		// früheren Lauf übrig sein kann. Ein Seed, der beim zweiten Mal scheitert, macht aus
		// „Datenbank nicht frisch" einen Testfehler, der nach einem Anwendungsfehler aussieht.
		statements.push(
			`INSERT INTO person (id, mail, name) VALUES (gen_random_uuid(), ${quote(persona.mail)}, ${quote(persona.name)}) ON CONFLICT (mail) DO NOTHING;`
		);

		for (const role of ROLES[persona.mail] ?? ['LECTURER']) {
			statements.push(
				`INSERT INTO person_role (person_id, role) SELECT id, ${quote(role)} FROM person WHERE mail = ${quote(persona.mail)} ON CONFLICT DO NOTHING;`
			);
		}
	}

	return statements;
}

/** Das vollständige Skript, so wie es an psql geht. */
export function seedSql(): string {
	return seedStatementsFor(Object.values(PERSONAS)).join('\n');
}
