import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, docData, setDoc } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, filter, finalize, map, merge, mergeAll, of, shareReplay, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';
import { MatchDateTitle } from '../match-date-title';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';
import { CreateGameRequest, GameEventDBData, GameEventData, GameNamesList, PlayerWithId, PlayerWithIdAndStars, createGameEventDataFromRequest, getEventNameForRequest } from './create-game-request.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { Result } from '../result';
import { NotificationService } from 'src/app/utils/notification/notification.service';
import { PlayersService } from 'src/app/shared/players.service';
import { Player, getDisplayName } from 'src/app/shared/player.model';

@Injectable({
  providedIn: 'root'
})
export class GameEventsService implements OnDestroy {

  public readonly RECENT_MATCHES_LIMIT = 6;

  public readonly players$ = this.playersService.players$;

  public readonly recentGameTitles$ = docData(doc(this.firestore, 'games/_list')).pipe(
    tap((_) => { this.loadingFlagService.setLoadingFlag(true); }),
    map(recentMatchesDocContents => {
      const castedItem = recentMatchesDocContents as GameNamesList;
      // Individual string entries are obtained in strings in the YYYY-MM-DD format.
      // Map each entry to an object of the type MatchHistoryTitle (with the year, month, and day properties).
      const matchHistoryTitles = castedItem.items.map(entry => MatchDateTitle.fromString(entry));
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

  public readonly recentGameTitlesSig = toSignal(this.recentGameTitles$, { initialValue: [] });

  public readonly updatedFireData$ = new BehaviorSubject<boolean>(false);

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
    tap(_ => this.updatedFireData$.next(true)),
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
      withLatestFrom(this.recentGameTitles$),
      tap(_ => { this.loadingFlagService.setLoadingFlag(true); }),
      switchMap(([createGameEventRequest, games]) => {
        console.log('creating game event', createGameEventRequest);

        // Create a document name (typically the date of the match) for the game event.
        const docName = getEventNameForRequest(createGameEventRequest);
        if (!docName || docName === "") {
          return of(Result.Err<void>("Invalid name for event request"));
        }

        // Ensure the name is not yet added to the list of recent matches.
        let storedGameNames: string[] = games.map(x => x.title);
        if (storedGameNames.findIndex(x => x == docName) != -1) {
          console.log('Name already exists', docName);
          return of(Result.Err<void>(`Name ${docName} already exists`));
        }

        this.addGameToRecentMatchesSubject$.next(MatchDateTitle.fromString(docName ?? ""));
        console.log('setting doc... [' + docName + ']');

        // Create a new document in the 'games' collection with the match name as the document name.
        return of(setDoc(
          doc(this.firestore, `games/${docName}`),
          createGameEventDataFromRequest(createGameEventRequest),
          { merge: true }
        )).pipe(
          map(_ => Result.Ok<string>(docName))
        );
      }),
      withLatestFrom(this.recentGameTitles$),
      switchMap(([result, games]) => {
        if (result.error) {
          console.warn("create game event failed", result.error);
          this.notificationService.show("Failed to create game event" + result.error);
          return of(Result.Err<void>(result.error));
        }

        // A document was created for the game event. Add it to the list of recent matches.
        // Keep a list of the most recent RECENT_MATCHES_LIMIT matches in the 'games/_list' document.
        let gamesToKeep = [...games.map(x => x.title), result.data];
        if (gamesToKeep.length > this.RECENT_MATCHES_LIMIT) {
          gamesToKeep = gamesToKeep.slice(gamesToKeep.length - this.RECENT_MATCHES_LIMIT);
        }
        gamesToKeep.sort();
        return setDoc(
          doc(this.firestore, 'games/_list'),
          { items: gamesToKeep },
          { merge: true });
      }),
      tap(_ => this.updatedFireData$.next(true)),
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

  selectedMatchSig = toSignal(this.selectedMatch$, { initialValue: null });



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
    withLatestFrom(this.players$),
    map(([gameEventDBData, players]) => {
      try {
        let result: GameEventData = {
          appliedRandomization: false,
          matchDate: gameEventDBData.matchDate,
          name: gameEventDBData.name,
          label: MatchDateTitle.fromString(gameEventDBData.name).suffix ?? "",
          registeredPlayers: gameEventDBData.registeredPlayerIds.map((id, index) => {
            return {
              id: id,
              name: getDisplayName(players.find(p => p.id === id) ?? Player.EMPTY),
              stars: players.find(p => p.id === id)?.stars ?? 0,
              reserve: gameEventDBData.playerReserveStatus ? gameEventDBData.playerReserveStatus[index] ?? false : false
            } as PlayerWithIdAndStars;
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
      let newPlayerReserveStatus = selectedMatchContent.registeredPlayers.map(p => p.reserve);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds,
        playerReserveStatus: newPlayerReserveStatus
      };
      return newMatchContent;
    }),
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        this.loadingFlagService.setLoadingFlag(true);
        return setDoc(
          doc(this.firestore, `games/${newMatchContent.name}`),
          newMatchContent,
          { merge: true }
        );
      }
      this.nextSaveDataSubject$.next(newMatchContent);
      return of();
    }),
    tap(_ => this.updatedFireData$.next(true)),
    tap(_ => this.loadingFlagService.setLoadingFlag(false)),
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
      let newPlayerReserveStatus = newRegisteredPlayers.map(p => p.reserve);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds,
        playerReserveStatus: newPlayerReserveStatus
      };
      return newMatchContent;
    }),
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        this.loadingFlagService.setLoadingFlag(true);
        return setDoc(
          doc(this.firestore, `games/${newMatchContent.name}`),
          newMatchContent,
          { merge: true }
        );
      }
      this.nextSaveDataSubject$.next(newMatchContent);
      return of();
    }),
    tap(_ => this.updatedFireData$.next(true)),
    tap(_ => this.loadingFlagService.setLoadingFlag(false)),
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
      let newRegisteredPlayers = selectedMatchContent.registeredPlayers.sort((a, b) => {
        // sort by reserve status first
        if (a.reserve && !b.reserve) return 1;
        if (!a.reserve && b.reserve) return -1;

        // sort by stars next
        if (a.stars > b.stars) return -1;
        if (a.stars < b.stars) return 1;

        // then by randomization factor
        return Math.random() - randomizationFactor - 0.25;
      });

      let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
      let newPlayerReserveStatus = newRegisteredPlayers.map(p => p.reserve);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds,
        playerReserveStatus: newPlayerReserveStatus
      };
      return newMatchContent;
    }),
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        this.loadingFlagService.setLoadingFlag(true);
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
    tap(_ => this.updatedFireData$.next(true)),
    tap(_ => this.loadingFlagService.setLoadingFlag(false)),
    catchError((err) => {
      console.warn("randomize player order encountered issue");
      return of(null);
    })
  );

  reapplyOrderAccordingToReserveStatusSubject$ = new Subject<PlayerWithIdAndStars>();
  reapplyOrderAccordingToReserveStatus$ = this.reapplyOrderAccordingToReserveStatusSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    tap(([_, selectedMatchContent]) => {
      console.log('reapplying order for reserve', selectedMatchContent);
    }),
    map(([player, selectedMatchContent]) => {
      let newRegisteredPlayers = selectedMatchContent.registeredPlayers.map(p => {
        if (p.id === player.id) {
          return { ...p, reserve: !player.reserve }; // toggle reserve status
        }
        return p;
      });

      // Reorder the players based on their reserve status.
      // Players with reserve status should be at the end of the list.
      newRegisteredPlayers = selectedMatchContent.registeredPlayers.sort((a, b) => {
        if (a.reserve && !b.reserve) return 1; // a is reserve, b is not
        if (!a.reserve && b.reserve) return -1; // a is not reserve, b is
        return 0; // equal reserve status
      });

      let newRegisteredPlayerIds = newRegisteredPlayers.map(p => p.id);
      let newPlayerReserveStatus = newRegisteredPlayers.map(p => p.reserve);
      let newMatchContent: GameEventDBData = {
        matchDate: selectedMatchContent.matchDate,
        name: selectedMatchContent.name,
        registeredPlayerIds: newRegisteredPlayerIds,
        playerReserveStatus: newPlayerReserveStatus
      };
      console.log('reapplyOrderAccordingToReserveStatus$', newMatchContent);
      return newMatchContent;
    }),
    withLatestFrom(this.autoSaveGameEventSubject$),
    switchMap(([newMatchContent, autoSave]) => {
      if (autoSave) {
        this.loadingFlagService.setLoadingFlag(true);
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
    tap(_ => this.updatedFireData$.next(true)),
    tap(_ => this.loadingFlagService.setLoadingFlag(false)),
    catchError((err) => {
      console.warn("randomize player order encountered issue");
      return of(null);
    })
  );

  readonly saveRaffleDataSubject$ = new Subject<void>();
  readonly saveRaffleData$ = this.saveRaffleDataSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    map(([_, data]) => {
      return data.registeredPlayers;
    }),
    withLatestFrom(this.players$),
    switchMap(([selectedPlayers, allPlayers]) => {
      allPlayers = allPlayers.map(p => {
        let foundIdx = selectedPlayers.findIndex(sp => sp.id === p.id);
        let starsToAdd = foundIdx != -1 ? (foundIdx > 11 ? 1 : -1) : 0;
        let newStars = (p.stars ? p.stars : 0) + starsToAdd;
        newStars = newStars < 0 ? 0 : newStars;
        return { ...p, stars: newStars };
      });
      this.playersService.updatePlayersList(allPlayers);
      return allPlayers;
    }),
    catchError((err) => {
      this.notificationService.show("Data save encountered an issue.");
      console.warn("save raffle data encountered issue");
      return of();
    })
  );

  readonly saveToDraftSubject$ = new Subject<void>();
  readonly saveToDraft$ = this.saveToDraftSubject$.asObservable().pipe(
    withLatestFrom(this.selectedMatchContent$),
    map(([_, data]) => {
      return data.registeredPlayers;
    }),
    withLatestFrom(this.players$),
    switchMap(([selectedPlayersIds, allPlayers]) => {
      let selectedPlayers = allPlayers.filter(player => {
        let foundIdx = selectedPlayersIds.findIndex(sp => sp.id === player.id);
        return foundIdx != -1;
      });

      // re-arrange the selectedPlayers array to match the order of the selectedPlayersIds array.
      selectedPlayers = selectedPlayers.sort((a, b) => {
        let aIdx = selectedPlayersIds.findIndex(sp => sp.id === a.id);
        let bIdx = selectedPlayersIds.findIndex(sp => sp.id === b.id);
        return aIdx - bIdx;
      });
      
      console.log("*** selectedPlayers", selectedPlayers);

      this.updatedFireData$.next(true);
      this.loadingFlagService.setLoadingFlag(true);
      return setDoc(doc(this.firestore, '/drafts/next'), { players: selectedPlayers }, { merge: true });
    }),
    tap(_ => this.notificationService.show("Draft saved")),
    catchError((err) => {
      this.notificationService.show("Data save encountered an issue.");
      console.warn("save raffle data encountered issue");
      return of();
    }),
    finalize(() => this.loadingFlagService.setLoadingFlag(false))
  );


  public getMatchData = (match: MatchDateTitle): Observable<GameEventDBData> => {
    return docData(doc(this.firestore, `games/${match.title}`)).pipe(
      map(gameEvent => {
        if (!gameEvent) {
          return Result.Err<GameEventDBData>("Game event not found");
        }
        return Result.Ok<GameEventDBData>(gameEvent as GameEventDBData);
      }),
      filter(Result.isOk),
      map(data => data.data as GameEventDBData),
      take(1),
      catchError((err) => {
        console.warn("Error encountered while reading game event", err);
        this.notificationService.show("Error encountered while reading game. Please REFRESH page.");
        return of(GameEventDBData.DEFAULT);
      }),
      finalize(() => this.loadingFlagService.setLoadingFlag(false))
    );
  };


  public createGameEvent(createMatchRequest: CreateGameRequest) {
    this.createGameEventSubject$.next(createMatchRequest);
  }

  addPlayerToMatch(player: Player) {
    this.addPlayerToMatchSubject$.next(player);
  }

  removePlayerFromMatch(playerWithId: PlayerWithId) {
    this.removePlayerFromMatchSubject$.next(playerWithId);
  }

  makePlayerReserve(playerWithId: PlayerWithIdAndStars) {
    playerWithId.reserve = !playerWithId.reserve; // toggle reserve status
    this.reapplyOrderAccordingToReserveStatusSubject$.next(playerWithId);
  }

  public randomizeOrder() {
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

  transferToCurrentDraft() {
    this.saveToDraftSubject$.next();
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
    this.subscriptions.push(this.recentGameTitles$.subscribe());
    this.subscriptions.push(this.selectedMatch$.subscribe());
    this.subscriptions.push(this.addPlayerToMatch$.subscribe());
    this.subscriptions.push(this.removePlayerFromMatch$.subscribe());
    this.subscriptions.push(this.randomizeOrder$.subscribe());
    this.subscriptions.push(this.triggerSaveData$.subscribe());
    this.subscriptions.push(this.saveRaffleData$.subscribe());
    this.subscriptions.push(this.saveToDraft$.subscribe());
    this.subscriptions.push(this.reapplyOrderAccordingToReserveStatus$.subscribe());
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