import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, collectionData, docData, setDoc } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';
import { Observable, Subject, Subscription, catchError, combineLatest, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { MatchDateTitle } from '../match-history.title';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { CreateGameEventRequest, GameNamesList, createGameEventDataFromRequest, getEventNameForRequest } from './create-game-event-request.model';

@Injectable({
  providedIn: 'root'
})
export class GameEventsService implements OnDestroy {


  createGameEventSubject$ = new Subject<CreateGameEventRequest>();
  public readonly createGameEventAction$ = this.createGameEventSubject$.asObservable().pipe(
    tap(_ => { this.loadingFlagService.setLoadingFlag(true); }),
    switchMap((createGameEventRequest) => {
      console.log('creating game event', createGameEventRequest);
      const docName = getEventNameForRequest(createGameEventRequest);
      if (!docName) {
        throwError(() => "err");
      }

      // Create a new document in the 'games' collection with the match name as the document name.
      return setDoc(doc(this.firestore, `games/${docName}`), createGameEventDataFromRequest(createGameEventRequest));
    }),
    switchMap((possibleErr) => {
      // A document was created for the game event. Add it to the list of recent matches.
      return setDoc(doc(this.firestore, 'games/_list'), { items: [] }, { merge: true });
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError((err) => {
      console.log("create game encountered issue");
      this.loadingFlagService.setLoadingFlag(false);
      return of(null)
    }),
  );

  public createGameEvent(createMatchRequest: CreateGameEventRequest) {
    this.createGameEventSubject$.next(createMatchRequest);
  }

  private subscriptions: Subscription[] = [];

  constructor(
    private firestore: Firestore,
    private loadingFlagService: LoadingFlagService) {
    this.subscriptions.push(this.createGameEventAction$.subscribe());
    this.subscriptions.push(this.gameEvents$.subscribe());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public readonly gameEvents$ = docData(doc(this.firestore, 'games/_list')).pipe(
    map(recentMatchesDocContents => {
      const castedItem = recentMatchesDocContents as GameNamesList;
      // Individual string entries are obtained in strings in the YYYY-MM-DD format.
      // Map each entry to an object of the type MatchHistoryTitle (with the year, month, and day properties).
      const matchHistoryTitles = castedItem.items.map((entry) => {
        const [year, month, day] = entry.split('-');
        return { title: entry, year, month, day } as MatchDateTitle;
      });
      return matchHistoryTitles;
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
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