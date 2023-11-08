import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, docData } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, combineLatest, map, share, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { MatchHistoryTitle } from '../match-history.title';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';

@Injectable({
  providedIn: 'root'
})
export class MatchHistService {

  public selectedMatchSubject = new Subject<string>();
  public selectedMatchAction$ = this.selectedMatchSubject.asObservable().pipe(
    tap(_ => {
      console.log('** selected match action');
      this.flagFetchingDetails = true;
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
    tap((_) => { this.flagFetchingData = false; }),
    shareReplay(1),
    catchError(this.handleError)
  );

  private flagFetchingData: boolean = true;
  public isFetchingData(): boolean {
    return this.flagFetchingData;
  }

  private flagFetchingDetails: boolean = false;
  public isFetchingDetails(): boolean {
    return this.flagFetchingDetails;
  }

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
      this.flagFetchingDetails = false;
      return castedItem;
    }),
    tap(game => {
      console.log('** selected match details', game);
      
    }),
  );


  /**
   * Fetch the details of a specific match. 
   * Will connect to the document 'matches/YYYY-MM-DD' in Firestore and retrieve items of the type CustomPrevGame.
   * @param matchDate The date of the match to fetch, in the format YYYY-MM-DD.
   */
  // public fetchSpecificMatch(matchDate: string): Observable<CustomPrevGame> {
  //   return docData(doc(this.firestore, `matches/${matchDate}`)).pipe(
  //     map(matchDocContents => {
  //       const castedItem = matchDocContents as CustomPrevGame;
  //       return castedItem;
  //     }),
  //     catchError(this.handleError)
  //   );
  // }


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