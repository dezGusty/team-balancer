import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, docData, setDoc, updateDoc } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, combineLatest, from, map, share, shareReplay, startWith, switchMap, tap, throwError } from 'rxjs';
import { MatchHistoryTitle } from '../match-history.title';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';

@Injectable({
  providedIn: 'root'
})
export class MatchHistService {

  public selectedMatchSubject = new Subject<string>();
  public selectedMatchAction$ = this.selectedMatchSubject.asObservable().pipe(
    tap(_ => {
      console.log('** will fetch some match details');
      this.fetchingMatchDetails$.next(true);
    }),
  );

  constructor(private firestore: Firestore) {
  }

  public recentMatches$ = docData(doc(this.firestore, 'matches/recent')).pipe(
    map(recentMatchesDocContents => {
      const castedItem = recentMatchesDocContents as { items: string[] };
      // Individual string entries are obtained in strings in the YYYY-MM-DD format.
      // Map each entry to an object of the type MatchHistoryTitle (with the year, month, and day properties).
      const matchHistoryTitles = castedItem.items.map((entry) => {
        const [year, month, day] = entry.split('-');
        return { title: entry, year, month, day } as MatchHistoryTitle;
      });
      return matchHistoryTitles;
    }),
    tap((_) => { this.fetchingMatchList$.next(false); }),
    shareReplay(1),
    catchError(this.handleError)
  );

  private fetchingMatchList$ = new BehaviorSubject<boolean>(true);
  public readonly isFetchingMatchList$ = this.fetchingMatchList$.asObservable();

  private fetchingMatchDetails$ = new BehaviorSubject<boolean>(false);
  public readonly isFetchingMatchDetails$ = this.fetchingMatchDetails$.asObservable();

  // Store an observable for the selected match entry from the recent matches list.
  selectedMatch$ = combineLatest([
    this.recentMatches$,
    this.selectedMatchAction$
  ]).pipe(
    map(([recentMatches, selectedMatch]) => {
      return recentMatches.find((match) => match.title === selectedMatch);
    }
    ),
    tap((selectedMatch) => {
      console.log('** selected match', selectedMatch);
    }),
    shareReplay(1)
  );

  // Store an observable with the details for the selected match.
  // Will get the document 'matches/YYYY-MM-DD'
  selectedMatchDetails$ = this.selectedMatch$.pipe(
    switchMap((matchTitle) => {
      return docData(doc(this.firestore, `matches/${matchTitle?.title}`))
    }),
    map(matchDocContents => {
      const castedItem = matchDocContents as CustomPrevGame;
      this.fetchingMatchDetails$.next(false);
      return castedItem;
    }),
    tap(game => {
      console.log('** selected match details', game);
    }),
  );

  private updateMatchDetailsSubject$ = new Subject<CustomPrevGame>();
  public readonly updateMatchDetails$ = this.updateMatchDetailsSubject$.asObservable();

  selectedMatchDetailsWithUpdates$ = combineLatest([]);


  public async updateCustomPrevMatchAsync(matchDocName: string, game: CustomPrevGame) {
    console.log('updating match', matchDocName, game);
    
    const docRef = doc(this.firestore, `matches/${matchDocName}`);
    
    await setDoc(docRef, game, { merge: true });
    console.log('updated match', matchDocName, game);

    // const objScore = {
    //   team1: game.team1,
    //   team2: game.team2
    // };

    

    // let obj: {
    //   [x: string]: any;
    //   appliedResults?: true;
    //   savedResult?: true;
    //   team1?: Player[];
    //   team2?: Player[];
    // };

    // obj = { ...objScore };
    // if (game.appliedResults) {
    //   obj = { ...obj, appliedResults: game.appliedResults };
    // }

    // if (game.savedResult) {
    //   obj = { ...obj, savedResult: game.savedResult };
    // }

    // if (game.scoreTeam1 != null) {
    //   obj = { ...obj, scoreTeam1: game.scoreTeam1 };
    // }
    // if (game.scoreTeam2 != null) {
    //   obj = { ...obj, scoreTeam2: game.scoreTeam2 };
    // }
    // if (game.postResults != null) {
    //   obj = { ...obj, postResults: game.postResults };
    // }

    // await setDoc(docRef, obj, { merge: true });
    // this.recentMatchesChangeEvent.next(this.recentMatchNames);
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // Client-side or network error.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // Some backend error.
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }
}