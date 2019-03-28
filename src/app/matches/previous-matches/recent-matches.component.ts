import { Component, OnInit, AfterViewInit } from '@angular/core';
import { MatchService } from 'src/app/shared/match.service';
import { CustomGame } from 'src/app/shared/custom-game.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recent-matches',
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent implements OnInit, AfterViewInit {

  constructor(
    private matchSvc: MatchService
  ) {

  }

  public showSpinner = true;
  public selectedIndex = 0;
  private recentMatchNames: string[] = [];
  private recentMatches: CustomGame[] = [];

  private recentAsyncMatches: Observable<string[]>;

  public getRecentMatches(): CustomGame[] {
    return this.recentMatches;
  }

  public getRecentMatchNames(): string[] {
    return this.recentMatchNames;
  }

  ngOnInit() {
    this.recentAsyncMatches = this.matchSvc.getRecentMatchListAsync();

    // TODO:Add to subscriptions list and release
    this.recentAsyncMatches.subscribe((matchNames: string[]) => {
      this.recentMatchNames = matchNames;
      this.showSpinner = false;
    });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    // TODO: make sure that it's possible to receive event after reentering component
  }

  getSelectedMatch(index: number) {
    return this.recentMatchNames[index];
  }
  onMatchEntryClicked($event) {
    this.selectedIndex = +$event;
  }

}
