import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CustomGame } from './custom-game.model';
import { Injectable, EventEmitter } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomPrevGame } from './custom-prev-game.model';
import { Player } from './player.model';

/**
 * Stores and retrieves match related information.
 */
@Injectable()
export class MatchService {
    private dataChangeSubscription: Subscription;
    private recentMatchNames: string[];
    private recentMatchesChangeEvent = new EventEmitter<string[]>();

    private individualMatchRetrieval: Subscription[] = [];

    public maxNumberOfRecentMatches = 5;

    /**
     * Constructor.
     * @param db Database service.
     * @param authSvc The authentication service.
     */
    public constructor(private db: AngularFirestore, private authSvc: AuthService) {
        this.recentMatchNames = [];
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

    /**
     * Subscribes to the data sources used by this service.
     */
    subscribeToDataSources() {
        console.log('[match-svc] subscribing');

        this.recentMatchNames = [...this.recentMatchNames];
        this.recentMatchesChangeEvent.emit(this.recentMatchNames);

        // subscribe to firebase collection changes.
        this.dataChangeSubscription = this.db.doc('matches/recent').valueChanges().subscribe(
            recentMatchesDocContents => {
                const castedItem = recentMatchesDocContents as { items: string[] };
                this.recentMatchNames = [...castedItem.items];
                this.recentMatchesChangeEvent.emit(this.recentMatchNames);
            },
            error => console.log('some error encountered', error),
            () => { console.log('[match-svc]complete'); },
        );

        // const recentMatches = this.db.doc('matches/recent').get({ source: 'cache' });
        // this.dataChangeSubscription = recentMatches.subscribe(
        //     recentMatchesDoc => this.readRecentMatchesFromDocWithNotif(recentMatchesDoc),
        //     error => console.log('some error encountered', error),
        //     () => { console.log('[match-svc]complete'); },
        // );
    }

    // readRecentMatchesFromDocWithNotif(recentMatchesDoc) {
    //     const readRecentMatchNames: string[] = this.readRecentMatchesFromDoc(recentMatchesDoc);

    //     this.recentMatchNames = readRecentMatchNames;
    //     console.log('this.recentMatchNames', this.recentMatchNames);

    //     this.recentMatchesChangeEvent.emit(this.recentMatchNames);
    // }

    // public readRecentMatchesFromDoc(recentMatchesDoc: firebase.firestore.DocumentSnapshot): string[] {
    //     if (!recentMatchesDoc.exists) {
    //         return [];
    //     }

    //     const readRecentMatchNames: string[] = recentMatchesDoc.get('items');
    //     return readRecentMatchNames;
    // }

    /**
     * Clean-up the data subscriptions.
     */
    unsubscribeFromDataSources() {
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
        }
        this.individualMatchRetrieval.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    public getRecentMatchListCached(): string[] {
        return this.recentMatchNames;
    }
    /**
     * Retrieves (asynchronously) a list of recent matches.
     * @returns the match name collection, as an Observable.
     */
    public getRecentMatchListAsync(issueOneEvt = true): Observable<string[]> {
        console.log('getRecentMatchListAsync');

        // if (issueOneEvt) {
        //     setTimeout(() => {
        //         this.recentMatchesChangeEvent.emit(this.recentMatchNames);
        //     }, 0);
        // }
        return this.recentMatchesChangeEvent.asObservable();
    }

    public async getMatchList(): Promise<Map<string, CustomPrevGame>> {
        const matches = this.db.collection('matches/');
        const snapshot = await matches.get();

        let matchList = new Map<string, CustomPrevGame>();
        snapshot.forEach(doc => {
            doc.docs.forEach(test => {
                if (test.id !== 'recent') {
                    matchList.set(test.id, test.data() as CustomPrevGame);
                }
            });
        });
        return matchList;
    }

    /**
     * Asynchronously retrieves the match object as an Observable.
     * @param matchName The name of the match (basically: the date to be used as a key for accessing the match from the DB)
     * E.g. '2018-03-23'
     */
    public getMatchForDateAsync(matchName: string): Observable<CustomPrevGame> {
        // Get the firestore document where the match details are stored, based on the key.
        // E.g. stored in [matches/2018-03-23]
        return this.db.doc<CustomPrevGame>('matches/' + matchName).get().pipe(
            // Map each document (expected: only 1) to the read operation.
            map(matchDoc => {
                // Read the document data.
                // It is expected to consist of serialized data.
                const fbData = matchDoc.data();
                const obj = {
                    team1: fbData.team1,
                    team2: fbData.team2,
                    scoreTeam1: fbData.scoreTeam1,
                    scoreTeam2: fbData.scoreTeam2,
                    appliedResults: fbData.appliedResults,
                    postResults: fbData.postResults
                };
                const result: CustomPrevGame = obj;
                return result;
            })
        );
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

        // TODO:XXX:change
        // this.readRecentMatchesFromDocWithNotif(recentMatchRef);
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

        let obj: {
            [x: string]: any;
            appliedResults?: true;
            team1?: Player[];
            team2?: Player[];
        };

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
        if (game.postResults != null) {
            obj = { ...obj, postResults: game.postResults };
        }

        console.log('save custom prev obj', obj);
        matchRef.set(obj, { merge: true });
    }
}
