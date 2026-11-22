// Fixture dates are relative to "now" so the sample content always looks current
// (the weekly debate is always open, comments are always recent, etc.).
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
export const ahead = (days: number, hours = 0) => new Date(Date.now() + days * DAY + hours * HOUR).toISOString();
