import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, docData } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subscription, catchError, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { MatchHistoryTitle } from '../match-history.title';

@Injectable({
  providedIn: 'root'
})
export class MatchHistService {

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
    shareReplay(1),
    catchError(this.handleError)
  );


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