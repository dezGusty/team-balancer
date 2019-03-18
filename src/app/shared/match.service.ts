import { AngularFirestore } from 'angularfire2/firestore';
import { CustomGame } from './custom-game.model';
import { Injectable, EventEmitter } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';

/**
 * Stores and retrieves match related information.
 */
@Injectable()
export class MatchService {
    private dataChangeSubscription: Subscription;
    private recentMatchNames: string[];
    recentMatchesChangeEvent = new EventEmitter<string>();

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

    readRecentMatchesFromDoc(recentMatchesDoc) {
        if (!recentMatchesDoc.exists) {
            return;
        }

        const readRecentMatchNames: string[] = recentMatchesDoc.get('items');
        console.log('[match-svc] readRecentMatchNames:', readRecentMatchNames);

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
    }


    public getRecentMatchList(): string[] {
        return this.recentMatchNames;
    }

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
        console.log('[match-svc] saving custom match for ', matchName);
        const matchRef = this.db.doc('/matches/' + matchName).ref;
        const obj = { team1: customGame.team1, team2: customGame.team2 };

        matchRef.set(obj, { merge: true });

        // also update the recent list.
        this.saveMatchNameToRecentList(matchName);
    }
}
