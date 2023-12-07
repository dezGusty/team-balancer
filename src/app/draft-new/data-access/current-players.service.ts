import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, catchError, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { Player } from 'src/app/shared/player.model';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';


export interface CurrentPlayersData {
  players: Player[];
  label: string;
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrentPlayersService {

  triggerDataRetrieval$ = new BehaviorSubject<boolean>(true);

  public currentPlayers$ = this.triggerDataRetrieval$.asObservable().pipe(
    switchMap(_ => {
      this.loadingFlagService.setLoadingFlag(true);
      return docData(doc(this.firestore, 'ratings/current'))
    }),
    map(currentPlayersData => { return currentPlayersData as CurrentPlayersData }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError(this.handleError),
    shareReplay(1),
  );

  constructor(
    private firestore: Firestore,
    private loadingFlagService: LoadingFlagService
  ) { }


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
