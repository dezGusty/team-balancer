import { Injectable } from '@angular/core';
import { CustomPrevGame } from './custom-prev-game.model';
import { collection, doc, getDoc, getDocs, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { Player } from './player.model';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { CustomGame } from './custom-game.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MatchService {

  private dataChangeSubscription: Subscription = Subscription.EMPTY;

  private recentMatchesChangeEvent = new BehaviorSubject<string[]>([]);
  private recentMatchNames: string[];
  public maxNumberOfRecentMatches = 5;

  constructor(private firestore: Firestore, private authSvc: AuthService) {
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

  public getRecentMatchListCached(): string[] {
    console.log('getRecentMatchListCached', this.recentMatchNames);

    return this.recentMatchNames;
  }


  /**
     * Subscribes to the data sources used by this service.
     */
  subscribeToDataSources() {
    console.log('[match-svc] subscribing');

    this.recentMatchNames = [...this.recentMatchNames];
    this.recentMatchesChangeEvent.next(this.recentMatchNames);

    const docRef = doc(this.firestore, 'matches/recent');
    this.dataChangeSubscription = docData(docRef).subscribe({
      next: recentMatchesDocContents => {
        const castedItem = recentMatchesDocContents as { items: string[] };
        this.recentMatchNames = [...castedItem.items];
        this.recentMatchesChangeEvent.next(this.recentMatchNames);
      },
      error: err => console.log('some error encountered', err),
      complete:
        () => { console.log('[match-svc]complete') }
    });
  }

  /**
   * Clean-up the data subscriptions.
   */
  unsubscribeFromDataSources() {
    if (this.dataChangeSubscription) {
      this.dataChangeSubscription.unsubscribe();
    }
  }

  /**
     * Asynchronously retrieves the match object as an Observable.
     * @param matchName The name of the match (basically: the date to be used as a key for accessing the match from the DB)
     * E.g. '2018-03-23'
     */
  public async getMatchForDateAsync(matchName: string): Promise<CustomPrevGame | undefined> {
    // Get the firestore document where the match details are stored, based on the key.
    // E.g. stored in [matches/2018-03-23]
    let myResult: CustomPrevGame | undefined = undefined;
    const docName = 'matches/' + matchName;

    const docRef = doc(this.firestore, docName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      myResult = docSnap.data() as CustomPrevGame;
    }
    else {
      console.log('Could not find document for ', docName);
    }

    return myResult;
  }

  /**
   * Get the match date (E.g. "2022-09-02") from a rating date (E.g. "2022-09-02_LblABC123")
   * @param ratingDate 
   */
  public getMatchDateFromRatingDateWithLabel(ratingDate: string): string {
    if (ratingDate.length > 10) {
      return ratingDate.substring(0, 10);
    }
    return ratingDate;
  }

  public async getMatchListAsync(): Promise<Map<string, CustomPrevGame>> {
    const collectionRef = collection(this.firestore, 'matches');
    const docsSnap = await getDocs(collectionRef);
    let matchList = new Map<string, CustomPrevGame>();
    docsSnap.forEach(
      myDoc => {
        if (myDoc.id !== 'recent') {
          matchList.set(myDoc.id, myDoc.data() as CustomPrevGame);
        }
      });
    return matchList;
  }

  /**
     * Saves a given match name in the 'recent' list. If the name is already part of the list,
     * nothing happens, if it's not there already, it's added.
     * The 'recent' list is a rolling list, containing the most recent N items. Adding the N+1th item
     * will evict the oldest item from the list.
     *
     * @param matchName Match name to save into the 'recent' list.
     */
  public async saveMatchNameToRecentList(matchName: string) {
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
    const docName = '/matches/recent';
    const docRef = doc(this.firestore, docName);
    const obj = { items: newRecentMatches };
    await setDoc(docRef, obj, { merge: true });
  }

  public async saveCustomMatchAsync(matchName: string, customGame: CustomGame) {
    const docName = 'matches/' + matchName;
    const docRef = doc(this.firestore, docName);

    const obj = { team1: customGame.team1, team2: customGame.team2 };

    await setDoc(docRef, obj, { merge: true });

    // also update the recent list.
    await this.saveMatchNameToRecentList(matchName);
  }

  public async saveCustomPrevMatchAsync(matchName: string, game: CustomPrevGame) {
    const docName = 'matches/' + matchName;
    const docRef = doc(this.firestore, docName);

    const objScore = {
      team1: game.team1,
      team2: game.team2
    };

    let obj: {
      [x: string]: any;
      appliedResults?: true;
      savedResult?: true;
      team1?: Player[];
      team2?: Player[];
    };

    obj = { ...objScore };
    if (game.appliedResults) {
      obj = { ...obj, appliedResults: game.appliedResults };
    }

    if (game.savedResult) {
      obj = { ...obj, savedResult: game.savedResult };
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

    await setDoc(docRef, obj, { merge: true });
    this.recentMatchesChangeEvent.next(this.recentMatchNames);
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
