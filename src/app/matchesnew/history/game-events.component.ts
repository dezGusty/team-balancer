import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from './data-access/match-hist.service';
import { MatchDateTitle } from './match-history.title';
import { RouterModule } from '@angular/router';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { BehaviorSubject, map, tap } from 'rxjs';
import { MatchDetailsComponent } from '../details/details.component';
import { FormAction, FormActionWrapper } from '../form-edit-wrapper';
import { CreateGameEventRequest, getEventNameForDateAndSuffix } from './data-access/create-game-event-request.model';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { GameEventsService } from './data-access/game-events.service';
import { MatchService } from 'src/app/shared/match.service';

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './game-events.component.html',
  styles: [`ul { margin: 0em; padding: 0em; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatchDetailsComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    SmallLoadingSpinnerComponent
  ]
})
export class GameEventsComponent {
  EMPTY: string = FormAction.EMPTY;

  // observables listening to [create match] events, bringing the add/edit form into view via the sub-component.
  formEditSubject$ = new BehaviorSubject<FormActionWrapper<CreateGameEventRequest>>({} as FormActionWrapper<CreateGameEventRequest>);
  formEdit$ = this.formEditSubject$.asObservable().pipe(
    tap((data) => { console.log("***", data); })
  );


  public matchNames$ = this.matchHistService.matches$.pipe(
    map((recentMatches) => {
      console.log('recent matches', recentMatches);
      return recentMatches.map((match) => this.getMonthDescForMatch(match));
    })
  );

  // matchNames = toSignal(this.matchNames$);

  getMonthDescForMatch(match: MatchDateTitle): MatchDateTitle {
    const monthsDesc = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const numMonth: number = Number.parseInt(match.month);
    const monthDesc = numMonth < 0 ? "" : numMonth > 12 ? "" : monthsDesc[numMonth - 1];
    return {
      ...match,
      month: monthDesc
    } as MatchDateTitle;
  }

  public selectedMatch$ = this.matchHistService.selectedMatch$;

  constructor(private gameEventsService: GameEventsService, private matchHistService: MatchHistService) { }

  onAddGameClicked() {
    this.formEditSubject$.next({ action: FormAction.Add } as FormActionWrapper<CreateGameEventRequest>);
  }

  onMatchEntryClicked(item: MatchDateTitle) {
    this.matchHistService.selectedMatchSubject.next(item.title);
  }

  saveMatch(item: FormActionWrapper<CreateGameEventRequest>) {
    this.gameEventsService.createGameEvent(item);
  }

  cancelEdit() {
    this.formEditSubject$.next({ action: FormAction.EMPTY } as FormActionWrapper<CreateGameEventRequest>);
  }

  getFollowingDay(startFrom: Date): Date {
    const nextDay = new Date(startFrom);
    nextDay.setDate(startFrom.getDate() + 1);
    return nextDay;
  }

  getNextTuesdayOrThursday(startFrom: Date): Date {
    const dayOfWeek = startFrom.getDay();
    let daysUntilNextTuesday = 2 - dayOfWeek;
    let daysUntilNextThursday = 4 - dayOfWeek;
    if (daysUntilNextTuesday < 0) {
      daysUntilNextTuesday += 7;
    }
    if (daysUntilNextThursday < 0) {
      daysUntilNextThursday += 7;
    }

    const nextTuesday = new Date(startFrom);
    nextTuesday.setDate(startFrom.getDate() + daysUntilNextTuesday);
    const nextThursday = new Date(startFrom);
    nextThursday.setDate(startFrom.getDate() + daysUntilNextThursday);
    const nextDate = daysUntilNextTuesday < daysUntilNextThursday ? nextTuesday : nextThursday;
    return nextDate;
  }

  getDateAsYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  }

  getDateAsCalendarString(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  }

  selectNextTuesdayOrThursday() {
    const startFrom = this.formEditSubject$.value.matchDate ? this.getFollowingDay(new Date(this.formEditSubject$.value.matchDate)) : new Date();
    const nextDate = this.getNextTuesdayOrThursday(startFrom);
    const nextEvent: FormActionWrapper<CreateGameEventRequest> = { ...this.formEditSubject$.value, matchDate: this.getDateAsYYYYMMDD(nextDate) };
    this.formEditSubject$.next(nextEvent);
  }

  onCalendarDateSelected(dateAsString: string) {
    const nextEvent: FormActionWrapper<CreateGameEventRequest> = { ...this.formEditSubject$.value, matchDate: dateAsString };
    this.formEditSubject$.next(nextEvent);
  }

  getPreviewName(date: string, suffix: string): string | undefined {
    return getEventNameForDateAndSuffix(date, suffix);
  }
}
