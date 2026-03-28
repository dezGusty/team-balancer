import { Player, getDisplayName } from './player.model';
import { MatchStatus } from '../matchesnew/match-status';

export class CustomPrevGame {

  public status?: MatchStatus;

  constructor(
    public team1: Array<Player>,
    public team2: Array<Player>,
    public scoreTeam1: number = 0,
    public scoreTeam2: number = 0,
    public savedResult: boolean = false,
    public appliedResults = true,
    public postResults: Array<{id: number, diff: number}>
  ) {

  }
}

