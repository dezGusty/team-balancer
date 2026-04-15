import { Component, NgZone, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription, Subject } from 'rxjs';
import { Match } from '../shared/match.model';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { ActivatedRoute } from '@angular/router';
import { DraftService } from '../shared/draft.service';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { NotificationService } from '../utils/notification/notification.service';

import { MatchCombosComponent } from '../matches/match-combos/match-combos.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { PlayerMiniCardComponent } from '../players/player-mini-card/player-mini-card.component';
import { PlayerFilterPipe } from '../matches/player-filter.pipe';

@Component({
    imports: [
    CommonModule,
    FormsModule,
    MatchCombosComponent,
    PlayerCardComponent,
    PlayerMiniCardComponent,
    PlayerFilterPipe
],
    selector: 'app-customgame',
    styleUrl: './customgame.component.css',
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
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private ngZone: NgZone) {
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

          this.notificationService.show('Reloaded all players from service. \n'
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

  onRemoveSelectedPlayer(player: Player) {
    this.matchData.movePlayerBackToPool(player);
    this.searchedName = '';
  }

  onPlayerLockTeam1(player: Player) {
    player.affinity = player.affinity === 1 ? 0 : 1;
  }

  onPlayerLockTeam2(player: Player) {
    player.affinity = player.affinity === 2 ? 0 : 2;
  }

  public isAddPlayerSideNavOpen = false;

  openAddPlayerSideNav() {
    this.isAddPlayerSideNavOpen = true;
  }

  closeAddPlayerSideNav() {
    this.isAddPlayerSideNavOpen = false;
  }

  onAvailablePlayerSelected($event: any) {
    const selectedPlayer: Player = $event;
    if (!selectedPlayer) return;
    this.matchData.movePlayerToDraft(selectedPlayer);
    this.searchedName = '';
    this.isAddPlayerSideNavOpen = false;
  }

  onMakeTeamsClicked() {
    this.showCombinations = true;
    this.emitMakeTeamsEventToChild();
  }

  onCardMouseDown($event: MouseEvent, player: Player) {
    if ($event.button !== 0) return;
    $event.preventDefault();
    const startX = $event.clientX;
    const wrapperEl = ($event.currentTarget as HTMLElement);
    wrapperEl.classList.add('is-dragging');

    this.ngZone.runOutsideAngular(() => {
      const onMouseMove = (e: MouseEvent) => {
        const delta = Math.max(-130, Math.min(130, e.clientX - startX));
        wrapperEl.style.transform = `translateX(${delta}px)`;
      };

      const onMouseUp = (e: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        wrapperEl.style.transform = '';
        wrapperEl.classList.remove('is-dragging');

        const delta = e.clientX - startX;
        if (Math.abs(delta) < 50) return;

        this.ngZone.run(() => {
          if (delta < 0) {
            if (player.affinity === 2) { player.affinity = 0; }
            else { this.onPlayerLockTeam1(player); }
          } else {
            if (player.affinity === 1) { player.affinity = 0; }
            else { this.onPlayerLockTeam2(player); }
          }
        });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private touchStartX = 0;

  onCardTouchStart($event: TouchEvent, _player: Player) {
    this.touchStartX = $event.touches[0].clientX;
  }

  onCardTouchEnd($event: TouchEvent, player: Player) {
    const deltaX = $event.changedTouches[0].clientX - this.touchStartX;
    const threshold = 50;
    if (Math.abs(deltaX) < threshold) return;

    if (deltaX < 0) {
      // Swipe left → assign to team1 (or reset if crossing from team2)
      if (player.affinity === 2) {
        player.affinity = 0;
      } else {
        this.onPlayerLockTeam1(player);
      }
    } else {
      // Swipe right → assign to team2 (or reset if crossing from team1)
      if (player.affinity === 1) {
        player.affinity = 0;
      } else {
        this.onPlayerLockTeam2(player);
      }
    }
  }
}
