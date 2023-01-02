import { Injectable } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { getDisplayName, Player } from './player.model';
import { DraftChangeInfo } from './draft-change-info';
import { AuthService } from '../auth/auth.service';
import { doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private dataChangeSubscription: Subscription = Subscription.EMPTY;
  selectedDraftPlayers: Player[] = [];
  playerDraftChangeEvent = new BehaviorSubject<DraftChangeInfo | undefined>(undefined);

  constructor(
    private firestore: Firestore,
    private authSvc: AuthService,
    private settingsSvc: SettingsService) {
    this.selectedDraftPlayers = [];
    if (!this.authSvc.isAuthenticated()) {
      console.log('[matches] waiting for login...');
    }

    this.authSvc.onSignInOut.subscribe((message) => {
      if (message === 'signout-pending') {
        this.unsubscribeFromDataSources();
      } else if (message === 'signin-done') {
        this.subscribeToDataSources();
      } else {
        console.log('[matches] unexpected message from auth svc: ' + message);
      }
    });

    // if already logged in, there will be no notification for signin-done.
    // simulate the event now.
    if (this.authSvc.isAuthenticated()) {
      this.subscribeToDataSources();
    }
  }

  /**
   * Subscribes to the data sources used by this service.
   */
  subscribeToDataSources() {
    console.log('[draft-svc] subscribing');

    // Emit an event to signal that the app is fetching / loading data
    const playerInfo = new DraftChangeInfo([], 'loading', 'Fetching draft data...');
    console.log('emitting ', playerInfo);
    this.playerDraftChangeEvent.next(playerInfo);

    const docRef = doc(this.firestore, '/drafts/next');
    this.dataChangeSubscription = docData(docRef).subscribe({
      next: draftDocContents => {
        console.log('draft data change');

        const castedItem = draftDocContents as { players: Player[] };
        this.selectedDraftPlayers = [...castedItem.players];
        console.log('[draft-svc] selected players', this.selectedDraftPlayers);
        let notification = new DraftChangeInfo(this.selectedDraftPlayers, 'info', 'loaded');
        this.playerDraftChangeEvent.next(notification);
      },
      error: err => console.log('some error encountered', err),
      complete:
        () => { console.log('[draft-svc]complete') }
    });
  }

  /**
   * Clean-up the data subscriptions.
   */
  unsubscribeFromDataSources() {
    if (this.dataChangeSubscription) {
      this.dataChangeSubscription.unsubscribe();
    }
  }

  /**
   * Retrieves the list of players which have been added to the draft already.
   */
  getDraftedPlayers(): Player[] {
    return this.selectedDraftPlayers;
  }

  /**
   * Saves the list of players to the DB to be used as a draft.
   * TODO(Augustin Preda, 2020.01.27): this should maybe be switched to a PlayerInfo definition, where
   * only the player id is used, instead of using separate objects.
   * @param players The array of players to store.
   */
  async saveSelectedPlayerListAsync(players: Player[]) {
    // Emit an event to signal that the app is fetching / loading data
    const playerInfo = new DraftChangeInfo([], 'loading', 'Fetching draft data...');
    console.log('emitting ', playerInfo);
    this.playerDraftChangeEvent.next(playerInfo);

    const docName = '/drafts/next';
    const docRef = doc(this.firestore, docName);
    const obj = { players };
    await setDoc(docRef, obj, { merge: true });
  }

  /**
   * Store some players only in memory. This will impact other components which use the service,
   * but will result in no writing to the DB.
   * @param players The players to store in memory.
   */
  public storePlayersInMemoryOnly(players: Player[]): void {
    this.selectedDraftPlayers = [...players];
  }

  public getDraftPrettyPrinted(players: Player[], newline: string): string {
    let plainText = 'Main line-up ⚽' + newline;
    plainText += '---------------' + newline
    players.slice(0, this.settingsSvc.getPreferredPlayerCount()).forEach((player, index) => {
      plainText += '' + (index + 1) + '. ' + getDisplayName(player) + newline;
    });

    let reservesArray = players.slice(this.settingsSvc.getPreferredPlayerCount());
    if (reservesArray.length > 0) {
      plainText += newline + 'Reserves 💺' + newline;
      plainText += '---------------' + newline;
      reservesArray.forEach((player, index) => {
        plainText += '' + (index + 1) + '. ' + getDisplayName(player) + newline;
      })
    }
    return plainText;
  }

  public getDraftPlainTextFormat(players: Player[]): string {
    return this.getDraftPrettyPrinted(players, '\r\n');
  }

  public getDraftHtmlFormat(players: Player[]): string {
    return this.getDraftPrettyPrinted(players, '<br>');
  }
}
