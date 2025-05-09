import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { Match } from '../shared/match.model';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { ActivatedRoute } from '@angular/router';
import { DraftService } from '../shared/draft.service';
import { ToastService } from '../shared/toasts-service';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { CommonModule } from '@angular/common';
import { MatchCombosComponent } from '../matches/match-combos/match-combos.component';
import { FormsModule } from '@angular/forms';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { PlayerCardPrefComponent } from '../player-card-pref/player-card-pref.component';
import { PlayerFilterPipe } from '../matches/player-filter.pipe';

@Component({
    imports: [
        CommonModule,
        FormsModule,
        MatchCombosComponent,
        PlayerCardComponent,
        PlayerCardPrefComponent,
        PlayerFilterPipe
    ],
    selector: 'app-customgame',
    styles: [''],
    templateUrl: './customgame.component.html'
})
export class CustomgameComponent implements OnInit, OnDestroy {

  private useDraftPlayersAsInput = false;

  searchedName: string = '';
  public showCombinations = false;

  public matchData = new Match(new Date(Date.now()));
  // public selectedPlayer: Player | undefined;
  makeTeamsSubject: Subject<void> = new Subject<void>();

  private subscriptions: Subscription[] = [];


  /**
   * Constructor for the Custom game component. Can be instanced in 2 ways:
   * - with a preconfigured list of players
   * - without a preconfigured list of players
   * @param playersSvc The service providing the player data
   * @param route The activated route. Used to obtain the data.
   */
  constructor(
    private playersSvc: PlayersService,
    private draftSvc: DraftService,
    private toastSvc: ToastService,
    private route: ActivatedRoute) {
    this.matchData.availablePlayersPool = this.playersSvc.getPlayers();
    this.matchData.draftPlayers.forEach(element => {
      this.matchData.removePlayerFromPool(element);
    });
  }

  ngOnInit() {

    this.subscriptions.push(this.playersSvc.playerDataChangeEvent
      .subscribe(
        (playerChangeInfo: PlayerChangeInfo | undefined) => {
          if (!playerChangeInfo) {
            console.warn('no playerchange info received');
            return;
          }
          this.reloadInternal();

          this.toastSvc.show('Reloaded all players from service. \n'
            + playerChangeInfo.messageType + '\n'
            + playerChangeInfo.messagePayload);

        }
      )
    );

    this.subscriptions.push(this.route.queryParams
      .subscribe(params => {
        console.log('[custom] qparams:', params);
        this.useDraftPlayersAsInput = params['draft'];
        this.reloadInternal();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });
  }

  reloadInternal() {
    this.matchData.availablePlayersPool = [...this.playersSvc.getPlayers()];

    console.log('[custom] reload; use draft:' + this.useDraftPlayersAsInput);

    // Use the Id
    if (this.useDraftPlayersAsInput) {
      const draftedPlayerIds = this.draftSvc.getDraftedPlayers().map(player => player.id);
      this.matchData.setMultiPlayersToDraftById(draftedPlayerIds);
    } else {
      this.matchData.setMultiPlayersToDraftById([]);
    }
  }

  emitMakeTeamsEventToChild() {
    console.log('emitting event');
    this.makeTeamsSubject.next();
  }

  onSearchContentChange($event: any) {
    if ($event.code === 'Enter') {
      // try to apply the target value.
      const filteredPlayers = filterPlayerArray(this.matchData.availablePlayersPool, $event.target.value);
      if (filteredPlayers.length === 1) {
        this.matchData.movePlayerToDraft(filteredPlayers[0]);
      }

      this.searchedName = '';
    } else {

      // try to apply the target value.
      const filteredPlayers = filterPlayerArray(this.matchData.availablePlayersPool, $event.target.value);
      if (filteredPlayers.length === 1) {
        // show special marker?
      }
    }
  }

  onPlayerSelected($event: any) {
    const selectedPlayer: Player = $event;
    if (!selectedPlayer) {
      return;
    }

    const currentPosition = this.matchData.draftPlayers.indexOf(selectedPlayer);
    if (currentPosition !== -1) {
      this.matchData.movePlayerBackToPool(selectedPlayer);
      this.searchedName = '';
    } else {
      this.matchData.movePlayerToDraft(selectedPlayer);
      this.searchedName = '';
    }
  }

  onPlayerLockTeam1($event: any) {
    const selectedPlayer: Player = $event;
    if (!selectedPlayer) {
      return;
    }

    console.log('onPlayerLockTeam1');
    if (selectedPlayer.affinity === 1) {
      // toggle back
      selectedPlayer.affinity = 0;
      return;
    }

    selectedPlayer.affinity = 1;
    return;
  }

  onPlayerLockTeam2($event: any) {
    const selectedPlayer: Player = $event;
    if (!selectedPlayer) {
      return;
    }

    console.log('onPlayerLockTeam2');
    if (selectedPlayer.affinity === 2) {
      // toggle back
      selectedPlayer.affinity = 0;
      return;
    }

    selectedPlayer.affinity = 2;
    return;
  }

  onMakeTeamsClicked() {
    this.showCombinations = true;
    this.emitMakeTeamsEventToChild();
  }
}
