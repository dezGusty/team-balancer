import { GameEventData } from '../history/data-access/create-game-request.model';

export const ROMANIAN_DAY_INITIALS: { [dayOfWeek: number]: string } = {
  0: 'D', // Duminică
  1: 'L', // Luni
  2: 'M', // Marți
  3: 'M', // Miercuri
  4: 'J', // Joi
  5: 'V', // Vineri
  6: 'S', // Sâmbătă
};

export const ROMANIAN_MONTHS: string[] = [
  'ian', // Ianuarie
  'feb', // Februarie
  'mar', // Martie
  'apr', // Aprilie
  'mai', // Mai
  'iun', // Iunie
  'iul', // Iulie
  'aug', // August
  'sep', // Septembrie
  'oct', // Octombrie
  'nov', // Noiembrie
  'dec', // Decembrie
];

/**
 * Parses a YYYY-MM-DD date string into year, 0-based month, and day components safely without timezone shift.
 */
export function parseDateComponents(dateStr: string): { year: number; month: number; day: number; dayOfWeek: number } {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 1970;
  const month = (parts[1] || 1) - 1; // 0-based
  const day = parts[2] || 1;
  const dateObj = new Date(year, month, day);
  return { year, month, day, dayOfWeek: dateObj.getDay() };
}

/**
 * Formats date groups for the email subject.
 * E.g.
 * - Same month: "oct 06,08"
 * - Different months: "sep 29,oct 01"
 */
export function formatEventsDatePart(dates: { month: number; day: number }[]): string {
  if (dates.length === 0) return '';
  let result = '';
  let prevMonth = -1;

  dates.forEach((d, idx) => {
    const monthName = ROMANIAN_MONTHS[d.month] ?? '';
    const dayStr = String(d.day).padStart(2, '0');

    if (idx === 0) {
      result = `${monthName} ${dayStr}`;
    } else if (d.month === prevMonth) {
      result += `,${dayStr}`;
    } else {
      result += `,${monthName} ${dayStr}`;
    }
    prevMonth = d.month;
  });

  return result;
}

/**
 * Generates the email subject for a list of active matches.
 * Format: [fotbal] M,J oct 06,08- 8, 5
 */
export function generateEmailSubjectForMatches(matches: GameEventData[]): string {
  const localMatches = matches.filter(m => !m.inactive);
  if (localMatches.length === 0) {
    return '[fotbal] ⚽ Update';
  }

  const parsedEvents = localMatches.map(m => {
    const comp = parseDateComponents(m.matchDate);
    return {
      match: m,
      comp,
      initial: ROMANIAN_DAY_INITIALS[comp.dayOfWeek] ?? '',
      playerCount: m.registeredPlayers?.length ?? 0
    };
  });

  const daysPart = parsedEvents.map(e => e.initial).join(',');
  const datesPart = formatEventsDatePart(parsedEvents.map(e => ({ month: e.comp.month, day: e.comp.day })));
  const countsPart = parsedEvents.map(e => e.playerCount).join(', ');

  return `[fotbal] ⚽ ${daysPart} ${datesPart}- ${countsPart}`;
}
