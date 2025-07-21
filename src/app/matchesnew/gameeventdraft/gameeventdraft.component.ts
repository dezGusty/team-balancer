import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, inject, model } from '@angular/core';
import { GameEventsService } from '../history/data-access/game-events.service';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayersService } from 'src/app/shared/players.service';
import { BehaviorSubject, Observable, Subject, combineLatest, interval, map, mergeMap, repeat, skipUntil, startWith, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';
import { Player, filterPlayersArrayByContent, getDisplayName } from 'src/app/shared/player.model';
import { GameEventData, PlayerWithId, PlayerWithIdAndStars } from '../history/data-access/create-game-request.model';


export interface Selectable<T> {
  selected: boolean;
  data: T;
};


@Component({
    selector: 'app-gameeventdraft',
    standalone: true,
    imports: [AsyncPipe, FormsModule],
    templateUrl: './gameeventdraft.component.html',
    styleUrl: './gameeventdraft.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameeventdraftComponent {

  protected searchedNameSg = model("");
  private gameEventsService: GameEventsService = inject(GameEventsService);
  private playersService: PlayersService = inject(PlayersService);
  public selectedMatchContent = this.gameEventsService.selectedMatchContent;


  private readonly randomizeMouseDownSubject$: Subject<void> = new Subject<void>();
  private readonly randomizeMouseUpSubject$: Subject<void> = new Subject<void>();
  protected readonly randomizeOperation$ = this.randomizeMouseDownSubject$.pipe(
    switchMap(
      _ => {
        return interval(100).pipe(
          startWith(0),
          takeUntil(this.randomizeMouseUpSubject$),
          tap(_ => this.randomizeOrder())
        );
      }
    ),
  );

  protected readonly hasDataToSave$: Observable<boolean> = this.gameEventsService.nextSaveDataSubject$.pipe(
    map(nextSaveData => nextSaveData !== undefined && nextSaveData.matchDate !== undefined && nextSaveData.matchDate != ""),
    tap(item => console.log('hasDataToSave$', item))
  );

  protected readonly hasEnoughPlayersForRandomize$: Observable<boolean> = this.gameEventsService.selectedMatchContent$.pipe(
    // only return true if there are more than 12 players in the match.
    map(selectedMatchContent => selectedMatchContent.registeredPlayers.length > 12),
  );

  protected readonly canStillApplyRandomization$: Observable<boolean> = this.gameEventsService.selectedMatchContent$.pipe(
    // only if the match randomization was not saved already in the appliedRandomization field.
    map(selectedMatchContent => selectedMatchContent.appliedRandomization == false
      && selectedMatchContent.registeredPlayers.length > 12
    ),
  );

  protected readonly autoSaveGameEventSignal = this.gameEventsService.autoSaveGameEventSignal;

  @ViewChild('srcNameArea') srcNameArea!: ElementRef;

  selectedMatchContent$: Observable<GameEventData> = this.gameEventsService.selectedMatchContent$;

  filterByContentSubject$ = new BehaviorSubject<string>('');

  players$ = this.playersService.players$;
  availablePlayerList$ = combineLatest(
    [this.players$,
    this.selectedMatchContent$]
  ).pipe(
    map(([players, selectedMatchContent]) => {
      return players.filter(player => !selectedMatchContent.registeredPlayers.some(p => p.id === player.id));
    })
  );

  filteredAvailablePlayers$ = combineLatest(
    [this.availablePlayerList$, this.filterByContentSubject$]
  ).pipe(
    map(([players, filterByContent]) => {
      return filterPlayersArrayByContent(players, filterByContent);
    }),
    map(players => {
      return players.map(player => {
        return {
          selected: false,
          data: player
        } as Selectable<Player>;
      });
    }),
    map(players => {
      // if there are more than 0 players, mark the first with selected = true.
      if (players.length > 0) {
        players[0].selected = true;
      }

      return players;
    })
  );

  protected readonly selectedMatchContentWithHighlights$ = combineLatest(
    [this.gameEventsService.selectedMatchContent$, this.filterByContentSubject$, this.players$]).pipe(
      map(([selectedMatchContent, filterByContent, players]) => {
        console.log('selectedMatchContentWithHighlights$', selectedMatchContent);
        if (filterByContent === '') {
          return selectedMatchContent.registeredPlayers.map(player => {
            return {
              selected: false,
              data: player
            };
          });
        }

        let matchingPlayers = filterPlayersArrayByContent(players, filterByContent);

        // if the item is contained in matchingPlayers, return it with the selected flag set to true, otherwise false.
        let result: Selectable<PlayerWithIdAndStars>[] = selectedMatchContent.registeredPlayers.map(
          player => {
            return {
              selected: matchingPlayers.some(p => p.id === player.id),
              data: player
            };
          }
        );
        return result;
      }
      )
    );


  enterPressedSubject$: Subject<string> = new Subject<string>();
  enterHandler$ = this.enterPressedSubject$.asObservable().pipe(
    withLatestFrom(this.filteredAvailablePlayers$),
    tap(([content, players]) => {
      console.log('enterHandler$', content, players);
      // Get the first that are selected.
      let selected = players.find(p => p.selected)?.data;
      if (selected) {
        this.onClickToAddPlayer(selected);
      }
    })
  );

  @HostListener('window:keydown.control./', ['$event'])
  startSearching(event: KeyboardEvent) {
    setTimeout(() => { // this will make the execution after the above boolean has changed
      this.srcNameArea?.nativeElement.focus();
    }, 0);
  }

  onSearchContentClear() {
    this.searchedNameSg.set('');
    this.filterByContentSubject$.next('');
  }

  onSearchContentChange($event: any) {
    if ($event.code === 'Enter') {
      // try to get the 1st matching item and move it to the draft.
      this.enterPressedSubject$.next($event.target.value);
      this.filterByContentSubject$.next('');
      this.searchedNameSg.set('');
    } else {
      this.filterByContentSubject$.next($event.target.value);
    }
  }

  onClickToAddPlayer(player: Player) {
    console.log('Adding player to match', player);
    this.gameEventsService.addPlayerToMatch(player);
  }

  onClickToRemovePlayerById(playerWithId: PlayerWithId) {
    console.log('Removing player from match', playerWithId);
    this.gameEventsService.removePlayerFromMatch(playerWithId);
  }

  onToggleReserve(playerWithId: PlayerWithIdAndStars) {
    console.log('Toggle player reserve', playerWithId);
    // playerWithId.reserve = !playerWithId.reserve;
    this.gameEventsService.makePlayerReserve(playerWithId);
  }

  onToggleAutoSaveChange(checkboxValue: boolean) {
    console.log('onToggleAutoSaveChange', checkboxValue)
    this.gameEventsService.setAutoSave(checkboxValue);
  }

  randomizeMouseDown() {
    this.randomizeMouseDownSubject$.next();
  }

  randomizeMouseUp() {
    this.randomizeMouseUpSubject$.next();
  }

  randomizeOrder() {
    // reorder the players in the match.
    this.gameEventsService.randomizeOrder();
  }

  save() {
    this.gameEventsService.save();
  }

  saveRaffle() {
    this.gameEventsService.saveRaffle();
  }

  transferToDraft() {
    this.gameEventsService.transferToCurrentDraft();
  }

  getDisplayInfo(player: Player): string {
    return getDisplayName(player);
  }
}
