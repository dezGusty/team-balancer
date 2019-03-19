import { AngularFirestore } from 'angularfire2/firestore';
import { CustomGame } from './custom-game.model';
import { Injectable, EventEmitter } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { CustomPrevGame } from './custom-prev-game.model';

/**
 * Stores and retrieves match related information.
 */
@Injectable()
export class MatchService {
    private dataChangeSubscription: Subscription;
    private recentMatchNames: string[];
    recentMatchesChangeEvent = new EventEmitter<string>();
    matchRetrievedEvent = new EventEmitter<CustomPrevGame>();

    private individualMatchRetrieval: Subscription[] = [];

    public maxNumberOfRecentMatches = 5;

    public constructor(private db: AngularFirestore, private authSvc: AuthService) {
        if (!this.authSvc.isAuthenticated()) {
            console.log('[matches] waiting for login...');
        }

        this.authSvc.onSignInOut.subscribe((message) => {
            if (message === 'signout-pending') {
                this.unsubscribeFromDataSources();
            } else if (message === 'signin-done') {
                this.subscribeToDataSources();
            } else {
                console.log('[matches] unexpected message from auth svc: ' + message);
            }
        });

        // if already logged in, there will be no notification for signin-done.
        // simulate the event now.
        if (this.authSvc.isAuthenticated()) {
            this.subscribeToDataSources();
        }
    }

    subscribeToDataSources() {
        console.log('[matches] subscribing to data sources');

        // subscribe to firebase collection changes.
        const recentMatches = this.db.doc('matches/recent').get();
        this.dataChangeSubscription = recentMatches.subscribe(
            recentMatchesDoc => this.readRecentMatchesFromDoc(recentMatchesDoc));

    }


    public issueMatchRetrievalForDate(matchName: string) {
        this.individualMatchRetrieval.push(
            this.db.doc('matches/' + matchName).get().subscribe(item => {
                const fbData = item.data();
                const obj = {
                    team1: fbData.team1,
                    team2: fbData.team2,
                    scoreTeam1: fbData.scoreTeam1,
                    scoreTeam2: fbData.scoreTeam2,
                    appliedResults: fbData.appliedResults
                };
                const result: CustomPrevGame = obj;
                this.matchRetrievedEvent.emit(result);
            }));
    }



    readRecentMatchesFromDoc(recentMatchesDoc) {
        if (!recentMatchesDoc.exists) {
            return;
        }

        const readRecentMatchNames: string[] = recentMatchesDoc.get('items');

        if (this.recentMatchNames !== readRecentMatchNames) {
            this.recentMatchNames = readRecentMatchNames;
            this.recentMatchesChangeEvent.emit();
        }
    }

    unsubscribeFromDataSources() {
        console.log('[players] unsubscribing from data sources');
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
        }
        this.individualMatchRetrieval.forEach(subscription => {
            subscription.unsubscribe();
        });
    }


    public getRecentMatchList(): string[] {
        return this.recentMatchNames;
    }

    /**
     * Saves a given match name in the 'recent' list. If the name is already part of the list,
     * nothing happens, if it's not there already, it's added.
     * The 'recent' list is a rolling list, containing the most recent N items. Adding the N+1th item
     * will evict the oldest item from the list.
     *
     * @param matchName Match name to save into the 'recent' list.
     */
    public saveMatchNameToRecentList(matchName: string) {
        let newRecentMatches: string[] = [];
        if (this.recentMatchNames) {
            const index = this.recentMatchNames.findIndex((game) => game === matchName);
            if (index !== -1) {
                // Found.
                return;
            }

            newRecentMatches = this.recentMatchNames.slice();
        }

        newRecentMatches.push(matchName);

        if (newRecentMatches.length > this.maxNumberOfRecentMatches) {
            newRecentMatches.splice(0, 1);
        }
        const recentMatchRef = this.db.doc('/matches/recent').ref;
        const obj = { items: newRecentMatches };
        recentMatchRef.set(obj, { merge: true });

        this.readRecentMatchesFromDoc(recentMatchRef);
    }

    public saveCustomMatch(matchName: string, customGame: CustomGame) {
        const matchRef = this.db.doc('/matches/' + matchName).ref;
        const obj = { team1: customGame.team1, team2: customGame.team2 };

        matchRef.set(obj, { merge: true });

        // also update the recent list.
        this.saveMatchNameToRecentList(matchName);
    }

    public saveCustomPrevMatch(matchName: string, game: CustomPrevGame) {
        console.log('save custom prev mtch', matchName, game);
        const matchRef = this.db.doc('/matches/' + matchName).ref;
        const objScore = {
            team1: game.team1,
            team2: game.team2
        };

        let obj;

        if (game.appliedResults) {
            obj = { ...objScore, appliedResults: game.appliedResults };
        } else {
            obj = objScore;
        }

        if (game.scoreTeam1 != null) {
            obj = { ...obj, scoreTeam1: game.scoreTeam1 };
        }
        if (game.scoreTeam2 != null) {
            obj = { ...obj, scoreTeam2: game.scoreTeam2 };
        }

        console.log('save custom prev obj', obj);
        matchRef.set(obj, { merge: true });
    }
}
