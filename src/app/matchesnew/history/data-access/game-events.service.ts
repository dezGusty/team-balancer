import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { Firestore, addDoc, collectionData, docData, setDoc } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';
import { Observable, Subject, Subscription, catchError, combineLatest, map, of, shareReplay, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { MatchDateTitle, fromString } from '../match-date-title';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { CreateGameRequest, GameEventData, GameNamesList, createGameEventDataFromRequest, getEventNameForRequest } from './create-game-request.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result, Result_Err } from '../result';

@Injectable({
  providedIn: 'root'
})
export class GameEventsService implements OnDestroy {

  public readonly recentGames$ = docData(doc(this.firestore, 'games/_list')).pipe(
    map(recentMatchesDocContents => {
      const castedItem = recentMatchesDocContents as GameNamesList;
      // Individual string entries are obtained in strings in the YYYY-MM-DD format.
      // Map each entry to an object of the type MatchHistoryTitle (with the year, month, and day properties).
      const matchHistoryTitles = castedItem.items.map(entry => fromString(entry));
      return matchHistoryTitles;
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError((err) => {
      console.log("read game events encountered issue");
      this.loadingFlagService.setLoadingFlag(false);
      return of<MatchDateTitle[]>([]);
    }),
    shareReplay(1),
  );

  gameEvents = toSignal(this.recentGames$, { initialValue: [] });



  private readonly addGameToRecentMatchesSubject = new Subject<MatchDateTitle>();
  private readonly addGameToRecentMatches$ = this.addGameToRecentMatchesSubject.asObservable();

  createGameEventSubject$ = new Subject<CreateGameRequest>();
  public readonly createGameEventAction$ =
    this.createGameEventSubject$.asObservable().pipe(
      withLatestFrom(this.recentGames$),
      tap(_ => { this.loadingFlagService.setLoadingFlag(true); }),
      switchMap(([createGameEventRequest, games]) => {
        console.log('creating game event', createGameEventRequest);

        // Create a document name (typically the date of the match) for the game event.
        const docName = getEventNameForRequest(createGameEventRequest);
        if (!docName || docName === "") {
          return of(Result_Err<void>("Invalid name for event request"));
          throwError(() => "err");
        }

        // Ensure the name is not yet added to the list of recent matches.
        let storedGameNames: string[] = games.map(x => x.title);
        if (storedGameNames.findIndex(x => x == docName) != -1) {
          console.log('Name already exists', docName);
          return of(Result_Err<void>(`Name ${docName} already exists`));
          // throw (() => "err! already exists!");
        }

        this.addGameToRecentMatchesSubject.next(fromString(docName ?? ""));
        console.log('setting doc... [' + docName + ']');

        // Create a new document in the 'games' collection with the match name as the document name.
        return setDoc(
          doc(this.firestore, `games/${docName}`),
          createGameEventDataFromRequest(createGameEventRequest),
          { merge: true }
        );
      }),
      tap(result => { console.log('create game event result', result); }),
      withLatestFrom(this.addGameToRecentMatches$, this.recentGames$),
      tap(([result, game, games]) => {
        console.log('combined with latest from...');
      }),
      switchMap(([result, game, games]) => {
        console.log('switchmap...');

        if (result && result.error) {
          console.warn("create game event failed", result.error);
          return of(Result_Err<void>(result.error));
        }
        // A document was created for the game event. Add it to the list of recent matches.
        // Keep a list of the most recent 10 matches in the 'games/_list' document.
        let gamesToKeep = [...games.map(x => x.title), game.title];
        if (gamesToKeep.length > 10) {
          gamesToKeep = gamesToKeep.slice(gamesToKeep.length - 10);
        }
        // gamesToKeep.sort();
        return setDoc(
          doc(this.firestore, 'games/_list'),
          { items: gamesToKeep },
          { merge: true });
      }),
      tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
      catchError((err) => {
        console.warn("create game encountered issue");
        this.loadingFlagService.setLoadingFlag(false);
        return of(null)
      }),
    );

  selectedMatchSubject$ = new Subject<MatchDateTitle>();

  public createGameEvent(createMatchRequest: CreateGameRequest) {
    this.createGameEventSubject$.next(createMatchRequest);
  }



  private subscriptions: Subscription[] = [];

  constructor(
    private firestore: Firestore,
    private loadingFlagService: LoadingFlagService) {
    this.subscriptions.push(this.createGameEventAction$.subscribe());
    this.subscriptions.push(this.recentGames$.subscribe());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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