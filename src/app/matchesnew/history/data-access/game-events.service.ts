import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, docData, setDoc } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, map, merge, mergeAll, of, shareReplay, switchMap, tap, throwError, withLatestFrom } from 'rxjs';
import { MatchDateTitle, fromString } from '../match-date-title';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { CreateGameRequest, GameEventDBData, GameEventData, GameNamesList, PlayerWithId, createGameEventDataFromRequest, getEventNameForRequest } from './create-game-request.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result_Err, Result_Ok } from '../result';
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

  public readonly gameEvents = toSignal(this.recentGames$, { initialValue: [] });

  private readonly addGameToRecentMatchesSubject$ = new Subject<MatchDateTitle>();
  private readonly addGameToRecentMatches$ = this.addGameToRecentMatchesSubject$.asObservable();

  private readonly autoSaveGameEventSubject$ = new BehaviorSubject<boolean>(false);
  readonly autoSaveGameEventSignal = toSignal(this.autoSaveGameEventSubject$, { initialValue: true });

  readonly nextSaveDataSubject$ = new BehaviorSubject<GameEventDBData>(GameEventDBData.DEFAULT);
  readonly nextSaveDataSignal = toSignal(this.nextSaveDataSubject$, { initialValue: GameEventDBData.DEFAULT });

  readonly triggerSaveDataSubject$ = new Subject<void>();
  readonly triggerSaveData$ = this.triggerSaveDataSubject$.asObservable().pipe(
    withLatestFrom(this.nextSaveDataSubject$),
    switchMap(([_, data]) => {
      console.log('*** trigger save data', data);
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
    tap(() => this.nextSaveDataSubject$.next(GameEventDBData.DEFAULT)),
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
      // also reset any stored data.
      this.nextSaveDataSubject$.next(GameEventDBData.DEFAULT);
    }),
    shareReplay(1)
  );

  selectedMatch = toSignal(this.selectedMatch$, { initialValue: null });

  selectedMatchOnlineContent$ = this.selectedMatch$.pipe(
    tap((_) => { this.loadingFlagService.setLoadingFlag(true); }),
    switchMap((selectedMatch) => {
      if (!selectedMatch) {
        return of(GameEventDBData.DEFAULT);
      }
      return docData(doc(this.firestore, `games/${selectedMatch.title}`));
    }),
    map(gameEvent => { return gameEvent as GameEventDBData }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
    catchError((err) => {
      console.warn("Error encountered while reading game event", err);
      this.notificationService.show("Error encountered while reading game. Please REFRESH page.");
      this.loadingFlagService.setLoadingFlag(false);
      return of(GameEventDBData.DEFAULT);
    }),
  );

  selectedMatchContent$ = merge([this.selectedMatchOnlineContent$, this.nextSaveDataSubject$]).pipe(
    tap((data) => console.log('selectedMatchContent$', data)),
    mergeAll(),
    withLatestFrom(this.playersService.players$),
    map(([gameEventDBData, players]) => {
      try {
        let result: GameEventData = {
          appliedRandomization: false,
          matchDate: gameEventDBData.matchDate,
          name: gameEventDBData.name,
          registeredPlayers: gameEventDBData.registeredPlayerIds.map(id => {
            return {
              id: id,
              name: players.find(p => p.id === id)?.name ?? "",
              stars: players.find(p => p.id === id)?.stars ?? 0,
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
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        return setDoc(
          doc(this.firestore, `games/${newMatchContent.name}`),
          newMatchContent,
          { merge: true }
        );
      }
      this.nextSaveDataSubject$.next(newMatchContent);
      return of();
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
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        return setDoc(
          doc(this.firestore, `games/${newMatchContent.name}`),
          newMatchContent,
          { merge: true }
        );
      }
      this.nextSaveDataSubject$.next(newMatchContent);
      return of();
    }),
    catchError((err) => {
      console.warn("remove player from match encountered issue");
      return of();
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
      if (autoSave) {
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
    catchError((err) => {
      console.warn("randomize player order encountered issue");
      return of(null);
    })
  );

  readonly saveRaffleDataSubject$ = new Subject<void>();
  readonly saveRaffleData$ = this.saveRaffleDataSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    switchMap(([_, data]) => {
      console.log('*** save raffle data', data);
      // take the current order of the players.
      // add a star to each player beyond the number of 12 players.
      // save the list.
      // save the players, so store the star count.
      let newRegisteredPlayers = data.registeredPlayers.slice(12);
      console.log('TODO: assign ⭐ to newRegisteredPlayers', newRegisteredPlayers);
      return of();
    }),
    catchError((err) => {
      this.notificationService.show("Data save encountered an issue.");
      console.warn("save raffle data encountered issue");
      return of();
    })
  );



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

  public saveRaffle() {
    // take the current order of the players.
    // add a star to each player beyond the number of 12 players.
    // save the list.
    // save the players, so store the star count.
    this.saveRaffleDataSubject$.next();
  }

  public setAutoSave(autoSave: boolean) {
    this.autoSaveGameEventSubject$.next(autoSave);
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
    this.subscriptions.push(this.saveRaffleData$.subscribe());
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