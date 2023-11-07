import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, docData } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subscription, catchError, shareReplay, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatchHistService {
  
  constructor(private firestore: Firestore) {
  }

  public recentMatches$ = docData(doc(this.firestore, 'matches/recent')).pipe(
    tap(recentMatchesDocContents => {
      console.log("*** " + recentMatchesDocContents);
    }),
    switchMap(recentMatchesDocContents => {
      console.log('*** recentMatchesDocContents', recentMatchesDocContents);
      const castedItem = recentMatchesDocContents as { items: string[] };
      const matchList = castedItem.items;
      console.log('*** recentMatches$', matchList);
      // const matchList$ = matchList.map(
      //   matchName => {
      //     const docRef = doc(this.firestore, 'matches/' + matchName);
      //     return docData(docRef);
      //   }
      // );
      // return matchList$;
      return matchList;
    }),
    shareReplay(1),
    catchError(this.handleError)
  );


  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }
}