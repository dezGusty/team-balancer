import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';


/**
 * Stores and retrieves match related information.
 */
@Injectable()
export class MatchService {
    private dataChangeSubscription: Subscription;
    private recentMatchNames: string[];
    private recentMatchesChangeEvent = new BehaviorSubject<string[]>(null);

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
        this.recentMatchesChangeEvent.next(this.recentMatchNames);

        // subscribe to firebase collection changes.
        this.dataChangeSubscription = this.db.doc('matches/recent').valueChanges().subscribe(
            recentMatchesDocContents => {
                const castedItem = recentMatchesDocContents as { items: string[] };
                this.recentMatchNames = [...castedItem.items];
                this.recentMatchesChangeEvent.next(this.recentMatchNames);
            },
            error => console.log('some error encountered', error),
            () => { console.log('[match-svc]complete'); },
        );
    }

    /**
     * Clean-up the data subscriptions.
     */
    unsubscribeFromDataSources() {
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
        }
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
        return this.recentMatchesChangeEvent.asObservable();
    }
}
