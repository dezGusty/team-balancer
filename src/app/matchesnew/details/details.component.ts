import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from '../history/data-access/match-hist.service';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { CustomPrevGame } from 'src/app/shared/custom-prev-game.model';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    SmallLoadingSpinnerComponent
  ],
  templateUrl: './details.component.html', 
  styles: ['']
})
export class MatchDetailsComponent {

  public selectedMatchDetails$ = this.matchSvc.selectedMatchDetails$;

  constructor(
    private matchSvc: MatchHistService
  ) {
    console.log('history component constructor');
  }

  isFetchingDetails() {
    return this.matchSvc.isFetchingDetails();
  }

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
}
