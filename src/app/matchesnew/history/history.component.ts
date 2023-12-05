import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from './data-access/match-hist.service';
import { MatchHistoryTitle } from './match-history.title';
import { RouterModule } from '@angular/router';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { map } from 'rxjs';
import { MatchDetailsComponent } from '../details/details.component';

@Component({
  selector: 'app-history',
  standalone: true,
  template: `
<div class="history-area">
  <div class="history-left-outline">
    <ul>
      @for (matchData of this.recentMatchNames$ | async; track $index) {
        <li (click)="onMatchEntryClicked(matchData)"
        class="gus-border match-card player-card-grad date-as-calendar vert-calendar gus-hoverable"
        [class.match-card-active]="matchData?.title === (this.selectedMatch$ | async)?.title"
        [routerLink]="matchData?.title"
        >
        <span class="year">{{matchData.year}}</span>
        <span class="month">{{matchData.month}}</span>
        <span class="day">{{matchData.day}}</span>
      </li>
    } @empty {
      <li>No recent matches.</li>
    }
    </ul>
  </div>
  <app-details />
</div>
`,
  styles: [`ul { margin: 0em; padding: 0em; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatchDetailsComponent,
    CommonModule,
    RouterModule,
    SmallLoadingSpinnerComponent
  ]
})
export class HistoryComponent {

  public recentMatchNames$ = this.matchSvc.recentMatches$.pipe(
    map((recentMatches) => {
      console.log('recent matches', recentMatches);
      return recentMatches.map((match) => {
        const monthsDesc = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const numMonth: number = Number.parseInt(match.month);
        const monthDesc = numMonth < 0 ? "" : numMonth > 12 ? "" : monthsDesc[numMonth - 1];

        return {
          ...match,
          month: monthDesc
        } as MatchHistoryTitle;
      });
    })
  );

  public selectedMatch$ = this.matchSvc.selectedMatch$;

  constructor(
    private matchSvc: MatchHistService
  ) {
    console.log('history component constructor');
  }

  onMatchEntryClicked(item: MatchHistoryTitle) {
    this.matchSvc.selectedMatchSubject.next(item.title);
    console.log('match entry clicked', item);
  }
}
