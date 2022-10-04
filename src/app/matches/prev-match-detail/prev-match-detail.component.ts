import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/shared/players.service';
import { RatingSystem } from 'src/app/shared/rating-system';
import { MatchService } from 'src/app/shared/match.service';
import { AuthAltService } from 'src/app/auth/auth-alt.service';

@Component({
  selector: 'app-prev-match-detail',
  templateUrl: './prev-match-detail.component.html',
  styleUrls: ['./prev-match-detail.component.css']
})
export class PrevMatchDetailComponent implements OnInit, OnDestroy {

  public showSpinner = true;

  customGame: CustomPrevGame;
  private subscriptions: Subscription[] = [];

  extractedTeam1: Array<Player> = [];
  extractedTeam2: Array<Player> = [];

  public team1Score = 0;
  public team2Score = 0;

  public matchResultsStored = true;
  public matchResultsAppliedToRatings = true;

  matchSearchKey = '';

  constructor(
    private route: ActivatedRoute,
    private matchAltSvc: MatchService,
    private playersSvc: PlayersService,
    private authAltSvc: AuthAltService) { }

  ngOnInit() {
    this.subscriptions.push(this.route.params.subscribe(
      (params: Params) => {
        this.matchSearchKey = params.id;
        this.loadCustomGameForKey(this.matchSearchKey);
      }
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }


  async loadCustomGameForKey(matchSearchKey: string) {
    this.customGame = null;
    this.showSpinner = true;

    const gameForMatch = await this.matchAltSvc.getMatchForDateAsync(matchSearchKey);
    this.showSpinner = false;
    if (gameForMatch) {
      this.customGame = { ...gameForMatch };
      this.extractedTeam1 = this.customGame.team1;
      this.extractedTeam2 = this.customGame.team2;

      this.matchResultsStored = this.customGame.savedResult;
      if (this.customGame.scoreTeam1 != null) {
        this.team1Score = this.customGame.scoreTeam1;
      } else {
        this.team1Score = 0;
        this.matchResultsStored = false;
      }

      if (this.customGame.scoreTeam2 != null) {
        this.team2Score = this.customGame.scoreTeam2;
      } else {
        this.team2Score = 0;
        this.matchResultsStored = false;
      }

      this.matchResultsAppliedToRatings = this.customGame.appliedResults;
    }
  }

  /**
   * Wrapper function for retrieving the player display name.
   * @param player Player object to display the name for.
   */
  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  getInitialRatingForPlayer(player: Player): string {
    return player.rating.toFixed(3);
  }

  getPostMatchDiffForPlayer(player: Player): string {
    if (!this.customGame.appliedResults) {
      return "";
    }

    const foundObj = this.customGame.postResults?.find(x => x.id === player.id);
    if (foundObj) {
      return foundObj.diff.toFixed(3);
    }

    return "~ 0.0";
  }

  onMatchSaveCliked() {
    // handle elsewhere
  }

  async onStoreResultClick() {
    if (!this.authAltSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    // show animation
    this.showSpinner = true;

    this.customGame.scoreTeam1 = this.team1Score;
    this.customGame.scoreTeam2 = this.team2Score;
    this.customGame.savedResult = true;
    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    this.matchResultsStored = this.customGame.savedResult;
    this.showSpinner = false;
  }


  isGoodRatingDiff(player: Player): boolean {
    if (!this.customGame.postResults) {
      return false;
    }
    const pair = this.customGame.postResults.find(x => x.id === player.id);
    //TODO: make dependent on rating system
    if (pair.diff > 0) {
      return true;
    }
    return false;
  }

  isBadRatingDiff(player: Player): boolean {
    if (!this.customGame.postResults) {
      return false;
    }
    const pair = this.customGame.postResults.find(x => x.id === player.id);
    //TODO: make dependent on rating system
    if (pair.diff < 0) {
      return true;
    }
    return false;
  }

  /**
   * Updates the ratings of the user for the loaded match.
   * The old player ratings are stored to an old entry. E.g.
   *    'ratings/2018-04-02'
   * The current player ratings are stored in the standard entry. E.g.
   *    'ratings/current'
   */
  async onUpdateRatingsClick() {
    if (!this.authAltSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    let currentMatch = await this.playersSvc.getCurrentRatingsAsync();
    let ratingSystem = RatingSystem.German;
    if (currentMatch) {
      if (currentMatch.version) {
        ratingSystem = currentMatch.version;
      }
    }

    const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame, ratingSystem
    );

    // Prepare the difference calculation
    const updatedPlayers = this.playersSvc.getPlayersWithUpdatedRatingsForGame(this.customGame, ratingSystem);
    if (updatedPlayers.length > 0) {
      if (!this.customGame.postResults) {
        this.customGame.postResults = [];
      }
      updatedPlayers.forEach(player => {
        // get old rating
        let oldRating = this.customGame.team1.find(x => x.id == player.id)?.rating;
        if (!oldRating) {
          oldRating = this.customGame.team2.find(x => x.id == player.id)?.rating;
        }

        this.customGame.postResults.push({ id: player.id, diff: player.rating - oldRating });
      })
    }

    // Store the 'old' ratings under a different entry.
    if (!currentMatch || !currentMatch.label) {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey);
    } else {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey + '_' + currentMatch.label);
      await this.playersSvc.addFieldValueToDocumentAsync("label", currentMatch.label, "current");
    }

    // Store the 'new' ratings under the 'current' entry.
    await this.playersSvc.savePlayersToListAsync(newPlayers, 'current');

    // Store the new data for the match.
    this.customGame.appliedResults = true;
    this.matchResultsAppliedToRatings = true;
    console.log('saving ', this.customGame);

    this.showSpinner = true;
    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    this.showSpinner = false;
  }

  public canShowStoreResultsButton(): boolean {
    return !this.matchResultsStored && this.authAltSvc.isAuthenticatedAsOrganizer();
  }

  public canShowApplyResultsButton(): boolean {
    return !this.matchResultsAppliedToRatings && this.authAltSvc.isAuthenticatedAsOrganizer();
  }

  public canChangeScore(): boolean {
    return !this.matchResultsStored;
  }
}
