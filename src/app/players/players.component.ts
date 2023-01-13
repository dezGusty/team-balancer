import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { RatingSystem } from '../shared/rating-system';
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

@Component({
  imports: [
    CommonModule,
    RouterModule,
    ToastsContainer,
    SmallLoadingSpinnerComponent,
    FormsModule,
    PlayerFilterPipe,
  PlayerRoutedCardComponent],
  selector: 'app-players',
  standalone: true,
  styles: [''],
  templateUrl: './players.component.html',
})

export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[] = [];
  selectedPlayer: Player | null;
  editMode: boolean;

  private subscriptions: Subscription[] = [];
  public loadArchive: boolean = false;
  public showLoading: boolean = false;

  searchedName = '';
  loadingConvert = -1;

  ratingHistory: Map<string, RatingHist> = new Map<string, RatingHist>();
  matchHistory: Map<string, CustomPrevGame> = new Map<string, CustomPrevGame>();
  ratingScale: RatingSystem = RatingSystem.Progressive;

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private toastSvc: ToastService,
    private router: Router,
    private route: ActivatedRoute) {
    this.selectedPlayer = null;
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

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
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

  onPlayerSelected($event: any) {
    console.log('on player selected');

  }
}
