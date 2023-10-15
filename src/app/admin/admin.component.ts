import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { RatingScaler } from '../shared/rating-scaler';
import { RatingSystemSettings } from '../shared/rating-system';
import { ToastService } from '../shared/toasts-service';
import { RatingHist } from '../shared/rating-hist.model';
import { MatchService } from '../shared/match.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastsContainer } from '../toast/toast-container.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { PlayerRoutedCardComponent } from '../players/player/player-routed-card.component';
@Component({
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    PlayerRoutedCardComponent,
    ToastsContainer
  ],
  selector: 'app-admin',
  standalone: true,
  styles: [''],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit, OnDestroy {

  currentLabel: string = "";
  players: Player[] = [];

  matchHistory: Map<string, CustomPrevGame> = new Map();
  ratingHistory: Map<string, RatingHist> = new Map();
  ratingChosen: any;
  loadingConvert = -1;
  newBranchName: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private matchesSvc: MatchService,
    private toastSvc: ToastService) {

  }

  ngOnInit(): void {
    this.players = this.playersSvc.getPlayers();
    this.currentLabel = this.playersSvc.getCurrentLabel();
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

  changeAction(obj: any) {
    this.ratingChosen = obj;
    console.log('Chosen rating key', this.ratingChosen.key);
    const data: RatingHist | undefined = this.ratingHistory.get(this.ratingChosen.key);
    if (!data) {
      return
    }
    this.players = data.players;
    console.log('players', this.players);
  }

  async onNewBranchClicked($event: any) {
    this.loadingConvert = 1;
    let branchToEdit = this.ratingChosen.key;

    if (this.newBranchName) {
      branchToEdit = branchToEdit.slice(0, 10) + '_' + this.newBranchName;
    }

    const oldPlayerList: Player[] = this.ratingChosen.value.players;

    // Perform a backup of the old ratings.
    await this.playersSvc.savePlayersToListAsync(oldPlayerList, branchToEdit + '_bck');

    const oldMinRating = Math.min(...oldPlayerList.map(x => x.rating)).toFixed(2);
    const oldMaxRating = Math.max(...oldPlayerList.map(x => x.rating)).toFixed(2);

    let scaledPlayers: Player[] = RatingScaler.rescalePlayerRatings(
      oldPlayerList,
      RatingSystemSettings.GetExpectedLowerEndRating(),
      RatingSystemSettings.GetExpectedUpperEndRating(), false);
    const newMinRating = Math.min(...scaledPlayers.map(x => x.rating)).toFixed(2);
    const newMaxRating = Math.max(...scaledPlayers.map(x => x.rating)).toFixed(2);

    let messageToShow: string = 'Rating systems scale: \n'
      + 'old: ' + ' (' + oldMinRating + '-' + oldMaxRating + ')\n'
      + 'new:'  + ' (' + newMinRating + '-' + newMaxRating + ')';

    this.toastSvc.show(messageToShow, { delay: 7500 });
    console.log(messageToShow);


    await this.playersSvc.savePlayersToListAsync(scaledPlayers, 'current');

    this.loadingConvert = 0;
  }

  async storeRatingForPlayersInMatch($event: any) {
    if (!this.ratingChosen) {
      return;
    }

    this.loadingConvert = 1;
    const matchKey = this.matchesSvc.getMatchDateFromRatingDateWithLabel(this.ratingChosen.key);
    const gameObj: CustomPrevGame | undefined = await this.matchesSvc.getMatchForDateAsync(matchKey);

    if (!gameObj) {
      return;
    }

    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(gameObj, matchKey);

    this.loadingConvert = 0;
    return;

  }
}
