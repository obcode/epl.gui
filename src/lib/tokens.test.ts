import { describe, expect, it } from 'vitest';
import { expiresIn, formatMoment, STATUS_BADGE, STATUS_LABEL, tokenStatus } from './tokens';

const NOW = new Date('2026-08-01T12:00:00+02:00');

describe('tokenStatus', () => {
	it('calls a valid token valid', () => {
		expect(tokenStatus({ expiresAt: '2026-12-01T00:00:00Z' }, NOW)).toBe('active');
	});

	it('detects expiry at the moment, not only after it', () => {
		// The boundary itself: a token expiring this second is expired. That is the same
		// direction the backend decides in (`ExpiresAt.After(now)`), and a display more generous
		// here would show "gültig" next to a 401.
		expect(tokenStatus({ expiresAt: NOW.toISOString() }, NOW)).toBe('expired');
	});

	it('says revoked even when the token would have expired anyway', () => {
		// The order is the statement: somebody checking whether a revocation took effect wants to
		// read "widerrufen" and not "abgelaufen".
		const status = tokenStatus(
			{ expiresAt: '2026-01-01T00:00:00Z', revokedAt: '2026-02-01T00:00:00Z' },
			NOW
		);
		expect(status).toBe('revoked');
	});

	it('treats revokedAt: null as not revoked', () => {
		expect(tokenStatus({ expiresAt: '2026-12-01T00:00:00Z', revokedAt: null }, NOW)).toBe('active');
	});
});

describe('status presentation', () => {
	it('has a label and a badge for every status', () => {
		// A missing entry would be an empty badge in the markup that nobody notices.
		for (const status of ['active', 'revoked', 'expired'] as const) {
			expect(STATUS_LABEL[status]).toBeTruthy();
			expect(STATUS_BADGE[status]).toMatch(/^badge-/);
		}
	});

	it('uses no text colours for the status', () => {
		// `text-error` and its relatives are background colours in daisyUI and fall below 4.5:1
		// as text on the light themes — measured across all themes in tests/contrast.spec.ts, and
		// pinned here so it does not get that far in the first place.
		for (const badge of Object.values(STATUS_BADGE)) {
			expect(badge).not.toMatch(/^text-/);
		}
	});
});

describe('formatMoment', () => {
	it('formats in German and in Europe/Berlin', () => {
		// Hard-wired rather than following the browser locale: a table in which the date looks
		// different depending on the machine is not a table.
		const formatted = formatMoment('2026-08-01T10:00:00Z');
		expect(formatted).toContain('2026');
		expect(formatted).toMatch(/12:00/); // 10:00 UTC is 12:00 in Berlin
	});

	it('shows a dash for missing and broken values', () => {
		expect(formatMoment(null)).toBe('—');
		expect(formatMoment(undefined)).toBe('—');
		expect(formatMoment('')).toBe('—');
		// An unparseable value must not land on the page as "Invalid Date".
		expect(formatMoment('übermorgen')).toBe('—');
	});
});

describe('expiresIn', () => {
	it('counts in days and rounds up', () => {
		expect(expiresIn('2026-08-13T12:00:00+02:00', NOW)).toBe('läuft in 12 Tagen ab');
	});

	it('says tomorrow rather than in 1 days', () => {
		expect(expiresIn('2026-08-02T12:00:00+02:00', NOW)).toBe('läuft morgen ab');
	});

	it('stays silent when there is nothing left to count', () => {
		// For expired tokens the status says everything; a negative number next to it would just
		// be noise.
		expect(expiresIn('2026-07-01T12:00:00+02:00', NOW)).toBe('');
		expect(expiresIn('übermorgen', NOW)).toBe('');
	});
});
