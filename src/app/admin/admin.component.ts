import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { PlayerChangeInfo } from '../shared/player-change-info';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { RatingScaler } from '../shared/rating-scaler';
import { RatingSystem, RatingSystemSettings } from '../shared/rating-system';
import { ToastService } from '../shared/toasts-service';
import { RatingHist } from '../shared/rating-hist.model';
import { MatchService } from '../shared/match.service';
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styles: ['']
})
export class AdminComponent implements OnInit, OnDestroy {

  currentLabel: string = "";
  players: Player[] = [];

  matchHistory: Map<string, CustomPrevGame> = new Map();
  ratingHistory: Map<string, RatingHist> = new Map();
  protected ratingSystemsDescriptions: string[] = [];
  ratingChosen: any;
  loadingConvert = -1;
  newBranchName: string = '';
  newRatingScale: RatingSystem = RatingSystem.Progressive;
  oldRatingScale: RatingSystem = RatingSystem.Progressive;
  private selectedRatingSystem: RatingSystem = RatingSystem.Progressive;

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
    this.ratingSystemsDescriptions = Object.keys(RatingSystem).filter(p => isNaN(Number(p)));
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
    this.selectedRatingSystem = data.ratingSystem;
    if (this.selectedRatingSystem == null) {
      this.selectedRatingSystem = RatingSystem.German;
    }
    console.log('selectedRatingSystem', this.selectedRatingSystem);
  }

  changeRatingDropdown(selectedSys: string) {
    this.newRatingScale = RatingSystem[selectedSys as keyof typeof RatingSystem];
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
    await this.playersSvc.addFieldValueToDocumentAsync('ratingSystem', this.selectedRatingSystem, branchToEdit + '_bck');

    const oldMinRating = Math.min(...oldPlayerList.map(x => x.rating)).toFixed(2);
    const oldMaxRating = Math.max(...oldPlayerList.map(x => x.rating)).toFixed(2);

    let scaledPlayers: Player[] = RatingScaler.rescalePlayerRatings(
      oldPlayerList,
      RatingSystemSettings.GetExpectedLowerEndRating(this.newRatingScale),
      RatingSystemSettings.GetExpectedUpperEndRating(this.newRatingScale),
      this.newRatingScale !== this.selectedRatingSystem);
    const newMinRating = Math.min(...scaledPlayers.map(x => x.rating)).toFixed(2);
    const newMaxRating = Math.max(...scaledPlayers.map(x => x.rating)).toFixed(2);

    let messageToShow: string = 'Rating systems: \n'
      + 'old: ' + RatingSystem[this.selectedRatingSystem] + ' (' + oldMinRating + '-' + oldMaxRating + ')\n'
      + 'new:' + RatingSystem[this.newRatingScale] + ' (' + newMinRating + '-' + newMaxRating + ')';

    this.toastSvc.show(messageToShow, { delay: 7500 });
    console.log(messageToShow);


    await this.playersSvc.savePlayersToListAsync(scaledPlayers, 'current');
    await this.playersSvc.addFieldValueToDocumentAsync('ratingSystem', this.newRatingScale, 'current');

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

    // Go through each player and add the results to a separate item.
    gameObj.postResults.forEach(async diffPair => {
      let playerToUpdate = this.playersSvc.getPlayerById(diffPair.id);
      if (!playerToUpdate) {
        return;
      }

      const existingEntry = playerToUpdate.mostRecentMatches?.find(x => x.date == matchKey);
      if (existingEntry) {
        // update or ignore?
        // ignore 
        console.log('existing entry', existingEntry);

      } else {
        if (playerToUpdate.mostRecentMatches == null) {
          playerToUpdate.mostRecentMatches = new Array<{ date: string, diff: number }>;
        }
        playerToUpdate.mostRecentMatches.push({ date: matchKey, diff: diffPair.diff });

        // don't keep all ratings, just the most recent ones, so sort them.
        playerToUpdate.mostRecentMatches.sort((a, b) => a.date > b.date ? -1 : 1);
        if (playerToUpdate.mostRecentMatches.length > 10) { //xxx MAGIC NUMBER
          // playerToUpdate.mostRecentMatches = playerToUpdate.mostRecentMatches.slice(Math.max(playerToUpdate.mostRecentMatches.length - 10, 0));
          playerToUpdate.mostRecentMatches = playerToUpdate.mostRecentMatches.slice(0, 10);//xxx MAGIC NUMBER
        }
      }

      // search for player by id
      this.playersSvc.updateCachedPlayerById(diffPair.id, playerToUpdate);
      await this.playersSvc.saveAllPlayersToFirebaseAsync();
    });

    this.loadingConvert = 0;
    return;

  }
}
