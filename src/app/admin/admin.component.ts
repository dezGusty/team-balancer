import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  AppSettings,
  DEFAULT_RECENT_MATCHES_TO_STORE,
  MAX_RECENT_MATCHES_TO_STORE,
  MIN_RECENT_MATCHES_TO_STORE,
  MatchDaySchedule,
  SettingsService
} from '../shared/settings.service';
import { NotificationService } from '../utils/notification/notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class AdminComponent {
  private readonly settingsSvc = inject(SettingsService);
  private readonly notifSvc = inject(NotificationService);

  readonly DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  autoSave = signal<boolean>(true);
  showPlayerStatusIcons = signal<boolean>(true);
  randomizePlayerOrder = signal<boolean>(false);
  schedule = signal<MatchDaySchedule[]>([]);
  recentMatchesToStore = signal<number | null>(DEFAULT_RECENT_MATCHES_TO_STORE);
  isSaving = signal<boolean>(false);
  savedSuccess = signal<boolean>(false);

  readonly recentMatchesRangeText = `${MIN_RECENT_MATCHES_TO_STORE} to ${MAX_RECENT_MATCHES_TO_STORE}`;
  readonly recentMatchesValidationMessage = computed(() => {
    const value = this.recentMatchesToStore();
    if (value == null || Number.isNaN(value)) {
      return 'Recent matches to store must be a number.';
    }
    if (!Number.isInteger(value)) {
      return 'Recent matches to store must be a whole number.';
    }
    if (value < MIN_RECENT_MATCHES_TO_STORE || value > MAX_RECENT_MATCHES_TO_STORE) {
      return `Recent matches to store must be between ${MIN_RECENT_MATCHES_TO_STORE} and ${MAX_RECENT_MATCHES_TO_STORE}.`;
    }
    return '';
  });

  constructor() {
    effect(() => {
      const s = this.settingsSvc.settingsSig();
      this.autoSave.set(s.autoSave ?? true);
      this.showPlayerStatusIcons.set(s.showPlayerStatusIcons ?? true);
      this.randomizePlayerOrder.set(s.randomizePlayerOrder ?? false);
      this.schedule.set((s.defaultMatchSchedule ?? []).map(e => ({ ...e })));
      this.recentMatchesToStore.set(s.recentMatchesToStore ?? DEFAULT_RECENT_MATCHES_TO_STORE);
    }, { allowSignalWrites: true });
  }

  updateRecentMatchesToStore(value: number | string | null): void {
    if (value === '' || value == null) {
      this.recentMatchesToStore.set(null);
      return;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);
    this.recentMatchesToStore.set(Number.isNaN(parsedValue) ? null : parsedValue);
  }

  addScheduleEntry(): void {
    this.schedule.update(entries => [...entries, { dayOfWeek: 2, time: '20:00' }]);
  }

  removeScheduleEntry(index: number): void {
    this.schedule.update(entries => entries.filter((_, i) => i !== index));
  }

  updateEntryDay(index: number, value: string): void {
    this.schedule.update(entries =>
      entries.map((e, i) => i === index ? { ...e, dayOfWeek: +value } : e)
    );
  }

  updateEntryTime(index: number, value: string): void {
    this.schedule.update(entries =>
      entries.map((e, i) => i === index ? { ...e, time: value } : e)
    );
  }

  async saveSettings(): Promise<void> {
    const validationMessage = this.recentMatchesValidationMessage();
    if (validationMessage) {
      this.notifSvc.show(validationMessage);
      return;
    }

    this.isSaving.set(true);
    this.savedSuccess.set(false);
    const settings: AppSettings = {
      autoSave: this.autoSave(),
      showPlayerStatusIcons: this.showPlayerStatusIcons(),
      randomizePlayerOrder: this.randomizePlayerOrder(),
      defaultMatchSchedule: this.schedule(),
      recentMatchesToStore: this.recentMatchesToStore() ?? DEFAULT_RECENT_MATCHES_TO_STORE,
    };
    await this.settingsSvc.saveSettings(settings);
    this.isSaving.set(false);
    this.savedSuccess.set(true);
    this.notifSvc.show('Settings saved successfully.');
    setTimeout(() => this.savedSuccess.set(false), 3000);
  }
}

