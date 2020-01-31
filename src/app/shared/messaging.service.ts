import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireFunctions } from '@angular/fire/functions';
import { BehaviorSubject, Observable } from 'rxjs';

import 'firebase/messaging';
import { tap } from 'rxjs/operators';

@Injectable()
export class MessagingService {

  token;

  // message observable to show in Angular component
  currentMessage = new BehaviorSubject(null);

  constructor(
    private msg: AngularFireMessaging,
    private fun: AngularFireFunctions,
  ) {
    console.log('[msg] service created');

    this.msg.messaging.subscribe(
      (messaging) => {
        // Bind methods to fix temporary bug in AngularFire
        console.log('[msg] subscribed', messaging);
        // messaging.onMessage = messaging.onMessage.bind(messaging);
        // messaging.onTokenRefresh = messaging.onTokenRefresh.bind(messaging);
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

  getPermission(): Observable<any> {
    console.log('[mess] Requesting user permission');

    return this.msg.requestToken.pipe(
      tap(token => {
        this.token = token;
        console.log('[mess] stored token', token);
      })
    );
  }

  showMessages(): Observable<any> {
    return this.msg.messages.pipe(
      tap(msg => {
        const body: any = (msg as any).notification.body;
        this.makeToast(body);
        console.log('[msg]', body);
      })
    );
  }

  async makeToast(message) {
    // const toast = await this.toastController.create({
    //   message,
    //   duration: 5000,
    //   position: 'top',
    //   showCloseButton: true,
    //   closeButtonText: 'dismiss'
    // });
    // toast.present();
    console.log('makeToast', message);
  }

  sub(topic) {
    console.log('subscribing to topic', topic, 'token is', this.token);
    this.fun
      .httpsCallable('subscribeToTopic')({ topic, token: this.token })
      .pipe(tap(_ => this.makeToast('subscribed to ' + topic)))
      .subscribe();
  }

  unsub(topic) {
    console.log('UNsubscribing from topic', topic);
    this.fun
      .httpsCallable('unsubscribeFromTopic')({ topic, token: this.token })
      .pipe(tap(_ => this.makeToast('unsubscribed from ' + topic)))
      .subscribe();
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
