import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AppSettings, MatchDaySchedule, SettingsService } from '../shared/settings.service';
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
  isSaving = signal<boolean>(false);
  savedSuccess = signal<boolean>(false);

  constructor() {
    effect(() => {
      const s = this.settingsSvc.settingsSig();
      this.autoSave.set(s.autoSave ?? true);
      this.showPlayerStatusIcons.set(s.showPlayerStatusIcons ?? true);
      this.randomizePlayerOrder.set(s.randomizePlayerOrder ?? false);
      this.schedule.set((s.defaultMatchSchedule ?? []).map(e => ({ ...e })));
    }, { allowSignalWrites: true });
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
    this.isSaving.set(true);
    this.savedSuccess.set(false);
    const settings: AppSettings = {
      autoSave: this.autoSave(),
      showPlayerStatusIcons: this.showPlayerStatusIcons(),
      randomizePlayerOrder: this.randomizePlayerOrder(),
      defaultMatchSchedule: this.schedule(),
    };
    await this.settingsSvc.saveSettings(settings);
    this.isSaving.set(false);
    this.savedSuccess.set(true);
    this.notifSvc.show('Settings saved successfully.');
    setTimeout(() => this.savedSuccess.set(false), 3000);
  }
}

