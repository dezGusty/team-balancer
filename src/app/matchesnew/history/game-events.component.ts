import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchHistService } from './data-access/match-hist.service';
import { MatchDateTitle } from './match-history.title';
import { RouterModule } from '@angular/router';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { BehaviorSubject, map, tap } from 'rxjs';
import { MatchDetailsComponent } from '../details/details.component';
import { FormAction, Action } from '../form-edit-wrapper';
import { CreateGameEventRequest, getEventNameForDateAndSuffix } from './data-access/create-game-event-request.model';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { GameEventsService } from './data-access/game-events.service';
import { MatchService } from 'src/app/shared/match.service';
import { toSignal } from '@angular/core/rxjs-interop';

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

  addEvent = signal<Action<CreateGameEventRequest>>({} as Action<CreateGameEventRequest>);

  // observables listening to [create match] events, bringing the add/edit form into view via the sub-component.
  // formEditSubject$ = new BehaviorSubject<Action<CreateGameEventRequest>>({} as Action<CreateGameEventRequest>);
  // formEdit$ = this.formEditSubject$.asObservable().pipe(
  //   tap((data) => { console.log("***", data); })
  // );

  private matchNames$ = this.matchHistService.matches$.pipe(
    map((recentMatches) => {
      console.log('recent matches', recentMatches);
      return recentMatches.map((match) => this.getMonthDescForMatch(match));
    })
  );

  matchNames = toSignal(this.matchNames$);

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
    // this.formEditSubject$.next({ action: FormAction.Add } as Action<CreateGameEventRequest>);
    this.addEvent.set({ action: FormAction.Add } as Action<CreateGameEventRequest>);
  }

  onMatchEntryClicked(item: MatchDateTitle) {
    console.log('selected match', item);
    this.matchHistService.selectedMatchSubject.next(item.title);
  }

  saveMatch(item: Action<CreateGameEventRequest>) {
    this.gameEventsService.createGameEvent(item);
  }

  cancelEdit() {
    // this.formEditSubject$.next({ action: FormAction.EMPTY } as Action<CreateGameEventRequest>);
    this.addEvent.set({ action: FormAction.EMPTY } as Action<CreateGameEventRequest>);
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
    let textMonth = month < 10 ? `0${month}` : `${month}`;
    let textDay = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${textMonth}-${textDay}`;
  }

  // getDateAsCalendarString(date: Date): string {
  //   const year = date.getFullYear();
  //   const month = date.getMonth() + 1;
  //   const day = date.getDate();
  //   let textMonth = month < 10 ? `0${month}` : `${month}`;
  //   let textDay = day < 10 ? `0${day}` : `${day}`;
  //   return `${year}/${textMonth}/${textDay}`;
  // }

  selectNextTuesdayOrThursday() {
    // const startFrom = this.formEditSubject$.value.matchDate ? this.getFollowingDay(new Date(this.formEditSubject$.value.matchDate)) : new Date();
    // const nextDate = this.getNextTuesdayOrThursday(startFrom);
    // const nextEvent: Action<CreateGameEventRequest> = { ...this.formEditSubject$.value, matchDate: this.getDateAsYYYYMMDD(nextDate) };
    // this.formEditSubject$.next(nextEvent);

    const evt: Action<CreateGameEventRequest> = this.addEvent();
    const startFrom = evt.matchDate ? this.getFollowingDay(new Date(evt.matchDate)) : new Date();
    const nextDate = this.getNextTuesdayOrThursday(startFrom);
    const nextEvent: Action<CreateGameEventRequest> = { ...evt, matchDate: this.getDateAsYYYYMMDD(nextDate) };
    this.addEvent.set(nextEvent);

  }

  onCalendarDateSelected(dateAsString: string) {
    // const nextEvent: Action<CreateGameEventRequest> = { ...this.formEditSubject$.value, matchDate: dateAsString };
    // this.formEditSubject$.next(nextEvent);
    const evt: Action<CreateGameEventRequest> = this.addEvent();
    const nextEvent: Action<CreateGameEventRequest> = { ...evt, matchDate: dateAsString };
    this.addEvent.set(nextEvent);
  }

  getPreviewName(date: string, suffix: string): string | undefined {
    return getEventNameForDateAndSuffix(date, suffix);
  }
}
