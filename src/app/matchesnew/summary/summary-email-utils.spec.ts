import { formatEventsDatePart, generateEmailSubjectForMatches, parseDateComponents } from './summary-email-utils';
import { GameEventData } from '../history/data-access/create-game-request.model';
import { MatchStatus } from '../match-status';

describe('summary-email-utils', () => {
  function createMockMatch(date: string, playerCount: number, inactive = false): GameEventData {
    return {
      appliedRandomization: false,
      matchDate: date,
      name: date,
      label: '20:00',
      inactive,
      matchStatus: MatchStatus.Unknown,
      registeredPlayers: Array.from({ length: playerCount }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        stars: 0,
        reserve: false
      }))
    };
  }

  describe('parseDateComponents', () => {
    it('should parse YYYY-MM-DD correctly', () => {
      // 2026-10-06 is a Tuesday (getDay() === 2)
      const res = parseDateComponents('2026-10-06');
      expect(res.year).toBe(2026);
      expect(res.month).toBe(9); // 0-indexed October
      expect(res.day).toBe(6);
      expect(res.dayOfWeek).toBe(2);
    });
  });

  describe('formatEventsDatePart', () => {
    it('should format dates in the same month', () => {
      const dates = [
        { month: 9, day: 6 },
        { month: 9, day: 8 }
      ];
      expect(formatEventsDatePart(dates)).toBe('oct 06,08');
    });

    it('should format dates across different months', () => {
      const dates = [
        { month: 8, day: 29 },
        { month: 9, day: 1 }
      ];
      expect(formatEventsDatePart(dates)).toBe('sep 29,oct 01');
    });

    it('should format single date', () => {
      const dates = [{ month: 9, day: 6 }];
      expect(formatEventsDatePart(dates)).toBe('oct 06');
    });
  });

  describe('generateEmailSubjectForMatches', () => {
    it('should generate subject for 2 events in the same month (Tuesday, Thursday)', () => {
      // 2026-10-06 is Tuesday (M), 2026-10-08 is Thursday (J)
      const matches = [
        createMockMatch('2026-10-06', 8),
        createMockMatch('2026-10-08', 5)
      ];

      const subject = generateEmailSubjectForMatches(matches);
      expect(subject).toBe('[fotbal] ⚽  M,J oct 06,08- 8, 5');
    });

    it('should generate subject for 2 events spanning two months', () => {
      // 2026-09-29 is Tuesday (M), 2026-10-01 is Thursday (J)
      const matches = [
        createMockMatch('2026-09-29', 8),
        createMockMatch('2026-10-01', 5)
      ];

      const subject = generateEmailSubjectForMatches(matches);
      expect(subject).toBe('[fotbal] ⚽ M,J sep 29,oct 01- 8, 5');
    });

    it('should ignore inactive matches', () => {
      const matches = [
        createMockMatch('2026-10-06', 8, false),
        createMockMatch('2026-10-07', 10, true), // inactive Wednesday
        createMockMatch('2026-10-08', 5, false)
      ];

      const subject = generateEmailSubjectForMatches(matches);
      expect(subject).toBe('[fotbal] ⚽ M,J oct 06,08- 8, 5');
    });

    it('should fallback when no active matches', () => {
      expect(generateEmailSubjectForMatches([])).toBe('[fotbal] ⚽ Update');
      expect(generateEmailSubjectForMatches([createMockMatch('2026-10-06', 8, true)])).toBe('[fotbal] ⚽ Update');
    });
  });
});
