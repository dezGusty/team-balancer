import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { ToastService } from '../shared/toasts-service';
import { RatingHist } from '../shared/rating-hist.model';
import { MatchService } from '../shared/match.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastsContainer } from '../toast/toast-container.component';
import { PlayerRoutedCardComponent } from '../players/player/player-routed-card.component';
import { UserAuthService } from '../auth/user-auth.service';
@Component({
  imports: [
    CommonModule,
    FormsModule,
    PlayerRoutedCardComponent,
    ToastsContainer
  ],
  selector: 'app-admin',
  standalone: true,
  styles: [`
.profile-pic {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}
`],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit, OnDestroy {

  user$ = this.userAuthService.loggedInUser$;

  dataRetrieval$ = this.userAuthService.dataRetrieval$;

  currentLabel: string = "";
  players: Player[] = [];

  matchHistory: Map<string, CustomPrevGame> = new Map();
  ratingHistory: Map<string, RatingHist> = new Map();
  loadingConvert = -1;


  private subscriptions: Subscription[] = [];

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private matchesSvc: MatchService,
    private toastSvc: ToastService,
    private userAuthService: UserAuthService) {

  }

  ngOnInit(): void {
    this.players = this.playersSvc.getPlayers();
    this.subscriptions.push(this.playersSvc.playerDataChangeEvent
      .subscribe(
        (playerChangeInfo: PlayerChangeInfo | undefined) => {
          if (!playerChangeInfo) {
            return;
          }

          this.players = this.playersSvc.getPlayers();
          this.toastSvc.show('Reloaded all players from service. \n'
            + playerChangeInfo.messageType + '\n'
            + playerChangeInfo.messagePayload);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });
  }

  public canExportPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }


  public async onConvertRatingClicked($event: any) {
    this.loadingConvert = 1;
    // Reset player ratings.
    for (let player of this.playersSvc.getPlayers()) {
      player.rating = 5;
    }
    this.playersSvc.saveAllPlayers();

    // Create rating entries again, based on the matches whose results were applied.
    let recentMatchNames = [...this.matchesSvc.getRecentMatchListCached()];
    recentMatchNames.forEach(async matchName => {
      const customGame = await this.matchesSvc.getMatchForDateAsync(matchName);
      if (customGame) {

        if (customGame.appliedResults) {
          const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
            this.playersSvc.getPlayers(), customGame
          );

          await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), matchName);
          await this.playersSvc.savePlayersToListAsync(newPlayers, 'current');

        }
      };
    })
    this.loadingConvert = 0;
  }

  public onExportPlayerClicked($event: any): void {
    // export data as json
    const content: string = JSON.stringify(this.playersSvc.getPlayers(true), null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  }

  async checkDropDown(dropdown: boolean) {
    if (dropdown == true) {
      this.ratingHistory = await this.playersSvc.getRatingHistoryAsync();
      this.matchHistory = await this.matchesSvc.getMatchListAsync();
    }
  }

  onTestLoginClick($event: any) {
    this.userAuthService.doGoogleLogin();
  }

  onOtherLoginClick($event: any) {
    this.userAuthService.doOtherGoogleLogin();
  }
}
