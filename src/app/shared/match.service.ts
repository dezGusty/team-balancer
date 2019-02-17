import { Match } from './match.model';
import { EventEmitter } from '@angular/core';
import { MatchResults } from './match-results.model';

export class MatchService {

    private archivedMatches: Match[] = [];
    private nextMatch: Match;

    nextMatchCreated = new EventEmitter<Match>();
    currentMatchCompleted = new EventEmitter<Match>();

    public constructor() {
        // this.nextMatch = null;
        console.log('[temp] creating hardcoded match for feb 21st');
        this.nextMatch = new Match(new Date(2019, 2, 21));
    }

    public getNextMatch(): Match {
        return this.nextMatch;
    }

    public createNextMatch(matchDate: Date): void {
        this.nextMatch = new Match(matchDate);
    }

    public finalizeCurrentMatch(results: MatchResults) {
        // TODO: implement
    }
}
