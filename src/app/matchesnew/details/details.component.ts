import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from '../history/data-access/match-hist.service';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';
import { AuthService } from 'src/app/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { tap } from 'rxjs';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SmallLoadingSpinnerComponent
  ],
  templateUrl: './details.component.html',
  styles: [''],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailsComponent {

  public selectedMatchDetails$ = this.matchSvc.selectedMatchDetails$.pipe(
    tap(match => {
      this.team1Score = match.scoreTeam1;
      this.team2Score = match.scoreTeam2;
    })
  );

  constructor(
    private matchSvc: MatchHistService,
    private authSvc: AuthService,
  ) {
    console.log('history component constructor');
  }

  team1Score: number = 0;
  team2Score: number = 0;

  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  getInitialRatingForPlayer(player: Player): string {
    return player.rating.toFixed(3);
  }

  getPostMatchDiffForPlayer(game: CustomPrevGame, player: Player): string {
    if (!game) {
      return '';
    }

    if (!game.appliedResults) {
      return '';
    }

    const foundObj = game.postResults?.find(x => x.id === player.id);
    if (foundObj) {
      return foundObj.diff.toFixed(3);
    }

    return "~ 0.0";
  }

  isGoodRatingDiff(game: CustomPrevGame, player: Player): boolean {
    if (!game) {
      return false;
    }

    if (!game.postResults) {
      return false;
    }
    const pair = game.postResults.find(x => x.id === player.id);

    if (pair && pair.diff > 0) {
      return true;
    }
    return false;
  }

  isBadRatingDiff(game: CustomPrevGame, player: Player): boolean {
    if (!game) {
      return false;
    }

    if (!game.postResults) {
      return false;
    }
    const pair = game.postResults.find(x => x.id === player.id);
    if (pair && pair.diff < 0) {
      return true;
    }
    return false;
  }

  public canShowStoreResultsButton(game: CustomPrevGame): boolean {
    return !game.savedResult && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canShowApplyResultsButton(game: CustomPrevGame): boolean {
    return !game.appliedResults && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canChangeScore(game: CustomPrevGame): boolean {
    return !game.savedResult;
  }

  async onStoreResultClick(game: CustomPrevGame) {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    // await this.matchSvc.updateCustomPrevMatchAsync(this.matchSvc.selectedMatch$, game);

    // show animation
    // this.showSpinner = true;

    // this.customGame.scoreTeam1 = this.team1Score;
    // this.customGame.scoreTeam2 = this.team2Score;
    // this.customGame.savedResult = true;
    // await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    // this.matchResultsStored = this.customGame.savedResult;
    // this.showSpinner = false;
  }

  /**
   * Updates the ratings of the user for the loaded match.
   * The old player ratings are stored to an old entry. E.g.
   *    'ratings/2018-04-02'
   * The current player ratings are stored in the standard entry. E.g.
   *    'ratings/current'
   */
  async onUpdateRatingsClick(game: CustomPrevGame) {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    //  let currentMatch = await this.playersSvc.getCurrentRatingsAsync();

    //   const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
    //     this.playersSvc.getPlayers(), this.customGame
    //   );

    //   // Prepare the difference calculation
    //   const updatedPlayers = this.playersSvc.getPlayersWithUpdatedRatingsForGame(this.customGame);
    //   if (updatedPlayers.length > 0) {
    //     if (!this.customGame.postResults) {
    //       this.customGame.postResults = [];
    //     }
    //     updatedPlayers.forEach(player => {
    //       if (!this.customGame) {
    //         return;
    //       }

    //       // get old rating from team 1 or team 2, or fail
    //       let oldRating = this.customGame.team1.find(x => x.id == player.id)?.rating;
    //       if (!oldRating) {
    //         oldRating = this.customGame.team2.find(x => x.id == player.id)?.rating;
    //       }
    //       if (!oldRating) {
    //         return;
    //       }

    //       this.customGame.postResults.push({ id: player.id, diff: player.rating - oldRating });
    //     })
    //   }

    //   this.showSpinner = true;

    //   // Store the 'old' ratings under a different entry.
    //   if (!currentMatch || !currentMatch.label) {
    //     await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey);
    //   } else {
    //     await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey + '_' + currentMatch.label);
    //     await this.playersSvc.addFieldValueToDocumentAsync("label", currentMatch.label, "current");
    //   }

    //   // Store the 'new' ratings under the 'current' entry.
    //   await this.playersSvc.savePlayersToListAsync(newPlayers, 'current');


    //   // Store the new data for the match.
    //   this.customGame.appliedResults = true;
    //   this.matchResultsAppliedToRatings = true;
    //   console.log('saving ', this.customGame);

    //   await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);

    //   await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    //   this.showSpinner = false;
  }
}
