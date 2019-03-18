import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { MatchService } from 'src/app/shared/match.service';
import { CustomGame } from 'src/app/shared/custom-game.model';

@Component({
  selector: 'app-recent-matches',
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent implements OnInit {

  constructor(
    private matchSvc: MatchService
  ) {

  }

  private selectedMatch = '';
  private recentMatchNames: string[] = [];
  private recentMatches: CustomGame[] = [];

  public getRecentMatches(): CustomGame[] {
    return this.recentMatches;
  }

  public getRecentMatchNames(): string[] {
    this.recentMatchNames = this.matchSvc.getRecentMatchList();
    return this.recentMatchNames;
  }

  ngOnInit() {
    this.selectedMatch = '';
  }

  getSelectedMatch(index: number) {
    return this.recentMatchNames[index];
  }
  onMatchEntryClicked($event) {
    console.log('match clicked: ', $event);
    const clickedIndex = +$event;
    this.selectedMatch = this.recentMatchNames[clickedIndex];
  }

}
