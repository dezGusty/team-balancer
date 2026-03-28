/**
 * Describes the validity/outcome of a game event.
 *
 * - `valid`        – match was played, result is valid.
 * - `unbalanced`   – match was played but was very unbalanced; result is informational only.
 * - `not_played`   – match did not take place (force majeure, no-show, etc.).
 * - `unknown`      – match is upcoming, or the organizer has not yet entered a result.
 */
export enum MatchStatus {
  Valid = 'valid',
  Unbalanced = 'unbalanced',
  NotPlayed = 'not_played',
  Unknown = 'unknown',
}