import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MatchService } from 'src/app/shared/match.service';
import { CustomGame } from 'src/app/shared/custom-game.model';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-recent-matches',
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  constructor(
    private matchSvc: MatchService
  ) {

  }

  // public showSpinner = true;
  public selectedIndex = -1;
  private recentMatchNames: string[] = [];

  private recentAsyncMatches: Observable<string[]>;


  public getRecentMatchNames(): string[] {
    return this.recentMatchNames;
  }

  ngOnInit() {
    console.log('ngOnInit');
    // this.showSpinner = true;
    this.recentMatchNames = [...this.matchSvc.getRecentMatchListCached()];
    console.log('matches:', this.recentMatchNames);

    // TODO:Add to subscriptions list and release
    this.recentAsyncMatches = this.matchSvc.getRecentMatchListAsync();
    // TODO: make sure that it's possible to receive event after reentering component
    this.subscription = this.recentAsyncMatches.subscribe((matchNames: string[]) => {

      this.recentMatchNames = [...matchNames];
      this.selectedIndex = -1;
      // this.showSpinner = false;

      // TODO: show current selection.
    });
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy');
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
  }

  getSelectedMatch(index: number) {
    return this.recentMatchNames[index];
  }
  onMatchEntryClicked($event) {
    this.selectedIndex = +$event;
  }

}
