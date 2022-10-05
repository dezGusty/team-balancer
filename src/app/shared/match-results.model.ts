import { Player } from './player.model';
import { MatchResultType } from './match-result.model';

export class MatchResults {
    // free comments to be set by organizer.
    public comments: string = '';

    // some games may be very imbalanced. You may decide not to take them into account.
    public recordScores: boolean = false;

    public matchResultType: MatchResultType = MatchResultType.TIE;
    public players: Player[] = [];
    public matchState: string;

    public postGameWinners: Player[] = [];
    public postGameLosers: Player[] = [];

    constructor(public date: Date) {
        this.matchState = 'draft phase';
    }
}
