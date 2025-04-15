import { Component, OnInit, OnDestroy, input, signal } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/shared/players.service';
import { MatchService } from 'src/app/shared/match.service';
import { AuthService } from 'src/app/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmallLoadingSpinnerComponent } from 'src/app/ui/small-loading-spinner/small-loading-spinner.component';

@Component({
  imports: [CommonModule, FormsModule, SmallLoadingSpinnerComponent],
  selector: 'app-prev-match-detail',
  standalone: true,
  styleUrls: ['./prev-match-detail.component.css'],
  templateUrl: './prev-match-detail.component.html',
})
export class PrevMatchDetailComponent implements OnInit, OnDestroy {

  public players$ = this.playersSvc.players$;

  team1Sum = signal<number>(0);
  team2Sum = signal<number>(0);


  public showSpinner = true;

  customGame: CustomPrevGame | undefined;
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
    private authSvc: AuthService) { }

  ngOnInit() {
    this.subscriptions.push(this.route.params.subscribe(
      (params: Params) => {
        this.matchSearchKey = params['id'];
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
    this.customGame = undefined;
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
    if (!this.customGame) {
      return '';
    }

    if (!this.customGame.appliedResults) {
      return '';
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
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
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
    if (!this.customGame) {
      return false;
    }

    if (!this.customGame.postResults) {
      return false;
    }
    const pair = this.customGame.postResults.find(x => x.id === player.id);
    //TODO: make dependent on rating system

    if (pair && pair.diff > 0) {
      return true;
    }
    return false;
  }

  isBadRatingDiff(player: Player): boolean {
    if (!this.customGame) {
      return false;
    }

    if (!this.customGame.postResults) {
      return false;
    }
    const pair = this.customGame.postResults.find(x => x.id === player.id);
    //TODO: make dependent on rating system
    if (pair && pair.diff < 0) {
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

    if (!this.customGame) {
      return;
    }

    let currentMatch = await this.playersSvc.getCurrentRatingsAsync();

    const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame
    );

    // Prepare the difference calculation
    const updatedPlayers = this.playersSvc.getPlayersWithUpdatedRatingsForGame(this.customGame, false);
    if (updatedPlayers.length > 0) {
      if (!this.customGame.postResults) {
        this.customGame.postResults = [];
      }
      updatedPlayers.forEach(player => {
        if (!this.customGame) {
          return;
        }

        // get old rating from team 1 or team 2, or fail
        let oldRating = this.customGame.team1.find(x => x.id == player.id)?.rating;
        if (!oldRating) {
          oldRating = this.customGame.team2.find(x => x.id == player.id)?.rating;
        }
        if (!oldRating) {
          return;
        }

        this.customGame.postResults.push({ id: player.id, diff: player.rating - oldRating });
      })
    }

    this.showSpinner = true;

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

    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);

    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  /**
   * New version of the rating update function.
   * This also applies a multiplier to each rating change based on the initial rating difference between the two teams.
   * @returns 
   */
  async onUpdateRatingsV2Click() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }


    let currentMatch = await this.playersSvc.getCurrentRatingsAsync();

    const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame
    );

    // store the team1 sum rating and team2 sum rating
    let team1Sum = 0;
    let team2Sum = 0;
    this.customGame.team1.forEach(player => team1Sum += player.rating);
    this.customGame.team2.forEach(player => team2Sum += player.rating);

    this.team1Sum.set(team1Sum);
    this.team2Sum.set(team2Sum);

    // Prepare the difference calculation
    const updatedPlayers = this.playersSvc.getPlayersWithUpdatedRatingsForGame(this.customGame, true);

    if (updatedPlayers.length > 0) {
      if (!this.customGame.postResults) {
        this.customGame.postResults = [];
      }
      updatedPlayers.forEach(player => {
        if (!this.customGame) {
          return;
        }

        // get old rating from team 1 or team 2, or fail
        let oldRating = this.customGame.team1.find(x => x.id == player.id)?.rating;
        if (!oldRating) {
          oldRating = this.customGame.team2.find(x => x.id == player.id)?.rating;
        }
        if (!oldRating) {
          return;
        }

        this.customGame.postResults.push({ id: player.id, diff: player.rating - oldRating });
      })
    }

    console.log("*** new players", newPlayers);
    this.showSpinner = true;

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

    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);

    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  public async onResetMatchClick() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }

    this.showSpinner = true;
    this.customGame.appliedResults = false;
    this.matchResultsAppliedToRatings = false;
    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  public canShowStoreResultsButton(): boolean {
    return !this.matchResultsStored && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canShowApplyResultsButton(): boolean {
    return !this.matchResultsAppliedToRatings && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canResetResults(): boolean {
    return this.matchResultsAppliedToRatings
      && this.matchResultsStored
      && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canChangeScore(): boolean {
    return !this.matchResultsStored;
  }
}
