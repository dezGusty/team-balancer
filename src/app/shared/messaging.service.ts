import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { BehaviorSubject } from 'rxjs';

import 'firebase/messaging';

@Injectable()
export class MessagingService {

  // private messaging = firebase.messaging();
  // private messageSource = new Subject();

  // message observable to show in Angular component
  currentMessage = new BehaviorSubject(null);

  constructor(
    private msg: AngularFireMessaging
  ) {
    this.msg.messaging.subscribe(
      (messaging) => {
        messaging.onMessage = messaging.onMessage.bind(messaging);
        messaging.onTokenRefresh = messaging.onTokenRefresh.bind(messaging);
      }
    );
  }

  requestPermission() {
    console.log('[mess] getPerm');
    this.msg.requestToken.subscribe(
      (token) => {
        console.log('[mess] reqPerm, token', token);
      },
      (err) => {
        console.error('[mess] unable to get perm to notify', err);
      }
    );
  }

  receiveMessage() {
    console.log('[mess] recv');
    this.msg.messages.subscribe(
      (payload) => {
        console.log('[mess] New message received', payload);
        this.currentMessage.next(payload);
      }
    );
  }

  // // get permission to send messages
  // getPermission(user) {
  //   console.log('[mess] getPerm');

  //   this.messaging.requestPermission()
  //     .then(() => {
  //       console.log('[mess] Notification permission granted.');
  //       return this.messaging.getToken();
  //     })
  //     .then(token => {
  //       console.log('[mess] Saving token', token);
  //       this.saveToken(user, token);
  //     })
  //     .catch((err) => {
  //       console.log('[mess] Unable to get permission to notify.', err);
  //     });
  // }
  // // Listen for token refresh
  // monitorRefresh(user) {
  //   console.log('[mess] monitoring');

  //   this.messaging.onTokenRefresh(() => {
  //     this.messaging.getToken()
  //       .then(refreshedToken => {
  //         console.log('[mess] Token refreshed.');
  //         this.saveToken(user, refreshedToken);
  //       })
  //       .catch(err => console.log(err, 'Unable to retrieve new token'));
  //   });
  // }

  // // used to show message when app is open
  // receiveMessages() {
  //   this.messaging.onMessage(payload => {
  //     console.log('[mess] Message received. ', payload);
  //     this.messageSource.next(payload);
  //   });
  // }

  // // save the permission token in firestore
  // private saveToken(user, token): void {

  //   const currentTokens = user.fcmTokens || {};

  //   // If token does not exist in firestore, update db
  //   if (!currentTokens[token]) {
  //     const userRef = this.db.collection('users').doc(user.uid);
  //     const tokens = { ...currentTokens, [token]: true };
  //     userRef.update({ fcmTokens: tokens });
  //   }
  // }
}
