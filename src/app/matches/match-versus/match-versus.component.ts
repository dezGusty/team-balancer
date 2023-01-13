import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player, getDisplayName } from 'src/app/shared/player.model';

@Component({
  imports: [CommonModule],
  selector: 'app-match-versus',
  standalone: true,
  styles: [''],
  templateUrl: './match-versus.component.html',
})
export class MatchVersusComponent implements OnInit {

  @Input() contentsIndex: number = 0;
  @Input() playerList: Player[] = [];

  // one to one mapping for the same index with the displayedMatchCombos array
  @Input() displayedMatchDetails = new Array<{
    team1: Array<Player>,
    team2: Array<Player>
  }>();

  extractedTeam1: Array<Player> = [];
  extractedTeam2: Array<Player> = [];

  constructor() {
  }

  ngOnInit() {
    if (this.displayedMatchDetails[this.contentsIndex]) {
      this.extractedTeam1 = this.displayedMatchDetails[this.contentsIndex].team1;
    }
    if (this.displayedMatchDetails[this.contentsIndex]) {
      this.extractedTeam2 = this.displayedMatchDetails[this.contentsIndex].team2;
    }
  }

  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }
}
