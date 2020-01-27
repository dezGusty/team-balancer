import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable, EventEmitter } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Player } from './player.model';
import { map } from 'rxjs/internal/operators/map';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private dataChangeSubscription: Subscription;
  // private playerIDs: string[] = [];
  selectedDraftPlayers: Player[] = [];
  playerDataChangeEvent = new EventEmitter<Player[]>();

  constructor(private db: AngularFirestore, private authSvc: AuthService) {
    // this.playerIDs = [];
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

    // subscribe to firebase collection changes.
    this.dataChangeSubscription = this.db.doc('drafts/next').valueChanges().subscribe(
      draftDocContents => {
        const castedItem = draftDocContents as { players: Player[] };
        this.selectedDraftPlayers = [...castedItem.players];
        console.log('[draft-svc] selected players', this.selectedDraftPlayers);
        this.playerDataChangeEvent.emit(this.selectedDraftPlayers);
      },
      error => console.log('some error encountered', error),
      () => { console.log('[draft-svc]c omplete'); },
    );
    // // subscribe to firebase collection changes.
    // this.dataChangeSubscription = this.db.doc('drafts/next').valueChanges().subscribe(
    //   draftDocContents => {
    //     const castedItem = draftDocContents as { playersIDs: string[] };
    //     this.playerIDs = castedItem.playerIDs as string[];
    //     console.log('[draft-svc] player ids:', this.playerIDs);
    //   },
    //   error => console.log('some error encountered', error),
    //   () => { console.log('[draft-svc]complete'); },
    // );

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
  saveSelectedPlayerList(players: Player[]) {
    //TODO:add code here
    console.log('[draft] saving players', players);

    const draftPlayersListRef = this.db.doc('/drafts/next').ref;
    const obj = { players };
    draftPlayersListRef.set(obj, { merge: true });
  }
}
