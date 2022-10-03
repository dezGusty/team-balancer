import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MatchAltService } from 'src/app/shared/match-alt.service';

@Component({
  selector: 'app-recent-matches',
  templateUrl: './recent-matches.component.html',
  styleUrls: ['./recent-matches.component.css']
})
export class RecentMatchesComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  constructor(
    private matchAltSvc: MatchAltService
  ) {

  }

  // public showSpinner = true;
  public selectedIndex = -1;
  private recentMatchNames: string[] = [];
  private recentMatchDescriptions: string[] = [];


  private recentAsyncMatches: Observable<string[]>;


  public getRecentMatchNames(): string[] {
    return this.recentMatchNames;
  }

  public getRecentMatchDescriptions(): string[] {
    return this.recentMatchDescriptions;
  }

  public getCombinedtMatchDescriptions(): { year: string, month: string, day: string }[] {
    let result: { year: string, month: string, day: string }[] = [];
    this.recentMatchDescriptions.forEach(element => {
      const subArray = element.split(' ');
      const monthDesc = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      if (subArray.length > 2) {
        const numMonth: number = Number.parseInt(subArray[1]);
        result.push({ year: subArray[0], month: monthDesc[numMonth - 1], day: subArray[2] });
      }
    });
    return result;
  }

  /**
   * Retrieves the display name / text for a match name.
   * @param matchName The name of the match-name / document id
   */
  public getDisplayTextForMatch(matchName: string): string {
    // THe name of the match should be the date in iso format
    // E.g. 2022-12-01
    let result = matchName;
    result = result.split('-').join(' ');

    return result;
  }

  ngOnInit() {
    console.log('ngOnInit');

    let localMatchList: string[] = [...this.matchAltSvc.getRecentMatchListCached()];
    this.recentMatchNames = localMatchList;
    this.recentMatchDescriptions = this.recentMatchNames.map(x => this.getDisplayTextForMatch(x))

    // TODO:Add to subscriptions list and release
    this.recentAsyncMatches = this.matchAltSvc.getRecentMatchListAsync();
    // TODO: make sure that it's possible to receive event after reentering component
    this.subscription = this.recentAsyncMatches.subscribe((matchNames: string[]) => {
      this.recentMatchNames = [...matchNames];;
      this.recentMatchDescriptions = this.recentMatchNames.map(x => this.getDisplayTextForMatch(x))

      this.selectedIndex = -1;

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
    console.log('match entry clicked, this.selectedIndex', this.selectedIndex);
  }

}
