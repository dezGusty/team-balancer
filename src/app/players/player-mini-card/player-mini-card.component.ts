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
    return this.player.mostRecentMatches;
  }

  public getDisplayTextForRating(rating: { date: string, diff: number }): string {
    if (rating.diff > 0) {
      return '↗️';
    } else if (rating.diff === 0) {
      return '➡️';
    } else {
      return '↘️'
    }
  }

  public getDisplayTooltipForRating(rating: { date: string, diff: number }): string {
    return '📅' + rating.date + ' 👉   ' + rating.diff.toPrecision(2);
  }

}
