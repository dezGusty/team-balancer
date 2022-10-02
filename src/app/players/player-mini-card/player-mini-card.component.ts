import { Component, OnInit, Input } from '@angular/core';
import { Player, getDisplayName } from 'src/app/shared/player.model';

@Component({
  selector: 'app-player-mini-card',
  templateUrl: './player-mini-card.component.html',
  styles: ['']
})
export class PlayerMiniCardComponent implements OnInit {
  @Input() player: Player;
  constructor() { }

  ngOnInit() {
  }

  public playerDisplayName(): string {
    return getDisplayName(this.player);
  }

  public getRecentMatches(): Array<{ date: string, diff: number }> {
    return this.player?.mostRecentMatches?.slice(0, 8);
  }

  public getDisplayTextForRating(rating: { date: string, diff: number }): string {
    if (rating.diff > 0) {
      if (rating.diff > 0.1) {
        return '⬆️';
      }
      return '↗️';
    } else if (rating.diff === 0) {
      return '➡️';
    } else {
      if (rating.diff < -0.1) {
        return '⬇️';
      }
      return '↘️';
    }
  }

  public getDisplayClassForRating(rating: { date: string, diff: number }): string {
    if (rating.diff > 0) {
      if (rating.diff > 0.1) {
        return 'player-card-recent-matches-very-good';
      }
      return 'player-card-recent-matches-good';
    } else if (rating.diff === 0) {
      return 'player-card-recent-matches-neutral';
    } else {
      if (rating.diff < -0.1) {
        return 'player-card-recent-matches-very-bad';
      }
      return 'player-card-recent-matches-bad';
    }
  }

  public getDisplayTooltipForRating(rating: { date: string, diff: number }): string {
    return '📅' + rating.date + ' 👉   ' + rating.diff.toPrecision(2);
  }

}
