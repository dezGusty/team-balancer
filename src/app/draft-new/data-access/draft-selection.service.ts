import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription, catchError, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { Player } from 'temp/player';

export interface DraftSelectionData {
  players: Player[];
}

@Injectable({
  providedIn: 'root'
})
export class DraftSelectionService implements OnDestroy {

  triggerDataRetrieval$ = new BehaviorSubject<boolean>(true);

  public nextMatches$ = this.triggerDataRetrieval$.asObservable().pipe(
    switchMap(_ => {
      this.loadingFlagService.setLoadingFlag(true);
      return docData(doc(this.firestore, 'drafts/next'))
    }),
    map(nextMatchesDocContents => {
      const playerList = nextMatchesDocContents as DraftSelectionData;
      return playerList;
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError(this.handleError),
    shareReplay(1),
  );

  public triggerStoreMatch$ = new BehaviorSubject<DraftSelectionData>({} as DraftSelectionData);
  public storedMatch$ = this.triggerStoreMatch$.asObservable().pipe(
    switchMap(data => {
      this.loadingFlagService.setLoadingFlag(true);
      return setDoc(doc(this.firestore, 'drafts/next'), data, { merge: true });
    })
  );

  constructor(
    private firestore: Firestore,
    private loadingFlagService: LoadingFlagService) {

  }

  private subscriptions: Subscription[] = [];
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

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
