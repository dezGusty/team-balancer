import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Player, RecentEntry, RecentEntryType, getDisplayName } from 'src/app/shared/player.model';

@Component({
    imports: [
        CommonModule
    ],
    selector: 'app-player-mini-card',
    standalone: true,
    styles: [''],
    templateUrl: './player-mini-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerMiniCardComponent implements OnInit {
  @Input() player: Player | undefined;
  constructor() { }

  ngOnInit() {
  }

  public playerDisplayName(): string {
    if (!this.player) {
      return '';
    }
    return getDisplayName(this.player);
  }

  public getRecentMatches(): RecentEntry[] {
    if (!this.player) {
      return [];
    }

    return this.player.mostRecentMatches?.slice(0, 8).reverse() || [];
  }

  public getDisplayTextForRating(entry: RecentEntry): string {
    switch (entry.type) {
      case RecentEntryType.ManualEdit: return '✋';
      case RecentEntryType.Ignored:    return '−';
      case RecentEntryType.NotPlayed:  return '✕';
    }
    // Regular match entry — derive from diff
    if (entry.diff > 0) {
      return entry.diff > 0.1 ? '⬆️' : '↗️';
    } else if (entry.diff === 0) {
      return '➡️';
    } else {
      return entry.diff < -0.1 ? '⬇️' : '↘️';
    }
  }

  public getDisplayClassForRating(entry: RecentEntry): string {
    switch (entry.type) {
      case RecentEntryType.ManualEdit: return 'player-card-recent-matches player-card-recent-matches-manual';
      case RecentEntryType.Ignored:    return 'player-card-recent-matches player-card-recent-matches-neutral';
      case RecentEntryType.NotPlayed:  return 'player-card-recent-matches player-card-recent-matches-neutral';
    }
    if (entry.diff > 0) {
      return entry.diff > 0.1
        ? 'player-card-recent-matches player-card-recent-matches-very-good'
        : 'player-card-recent-matches player-card-recent-matches-good';
    } else if (entry.diff === 0) {
      return 'player-card-recent-matches player-card-recent-matches-neutral';
    } else {
      return entry.diff < -0.1
        ? 'player-card-recent-matches player-card-recent-matches-very-bad'
        : 'player-card-recent-matches player-card-recent-matches-bad';
    }
  }

  public getDisplayTooltipForRating(entry: RecentEntry): string {
    const typeLabel = entry.type ? ` [${entry.type}]` : '';
    return '📅' + entry.date + ' 👉   ' + entry.diff.toPrecision(2) + typeLabel;
  }

}
