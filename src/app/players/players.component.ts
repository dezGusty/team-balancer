import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { ToastService } from '../shared/toasts-service';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { RatingHist } from '../shared/rating-hist.model';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { ToastsContainer } from '../toast/toast-container.component';
import { SmallLoadingSpinnerComponent } from '../ui/small-loading-spinner/small-loading-spinner.component';
import { FormsModule } from '@angular/forms';
import { PlayerFilterPipe } from '../matches/player-filter.pipe';
import { PlayerRoutedCardComponent } from './player/player-routed-card.component';
import { PlayerDetailsNewComponent } from "./player-details-new/player-details-new.component";
import { PlayerDetailsComponent } from "./player-details/player-details.component";

@Component({
  selector: 'app-players',
  standalone: true,
  styles: [''],
  templateUrl: './players.component.html',
  imports: [
    CommonModule,
    RouterModule,
    ToastsContainer,
    SmallLoadingSpinnerComponent,
    FormsModule,
    PlayerFilterPipe,
    PlayerRoutedCardComponent,
    PlayerDetailsNewComponent
  ]
})

export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[] = [];
  editMode: boolean;

  private subscriptions: Subscription[] = [];
  public loadArchive: boolean = false;
  public showLoading: boolean = false;

  selectedPlayer: Player | undefined;

  searchedName = '';
  loadingConvert = -1;

  ratingHistory: Map<string, RatingHist> = new Map<string, RatingHist>();
  matchHistory: Map<string, CustomPrevGame> = new Map<string, CustomPrevGame>();

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private toastSvc: ToastService,
    private router: Router,
    private route: ActivatedRoute) {
    this.editMode = false;
  }

  ngOnInit() {
    this.showLoading = true;
    this.players = this.playersSvc.getPlayers(this.loadArchive);
    this.subscriptions.push(this.playersSvc.playerDataChangeEvent
      .subscribe(
        (playerChangeInfo: PlayerChangeInfo | undefined) => {
          if (!playerChangeInfo) {
            console.warn('missing playerchange info in subscription callback');
            return;
          }

          if (!playerChangeInfo.players) {
            // This could be the case when there are no players currently, but a progress event is issued.
            if (playerChangeInfo.messageType === 'loading') {
              this.showLoading = true;
            }
            return;
          }

          this.showLoading = false;
          this.players = this.playersSvc.getPlayers(this.loadArchive);
          this.toastSvc.show('Reloaded all players from service. \n'
            + playerChangeInfo.messageType + '\n'
            + playerChangeInfo.messagePayload);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });

  }

  public canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public onNewPlayerClicked($event: any): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  public onSavePlayerClicked($event: any): void {
    this.playersSvc.saveAllPlayers();
  }

  onSearchContentChange($event: any) {
    // try to apply the target value.
    const filteredPlayers = filterPlayerArray(this.players, $event.target.value);
    if (filteredPlayers.length === 1) {
      // show special marker?
    }
  }

  onCheckReload($event: any) {
    this.loadArchive = !this.loadArchive;
    this.players = this.playersSvc.getPlayers(this.loadArchive);
    if (this.loadArchive) {
      this.toastSvc.show("Including archived players");
    } else {
      this.toastSvc.show("Excluding archived players");
    }
  }

  onPlayerSelected(player: Player) {
    console.log('*** on player selected', player);
    this.selectedPlayer = player;
    this.isSideNavOpen = true;
  }

  protected isSideNavOpen = false;
  onSideNavOuterContainerClicked() {
    this.isSideNavOpen = false;
  }
  onCloseSideNavBtnClick() {
    this.isSideNavOpen = false;
  }

  onMovePlayerToArchive(player?: Player) {
    if (!player) {
      return;
    }
    this.playersSvc.movePlayerToArchive(player);
    this.isSideNavOpen = false;
  }

  onMovePlayerToActive(player?: Player) {
    if (!player) {
      return;
    }
    this.playersSvc.pullPlayerFromArchive(player);
    this.isSideNavOpen = false;
  }

}
