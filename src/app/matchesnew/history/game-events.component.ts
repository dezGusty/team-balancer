import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, ModelSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchDateTitle, toDate } from './match-date-title';
import { RouterModule } from '@angular/router';
import { SmallLoadingSpinnerComponent } from "../../ui/small-loading-spinner/small-loading-spinner.component";
import { MatchDetailsComponent } from '../details/details.component';
import { FormAction, Action } from '../form-edit-wrapper';
import { CreateGameRequest as CreateGameRequest, getEventNameForDateAndSuffix } from './data-access/create-game-request.model';
import { FormsModule } from '@angular/forms';
import { GameEventsService } from './data-access/game-events.service';
import { GameeventdraftComponent } from "../gameeventdraft/gameeventdraft.component";
import { SummaryComponent } from "../summary/summary.component";
import { SettingsService } from 'src/app/shared/settings.service';

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './game-events.component.html',
  styleUrl: 'game-events.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    GameeventdraftComponent,
    SummaryComponent
  ]
})
export class GameEventsComponent {
  EMPTY: string = FormAction.EMPTY;

  private gameEventsService: GameEventsService = inject(GameEventsService);
  private settingsService: SettingsService = inject(SettingsService);

  addEvent = signal<Action<CreateGameRequest>>({} as Action<CreateGameRequest>);

  gameEventTitlesSig = this.gameEventsService.recentGameTitlesSig;
  activeGameEventTitlesSig = computed(() => this.gameEventTitlesSig().filter((matchDateTitle) => this.isDateActive(matchDateTitle)));

  public selectedMatch = this.gameEventsService.selectedMatchSig;

  public selectedMatchContent = this.gameEventsService.selectedMatchContent;

  onAddGameClicked() {
    this.addEvent.set({ action: FormAction.Add } as Action<CreateGameRequest>);
  }

  onViewSummaryClicked() {
    this.isSideNavOpen = true;
  }

  onMatchEntryClicked(item: MatchDateTitle) {
    // If the edit form is open, close it.
    this.addEvent.set({ action: FormAction.EMPTY } as Action<CreateGameRequest>);
    this.gameEventsService.selectedMatchSubject$.next(item);
  }

  saveMatch(item: Action<CreateGameRequest>) {
    this.gameEventsService.createGameEvent(item);
    this.addEvent.set({ action: FormAction.EMPTY } as Action<CreateGameRequest>);
  }

  cancelEdit() {
    this.addEvent.set({ action: FormAction.EMPTY } as Action<CreateGameRequest>);
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

  private parseYYYYMMDD(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  selectNextGameDay() {
    const evt: Action<CreateGameRequest> = this.addEvent();
    const hasCurrentDate = Boolean(evt.matchDate);
    const startFrom = hasCurrentDate ? this.parseYYYYMMDD(evt.matchDate) : new Date();
    const schedule = this.settingsService.defaultMatchScheduleSig();
    const existingGames = this.gameEventTitlesSig();

    if (schedule.length === 0) {
      // Fallback: use hardcoded Tuesday/Thursday when no schedule is configured
      const fallbackStart = hasCurrentDate ? this.getFollowingDay(startFrom) : startFrom;
      let candidate = this.getNextTuesdayOrThursday(fallbackStart);
      for (let i = 0; i < 104; i++) {
        const dateStr = this.getDateAsYYYYMMDD(candidate);
        const hasGameOnDate = existingGames.some(
          g => `${g.year}-${g.month}-${g.day}` === dateStr
        );
        if (!hasGameOnDate) {
          this.addEvent.set({ ...evt, matchDate: dateStr });
          return;
        }
        candidate = this.getNextTuesdayOrThursday(this.getFollowingDay(candidate));
      }
      return;
    }

    const existingTitles = new Set(existingGames.map(g => g.title));
    const maxScanDays = 365;

    // Scan forward to find the nearest scheduled date/time combo without an existing game
    for (let daysAhead = 0; daysAhead <= maxScanDays; daysAhead++) {
      if (daysAhead === 0 && hasCurrentDate && !evt.suffix) {
        continue;
      }

      const candidate = new Date(startFrom);
      candidate.setDate(startFrom.getDate() + daysAhead);
      const dateStr = this.getDateAsYYYYMMDD(candidate);

      const dayMatches = schedule
        .filter(e => e.dayOfWeek === candidate.getDay())
        .sort((a, b) => a.time.localeCompare(b.time));

      for (const match of dayMatches) {
        if (daysAhead === 0 && hasCurrentDate && evt.suffix && match.time <= evt.suffix) {
          continue;
        }
        const candidateName = getEventNameForDateAndSuffix(dateStr, match.time);
        if (!existingTitles.has(candidateName)) {
          this.addEvent.set({ ...evt, matchDate: dateStr, suffix: match.time });
          return;
        }
      }
    }
  }

  onCalendarDateSelected(dateAsString: string) {
    const evt: Action<CreateGameRequest> = this.addEvent();
    const nextEvent: Action<CreateGameRequest> = { ...evt, matchDate: dateAsString };
    this.addEvent.set(nextEvent);
  }

  protected isSideNavOpen = false;
  onSideNavOuterContainerClicked() {
    this.isSideNavOpen = false;
  }
  onCloseSummaryClicked() {
    this.isSideNavOpen = false;
  }

  getPreviewName(date: string, suffix: string): string | undefined {
    return getEventNameForDateAndSuffix(date, suffix);
  }

  protected isDateActive(match: MatchDateTitle): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchDate = toDate(match);
    return matchDate > today;
  }

}
