import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from './data-access/match-hist.service';
import { MatchHistoryTitle } from './match-history.title';
import { RouterModule } from '@angular/router';
import { tap } from 'rxjs';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";

@Component({
    selector: 'app-history',
    standalone: true,
    template: `
<div class="history-grid">
  <div class="history-grid-left">
    @if (this.isFetchingData) {
      <app-small-loading-spinner></app-small-loading-spinner>
    }
    <div>new (WIP!) history</div>
    <ul>
      @for (matchData of this.recentMatchNames$ | async; track $index) {
        <li (click)="onMatchEntryClicked(matchData)"
        [class.match-card-active]="matchData.title === this.selectedMatchName"
        class="gus-border match-card player-card-grad date-as-calendar vert-calendar gus-hoverable">
        <span class="year">{{matchData.year}}</span>
        <span class="month">{{matchData.month}}</span>
        <span class="day">{{matchData.day}}</span>
      </li>
    } @empty {
      <li>No recent matches.</li>
    }
    </ul>
  </div>
  <div class="history-grid-right">
    <router-outlet />
  </div>
</div>
`,
    styles: [`ul { margin: 0em; padding: 0em; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        RouterModule,
        SmallLoadingSpinnerComponent
    ]
})
export class HistoryComponent {

  public recentMatchNames$ = this.matchSvc.recentMatches$.pipe(
    tap((recentMatches) => { this.isFetchingData = false; })
  );
  public isFetchingData: boolean = true;



  public selectedMatchName: string | undefined;
  // public selectedMatchDetails$;
  // public matchesSignal = toSignal(this.matchSvc.recentMatches$);

  constructor(
    private matchSvc: MatchHistService
  ) {
    console.log('history component constructor');
  }


  onMatchEntryClicked(item: MatchHistoryTitle) {
    this.selectedMatchName = item.title;
    this.matchSvc.selectedMatchSubject.next(item.title);
    console.log('match entry clicked', item);
    // console.log('match entry clicked', +$event);
  }

}
