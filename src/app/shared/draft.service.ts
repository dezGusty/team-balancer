import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private dataChangeSubscription: Subscription;
  private playerIDs: string[] = [];

  constructor(private db: AngularFirestore, private authSvc: AuthService) {
    this.playerIDs = [];
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
    this.dataChangeSubscription = this.db.doc('matches/draft').valueChanges().subscribe(
      draftDocContents => {
        const castedItem = draftDocContents as { playerIDs: string[] };
        this.playerIDs = castedItem.playerIDs as string[];
        console.log('[draft-svc] player ids:', this.playerIDs);
      },
      error => console.log('some error encountered', error),
      () => { console.log('[draft-svc]complete'); },
    );


  }

  /**
     * Clean-up the data subscriptions.
     */
  unsubscribeFromDataSources() {
    if (this.dataChangeSubscription) {
      this.dataChangeSubscription.unsubscribe();
    }

  }
}
