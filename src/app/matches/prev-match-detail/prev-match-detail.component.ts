import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { MatchService } from '../../shared/match.service';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/shared/players.service';
import { update } from 'firebase/database';
import { AuthService } from 'src/app/auth/auth.service';

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
    private matchSvc: MatchService,
    private playersSvc: PlayersService,
    private authSvc: AuthService) { }

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


  loadCustomGameForKey(matchSearchKey: string) {
    this.customGame = null;
    this.showSpinner = true;

    this.matchSvc.getMatchForDateAsync(matchSearchKey).subscribe((customGame: CustomPrevGame) => {
      this.customGame = customGame;
      this.extractedTeam1 = customGame.team1;
      this.extractedTeam2 = customGame.team2;
      this.showSpinner = false;
      this.matchResultsStored = customGame.savedResult;
      if (customGame.scoreTeam1 != null) {
        this.team1Score = customGame.scoreTeam1;
      } else {
        this.team1Score = 0;
        this.matchResultsStored = false;
      }

      if (customGame.scoreTeam2 != null) {
        this.team2Score = customGame.scoreTeam2;
      } else {
        this.team2Score = 0;
        this.matchResultsStored = false;
      }

      this.matchResultsAppliedToRatings = customGame.appliedResults;
    });
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

  onStoreResultClick() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    this.customGame.scoreTeam1 = this.team1Score;
    this.customGame.scoreTeam2 = this.team2Score;
    this.customGame.savedResult = true;
    this.matchSvc.saveCustomPrevMatch(this.matchSearchKey, this.customGame);
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
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    let currentMatch = await this.playersSvc.getCurrentRatings().toPromise();
    let ratingSystem = 1;
    if (currentMatch) {
      if (currentMatch.version) {
        ratingSystem = currentMatch.version;
      } else {
        ratingSystem = 1; // German by default for old versions of the app.
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
      this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), this.matchSearchKey);
    } else {
      this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), this.matchSearchKey + '_' + currentMatch.label);
      this.playersSvc.addFieldValueToDocument("label", currentMatch.label, "current");
    }

    // Store the 'new' ratings under the 'current' entry.
    this.playersSvc.savePlayersToList(newPlayers, 'current');

    // Store the new data for the match.
    this.customGame.appliedResults = true;
    this.matchResultsAppliedToRatings = true;
    console.log('saving ', this.customGame);

    this.matchSvc.saveCustomPrevMatch(this.matchSearchKey, this.customGame);
  }

  public canShowStoreResultsButton(): boolean {
    return !this.matchResultsStored && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canShowApplyResultsButton(): boolean {
    return !this.matchResultsAppliedToRatings && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canChangeScore(): boolean {
    return !this.matchResultsStored;
  }
}
