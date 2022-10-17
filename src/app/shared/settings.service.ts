import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public getMaxStoredRecentMatchesCount(): number {
    return 10;
  }

  public getPreferredPlayerCount(): number {
    return 12;
  }

  constructor() { }
}
