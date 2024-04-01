import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameEventsService } from '../history/data-access/game-events.service';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayersService } from 'src/app/shared/players.service';
import { BehaviorSubject, Subject, combineLatest, map, tap, withLatestFrom } from 'rxjs';
import { Player } from 'src/app/shared/player.model';
import { PlayerWithId } from '../history/data-access/create-game-request.model';

@Component({
  selector: 'app-gameeventdraft',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './gameeventdraft.component.html',
  styleUrl: './gameeventdraft.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameeventdraftComponent {
  protected searchedName: string = '';
  private gameEventsService: GameEventsService = inject(GameEventsService);
  private playersService: PlayersService = inject(PlayersService);
  public selectedMatchContent = this.gameEventsService.selectedMatchContent;
  selectedMatchContent$ = this.gameEventsService.selectedMatchContent$;

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
      return players.filter(
        player => {
          return player.name.toLowerCase().includes(filterByContent.toLowerCase())
            || player.displayName.toLowerCase().includes(filterByContent.toLowerCase())
            || player.keywords.split(' ').some(keyword => keyword.toLowerCase().includes(filterByContent.toLowerCase()));
        }
      );
    }),
    tap(filteredPlayers => {
      console.log('filteredPlayers', filteredPlayers);
      if (filteredPlayers.length == 1) {
        // TODO: add special marker for the 1st matching item?
        // Maybe only do it from CSS?
        this.keyboardCachedPlayerSubject$.next(filteredPlayers[0]);
      }
      else {
        this.keyboardCachedPlayerSubject$.next(undefined);
      }
    })
  );

  keyboardCachedPlayerSubject$: Subject<Player | undefined> = new Subject<Player | undefined>();
  keyboardCachedPlayer$ = this.keyboardCachedPlayerSubject$.asObservable().pipe(
    tap(x => console.log("keyboardCachedPlayer$", x))
  );

  enterPressedSubject$: Subject<string> = new Subject<string>();
  enterHandler$ = this.enterPressedSubject$.asObservable().pipe(
    withLatestFrom(this.keyboardCachedPlayer$),
    tap(([content, player]) => {
      console.log('enterHandler$', content, player);
      if (player) {
        this.onClickToAddPlayer(player);
      }
    })
  );

  onSearchContentChange($event: any) {
    if ($event.code === 'Enter') {
      // try to get the 1st matching item and move it to the draft.
      // const filteredPlayers = filterPlayerArray(this.availablePlayerList, $event.target.value);
      // if (filteredPlayers.length === 1) {
      //   this.movePlayerToDraft(filteredPlayers[0]);
      // }
      this.enterPressedSubject$.next($event.target.value);
      this.filterByContentSubject$.next('');
      this.searchedName = '';
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
}
