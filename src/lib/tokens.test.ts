import { describe, expect, it } from 'vitest';
import { expiresIn, formatMoment, STATUS_BADGE, STATUS_LABEL, tokenStatus } from './tokens';

const NOW = new Date('2026-08-01T12:00:00+02:00');

describe('tokenStatus', () => {
	it('nennt ein gültiges Token gültig', () => {
		expect(tokenStatus({ expiresAt: '2026-12-01T00:00:00Z' }, NOW)).toBe('active');
	});

	it('erkennt Ablauf am Zeitpunkt, nicht erst danach', () => {
		// Die Grenze selbst: ein Token, das in dieser Sekunde abläuft, ist abgelaufen. Das ist
		// dieselbe Richtung, in die das Backend entscheidet (`ExpiresAt.After(now)`), und eine
		// Anzeige, die hier großzügiger wäre, würde „gültig" neben einer 401 zeigen.
		expect(tokenStatus({ expiresAt: NOW.toISOString() }, NOW)).toBe('expired');
	});

	it('sagt widerrufen, auch wenn das Token ohnehin abgelaufen wäre', () => {
		// Die Reihenfolge ist die Aussage: wer nachsieht, ob ein Widerruf gegriffen hat, will
		// „widerrufen" lesen und nicht „abgelaufen".
		const status = tokenStatus(
			{ expiresAt: '2026-01-01T00:00:00Z', revokedAt: '2026-02-01T00:00:00Z' },
			NOW
		);
		expect(status).toBe('revoked');
	});

	it('behandelt revokedAt: null wie nicht widerrufen', () => {
		expect(tokenStatus({ expiresAt: '2026-12-01T00:00:00Z', revokedAt: null }, NOW)).toBe('active');
	});
});

describe('Darstellung des Status', () => {
	it('hat für jeden Status Beschriftung und Badge', () => {
		// Ein fehlender Eintrag wäre im Markup ein leeres Badge, das niemandem auffällt.
		for (const status of ['active', 'revoked', 'expired'] as const) {
			expect(STATUS_LABEL[status]).toBeTruthy();
			expect(STATUS_BADGE[status]).toMatch(/^badge-/);
		}
	});

	it('benutzt keine Textfarben für den Status', () => {
		// `text-error` und Verwandte sind bei daisyUI Hintergrundfarben und unterschreiten als
		// Text auf hellen Themes 4.5:1 — geprüft über alle Themes in tests/contrast.spec.ts,
		// hier festgehalten, damit es gar nicht erst dorthin kommt.
		for (const badge of Object.values(STATUS_BADGE)) {
			expect(badge).not.toMatch(/^text-/);
		}
	});
});

describe('formatMoment', () => {
	it('formatiert deutsch und in Europe/Berlin', () => {
		// Fest verdrahtet, nicht nach Browser-Locale: eine Tabelle, in der das Datum je nach
		// Rechner anders aussieht, ist keine Tabelle.
		const formatted = formatMoment('2026-08-01T10:00:00Z');
		expect(formatted).toContain('2026');
		expect(formatted).toMatch(/12:00/); // 10:00 UTC ist 12:00 in Berlin
	});

	it('zeigt für fehlende und kaputte Werte einen Strich', () => {
		expect(formatMoment(null)).toBe('—');
		expect(formatMoment(undefined)).toBe('—');
		expect(formatMoment('')).toBe('—');
		// Ein unparsbarer Wert darf nicht als „Invalid Date" auf der Seite landen.
		expect(formatMoment('übermorgen')).toBe('—');
	});
});

describe('expiresIn', () => {
	it('zählt in Tagen und rundet auf', () => {
		expect(expiresIn('2026-08-13T12:00:00+02:00', NOW)).toBe('läuft in 12 Tagen ab');
	});

	it('sagt morgen statt in 1 Tagen', () => {
		expect(expiresIn('2026-08-02T12:00:00+02:00', NOW)).toBe('läuft morgen ab');
	});

	it('schweigt, wenn es nichts mehr zu zählen gibt', () => {
		// Bei abgelaufenen Tokens sagt der Status alles; eine negative Zahl daneben wäre nur
		// Lärm.
		expect(expiresIn('2026-07-01T12:00:00+02:00', NOW)).toBe('');
		expect(expiresIn('übermorgen', NOW)).toBe('');
	});
});
