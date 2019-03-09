// import { Match } from './match.model';
// import { EventEmitter } from '@angular/core';
// import { MatchResults } from './match-results.model';
import { AngularFirestore } from 'angularfire2/firestore';
import { CustomGame } from './custom-game.model';
import { Injectable } from '@angular/core';

/**
 * Stores and retrieves match related information.
 */
@Injectable()
export class MatchService {

    // private archivedMatches: Match[] = [];
    // private nextMatch: Match;

    // nextMatchCreated = new EventEmitter<Match>();
    // currentMatchCompleted = new EventEmitter<Match>();

    public constructor(private db: AngularFirestore) {
        // this.nextMatch = null;
        // console.log('[temp] creating hardcoded match for feb 21st');
        // this.nextMatch = new Match(new Date(2019, 2, 21));
    }

    // public getNextMatch(): Match {
    //     return this.nextMatch;
    // }

    // public createNextMatch(matchDate: Date): void {
    //     this.nextMatch = new Match(matchDate);
    // }

    // public finalizeCurrentMatch(results: MatchResults) {
    //     // TODO: implement
    // }

    public getRecentMatchList() {
        const matchesColRef = this.db.doc('/matches/recent').ref;

        // TODO: implement; return list of items from fixed document.
        // TODO: add update of fixed document when changing the /matches/*
    }

    public saveCustomMatch(matchName: string, customGame: CustomGame) {
        console.log('[match-svc] saving custom match for ', matchName);
        const matchRef = this.db.doc('/matches/' + matchName).ref;
        const obj = { team1: customGame.team1, team2: customGame.team2 };

        matchRef.set(obj, { merge: true });
    }
}
