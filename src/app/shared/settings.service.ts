import { Injectable, inject, computed } from '@angular/core';
import { Firestore, docData, setDoc } from '@angular/fire/firestore';
import { doc } from 'firebase/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

export interface MatchDaySchedule {
  dayOfWeek: number;  // 0=Sunday … 6=Saturday
  time: string;       // "HH:MM" (24-hour)
}

export interface AppSettings {
  autoSave: boolean;
  defaultMatchSchedule: MatchDaySchedule[];
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSave: true,
  defaultMatchSchedule: [
    { dayOfWeek: 2, time: '20:00' },  // Tuesday
    { dayOfWeek: 4, time: '20:00' },  // Thursday
  ],
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly firestore: Firestore = inject(Firestore);

  private readonly settings$ = docData(doc(this.firestore, 'settings/app')).pipe(
    map(data => (data ? data as AppSettings : DEFAULT_APP_SETTINGS)),
    catchError(() => of(DEFAULT_APP_SETTINGS)),
    tap(settings => console.log('[x] Loaded settings:', settings))
  );

  readonly settingsSig = toSignal(this.settings$, { initialValue: DEFAULT_APP_SETTINGS });

  readonly autoSaveSig = computed(() => this.settingsSig().autoSave ?? false);
  readonly defaultMatchScheduleSig = computed(() => this.settingsSig().defaultMatchSchedule ?? []);

  async saveSettings(settings: AppSettings): Promise<void> {
    await setDoc(doc(this.firestore, 'settings/app'), settings);
  }

  public getMaxStoredRecentMatchesCount(): number {
    return 10;
  }

  public getPreferredPlayerCount(): number {
    return 12;
  }

  constructor() { }
}
