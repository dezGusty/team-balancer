import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatchHistService } from './data-access/match-hist.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
<div>new (WIP!) history</div>
<button (click)="onRefreshClicked()">Refresh</button>
<ul>
    @for (matchData of this.recentMatches$ | async; track $index) {
    <li (click)="onMatchEntryClicked($index)"
      class="border match-card player-card-grad date-as-calendar vert-calendar gus-hoverable">
      {{matchData}}
    </li>
    } @empty {
      <li>No recent matches.</li>
    }
  </ul>
<br>---signal---<br>
<ul>
    @for (matchData of this.matchesSignal(); track $index) {
    <li (click)="onMatchEntryClicked($index)"
      class="border match-card player-card-grad date-as-calendar vert-calendar gus-hoverable">
      {{matchData}}
    </li>
    } @empty {
      <li>No recent matches.</li>
    }
  </ul>`,
  styles: ['']
})
export class HistoryComponent {

  public matchesSignal = signal<string[]>([]);
  public recentMatches$ = this.matchSvc.recentMatches$;
  // public matchesSignal = toSignal(this.matchSvc.recentMatches$);

  constructor(
    private matchSvc: MatchHistService
  ) {
    console.log('history component constructor');
  }


  onMatchEntryClicked($event: any) {
    console.log('match entry clicked', +$event);
  }

  onRefreshClicked() {
    console.log('refresh');
    this.matchSvc.recentMatches$.subscribe(
      (matchList) => {
        console.log('*** recentMatches$', matchList);
      }
    );
  }

}
