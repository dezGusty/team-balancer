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
  showPlayerStatusIcons: boolean;
  autoNavigateToTransferredDraft: boolean;
  randomizePlayerOrder: boolean;
  recentMatchesToStore: number;
}

export const MIN_RECENT_MATCHES_TO_STORE = 4;
export const MAX_RECENT_MATCHES_TO_STORE = 12;
export const DEFAULT_RECENT_MATCHES_TO_STORE = 8;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSave: true,
  defaultMatchSchedule: [
    { dayOfWeek: 2, time: '20:00' },  // Tuesday
    { dayOfWeek: 4, time: '20:00' },  // Thursday
  ],
  showPlayerStatusIcons: true,
  autoNavigateToTransferredDraft: true,
  randomizePlayerOrder: false,
  recentMatchesToStore: DEFAULT_RECENT_MATCHES_TO_STORE,
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly firestore: Firestore = inject(Firestore);

  private readonly settings$ = docData(doc(this.firestore, 'settings/app')).pipe(
    map(data => this.normalizeSettings(data as Partial<AppSettings> | undefined)),
    catchError(() => of(DEFAULT_APP_SETTINGS)),
    tap(settings => console.log('[x] Loaded settings:', settings))
  );

  readonly settingsSig = toSignal(this.settings$, { initialValue: DEFAULT_APP_SETTINGS });

  readonly autoSaveSig = computed(() => this.settingsSig().autoSave ?? false);
  readonly defaultMatchScheduleSig = computed(() => this.settingsSig().defaultMatchSchedule ?? []);
  readonly showPlayerStatusIconsSig = computed(() => this.settingsSig().showPlayerStatusIcons ?? true);
  readonly autoNavigateToTransferredDraftSig = computed(() => this.settingsSig().autoNavigateToTransferredDraft ?? true);
  readonly randomizePlayerOrderSig = computed(() => this.settingsSig().randomizePlayerOrder ?? false);
  readonly recentMatchesToStoreSig = computed(() =>
    this.clampRecentMatchesToStoreCount(this.settingsSig().recentMatchesToStore)
  );

  async saveSettings(settings: AppSettings): Promise<void> {
    await setDoc(doc(this.firestore, 'settings/app'), this.normalizeSettings(settings));
  }

  public getMaxStoredRecentMatchesCount(): number {
    return this.recentMatchesToStoreSig();
  }

  public getPreferredPlayerCount(): number {
    return 12;
  }

  public clampRecentMatchesToStoreCount(value: number | null | undefined): number {
    if (value == null || Number.isNaN(value)) {
      return DEFAULT_RECENT_MATCHES_TO_STORE;
    }

    const rounded = Math.round(value);
    return Math.min(MAX_RECENT_MATCHES_TO_STORE, Math.max(MIN_RECENT_MATCHES_TO_STORE, rounded));
  }

  private normalizeSettings(settings?: Partial<AppSettings>): AppSettings {
    return {
      autoSave: settings?.autoSave ?? DEFAULT_APP_SETTINGS.autoSave,
      defaultMatchSchedule: settings?.defaultMatchSchedule ?? DEFAULT_APP_SETTINGS.defaultMatchSchedule,
      showPlayerStatusIcons: settings?.showPlayerStatusIcons ?? DEFAULT_APP_SETTINGS.showPlayerStatusIcons,
      autoNavigateToTransferredDraft: settings?.autoNavigateToTransferredDraft ?? DEFAULT_APP_SETTINGS.autoNavigateToTransferredDraft,
      randomizePlayerOrder: settings?.randomizePlayerOrder ?? DEFAULT_APP_SETTINGS.randomizePlayerOrder,
      recentMatchesToStore: this.clampRecentMatchesToStoreCount(settings?.recentMatchesToStore),
    };
  }

  constructor() { }
}
