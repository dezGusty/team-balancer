import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, signal } from '@angular/core';
import { Firestore, addDoc, collectionData, docData, setDoc } from '@angular/fire/firestore';
import { collection, doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, combineLatest, map, of, shareReplay, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { MatchDateTitle, fromString } from '../match-date-title';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { CreateGameRequest, GameEventDBData, GameEventData, GameNamesList, PlayerWithId, createGameEventDataFromRequest, getEventNameForRequest } from './create-game-request.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result, Result_Err, Result_Ok } from '../result';
import { NotificationService } from 'src/app/utils/notification/notification.service';
import { PlayersService } from 'src/app/shared/players.service';
import { Player } from 'src/app/shared/player.model';

@Injectable({
  providedIn: 'root'
})
export class GameEventsService implements OnDestroy {

  public readonly recentGames$ = docData(doc(this.firestore, 'games/_list')).pipe(
    tap((_) => { this.loadingFlagService.setLoadingFlag(true); }),
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

  private readonly addGameToRecentMatchesSubject$ = new Subject<MatchDateTitle>();
  private readonly addGameToRecentMatches$ = this.addGameToRecentMatchesSubject$.asObservable();

  autoSaveGameEventSubject$ = new BehaviorSubject<boolean>(false);
  // autoSaveGameEventSignal = toSignal(this.autoSaveGameEventSubject$, { initialValue: true });

  readonly nextSaveDataSubject$ = new BehaviorSubject<GameEventDBData>(GameEventDBData.DEFAULT);

  readonly triggerSaveDataSubject$ = new Subject<void>();
  readonly triggerSaveData$ = this.triggerSaveDataSubject$.asObservable().pipe(
    withLatestFrom(this.nextSaveDataSubject$),
    switchMap(([_, data]) => {
      if (data.name !== "") {
        return setDoc(
          doc(this.firestore, `games/${data.name}`),
          data,
          { merge: true }
        );
      }
      this.notificationService.show("No content to save. Skipping.");
      return of();
    }),
    catchError((err) => {
      this.notificationService.show("Data save encountered an issue.");
      console.warn("trigger save data encountered issue");
      return of();
    })
  );

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
        }

        // Ensure the name is not yet added to the list of recent matches.
        let storedGameNames: string[] = games.map(x => x.title);
        if (storedGameNames.findIndex(x => x == docName) != -1) {
          console.log('Name already exists', docName);
          return of(Result_Err<void>(`Name ${docName} already exists`));
        }

        this.addGameToRecentMatchesSubject$.next(fromString(docName ?? ""));
        console.log('setting doc... [' + docName + ']');

        // Create a new document in the 'games' collection with the match name as the document name.
        return of(setDoc(
          doc(this.firestore, `games/${docName}`),
          createGameEventDataFromRequest(createGameEventRequest),
          { merge: true }
        )).pipe(
          map(_ => Result_Ok<string>(docName))
        );
      }),
      withLatestFrom(this.recentGames$),
      switchMap(([result, games]) => {
        if (result.error) {
          console.warn("create game event failed", result.error);
          this.notificationService.show("Failed to create game event" + result.error);
          return of(Result_Err<void>(result.error));
        }

        // A document was created for the game event. Add it to the list of recent matches.
        // Keep a list of the most recent 10 matches in the 'games/_list' document.
        let gamesToKeep = [...games.map(x => x.title), result.data];
        if (gamesToKeep.length > 10) {
          gamesToKeep = gamesToKeep.slice(gamesToKeep.length - 10);
        }
        gamesToKeep.sort();
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
  selectedMatch$ = this.selectedMatchSubject$.asObservable().pipe(
    tap((selectedMatch) => {
      console.log('** selected match', selectedMatch);
    }),
    shareReplay(1)
  );

  selectedMatch = toSignal(this.selectedMatch$, { initialValue: null });

  selectedMatchContent$ = this.selectedMatch$.pipe(
    tap((_) => { this.loadingFlagService.setLoadingFlag(true); }),
    switchMap((selectedMatch) => {
      if (!selectedMatch) {
        return of(GameEventDBData.DEFAULT);
      }
      return docData(doc(this.firestore, `games/${selectedMatch.title}`));
    }),
    map(matchDocContents => {
      const castedItem = matchDocContents as GameEventDBData;
      return castedItem;
    }),
    withLatestFrom(this.playersService.players$),
    map(([gameEventDBData, players]) => {
      try {
        let result: GameEventData = {
          matchDate: gameEventDBData.matchDate,
          name: gameEventDBData.name,
          registeredPlayers: gameEventDBData.registeredPlayerIds.map(id => {
            return {
              id: id,
              name: players.find(p => p.id === id)?.name ?? ""
            };
          })
        };
        return result;
      } catch (err) {
        console.warn("read game event encountered issue");
        this.notificationService.show("Failed to read game event");
      }
      return GameEventData.DEFAULT;
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError((err) => {
      console.warn("Error encountered while reading game event", err);
      this.notificationService.show("Error encountered while reading game");
      this.loadingFlagService.setLoadingFlag(false);
      return of(GameEventData.DEFAULT);
    }),
    shareReplay(1)
  );

  selectedMatchContent = toSignal(this.selectedMatchContent$, { initialValue: GameEventData.DEFAULT });

  addPlayerToMatchSubject$ = new Subject<Player>();
  addPlayerToMatch$ = this.addPlayerToMatchSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    map(([player, selectedMatchContent]) => {
      let newRegisteredPlayers = [...selectedMatchContent.registeredPlayers, { id: player.id, name: player.name }];
      let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds
      };
      return newMatchContent;
    }),
    switchMap((newMatchContent) => {
      return setDoc(
        doc(this.firestore, `games/${newMatchContent.name}`),
        newMatchContent,
        { merge: true }
      );
    }),
    catchError((err) => {
      console.warn("add player to match encountered issue");
      return of(null);
    })
  );

  removePlayerFromMatchSubject$ = new Subject<PlayerWithId>();
  removePlayerFromMatch$ = this.removePlayerFromMatchSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    map(([player, selectedMatchContent]) => {
      let newRegisteredPlayers = selectedMatchContent.registeredPlayers.filter(p => p.id !== player.id);
      let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds
      };
      return newMatchContent;
    }),
    switchMap((newMatchContent) => {
      return setDoc(
        doc(this.firestore, `games/${newMatchContent.name}`),
        newMatchContent,
        { merge: true }
      );
    }),
    catchError((err) => {
      console.warn("remove player from match encountered issue");
      return of(null);
    })
  );

  randomizeOrderSubject$ = new Subject<void>();
  randomizeOrder$ = this.randomizeOrderSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    tap(([_, selectedMatchContent]) => {
      console.log('randomize order', selectedMatchContent);
    }),
    map(([player, selectedMatchContent]) => {
      // Set a randomization factor between 0.0 and 0.5 for the sort function.
      let randomizationFactor = Math.random() - 0.5;
      // Pass a random value to the sort function. This will shuffle the order of the players.
      let newRegisteredPlayers = selectedMatchContent.registeredPlayers.sort(() => Math.random() - randomizationFactor - 0.25); 
      let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds
      };
      return newMatchContent;
    }),
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave){
        return setDoc(
          doc(this.firestore, `games/${newMatchContent.name}`),
          newMatchContent,
          { merge: true }
        );
      }
      // if not auto-saving, store the data in another subject
      this.nextSaveDataSubject$.next(newMatchContent);
      return of();
    }),
    tap(x => console.log('randomizeOrder$', x)),
    catchError((err) => {
      console.warn("randomize player order encountered issue");
      return of(null);
    })
  );
  // randomizeOrderSubject$ = new Subject<void>();
  // randomizeOrder$ = this.randomizeOrderSubject$.asObservable().pipe(
  //   withLatestFrom(this.selectedMatchContent$),
  //   tap(([_, selectedMatchContent]) => {
  //     console.log('randomize order', selectedMatchContent);
  //   }),
  //   map(([player, selectedMatchContent]) => {
  //     let newRegisteredPlayers = selectedMatchContent.registeredPlayers.sort(() => Math.random() - 0.5); 
  //     let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
  //     let newMatchContent: GameEventDBData = {
  //       matchDate: selectedMatchContent.matchDate,
  //       name: selectedMatchContent.name,
  //       registeredPlayerIds: newRegisteredPlayerIds
  //     };
  //     return newMatchContent;
  //   }),
  //   switchMap((newMatchContent) => {
  //     return setDoc(
  //       doc(this.firestore, `games/${newMatchContent.name}`),
  //       newMatchContent,
  //       { merge: true }
  //     );
  //   }),
  //   catchError((err) => {
  //     console.warn("randomize player order encountered issue");
  //     return of(null);
  //   })
  // );

  public createGameEvent(createMatchRequest: CreateGameRequest) {
    this.createGameEventSubject$.next(createMatchRequest);
  }

  addPlayerToMatch(player: Player) {
    this.addPlayerToMatchSubject$.next(player);
  }

  removePlayerFromMatch(playerWithId: PlayerWithId) {
    this.removePlayerFromMatchSubject$.next(playerWithId);
  }

  public randomizeOrder() {
    // this.notificationService.show("Randomize order not implemented yet");
    this.randomizeOrderSubject$.next();
  }

  public save() {
    this.triggerSaveDataSubject$.next();
  }


  private subscriptions: Subscription[] = [];

  constructor(
    private firestore: Firestore,
    private notificationService: NotificationService,
    private loadingFlagService: LoadingFlagService,
    private playersService: PlayersService) {
    this.subscriptions.push(this.createGameEventAction$.subscribe());
    this.subscriptions.push(this.recentGames$.subscribe());
    this.subscriptions.push(this.selectedMatch$.subscribe());
    this.subscriptions.push(this.addPlayerToMatch$.subscribe());
    this.subscriptions.push(this.removePlayerFromMatch$.subscribe());
    this.subscriptions.push(this.randomizeOrder$.subscribe());
    this.subscriptions.push(this.triggerSaveData$.subscribe());
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