import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, take } from 'rxjs/operators';
import { AngularFirestore } from 'angularfire2/firestore';
import { User } from '../shared/user.model';
import { Subscription } from 'rxjs';

@Injectable()
export class AuthService {

    constructor(
        private router: Router,
        private db: AngularFirestore,
        private afAuth: AngularFireAuth) {
        this.getToken();

        this.afAuth.authState.pipe(
            switchMap(auth => {
                if (auth) {
                    return this.db.doc('users/' + auth.uid).get();
                } else {
                    return null;
                }
            })
        );
    }
    private cachedUser: User;
    private token: string;
    private subscription: Subscription;
    public onSignInOut: EventEmitter<string> = new EventEmitter<string>();

    signupUser() {
        //
    }

    doGoogleLogin() {
        return new Promise<any>((resolve, reject) => {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            this.afAuth.auth
                .signInWithPopup(provider)
                .then(res => {
                    this.router.navigate(['/']);
                    this.getToken();
                    this.updateAndCacheUser(res.user);
                    this.onSignInOut.emit('signin-done');
                    resolve(res);
                });
        });
    }

    notifySubscribersOfSignout() {
        this.onSignInOut.emit('signout-pending');
    }

    signOut() {
        this.notifySubscribersOfSignout();
        // unsubscribe
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.afAuth.auth
            .signOut()
            .then(() => {
                this.token = null;
                this.router.navigate(['']);
            });
    }

    getToken() {
        if (!this.afAuth.auth || !this.afAuth.auth.currentUser) {
            return;
        }
        this.afAuth.auth.currentUser.getIdToken()
            .then(
                (token: string) => {
                    this.token = token;
                    // console.log('[token]', this.token);
                }
            );
        return this.token;
    }

    isAuthenticated(): boolean {
        const result = (this.token != null);
        // console.log('[auth]', result);
        return result;
    }

    isAuthenticatedAsOrganizer(): boolean {
        if (this.cachedUser.roles.organizer) {
            console.log('[org] returning', this.cachedUser.roles.organizer);

            return this.cachedUser.roles.organizer;
        }
        console.log('[org] returning', false);
        return false;
    }

    updateAndCacheUser(authdata: firebase.User) {
        const userData = new User(authdata);
        const userPath = authdata.uid + '_';
        console.log('[upd user]', userData, authdata.uid);
        const userRef = this.db.doc('users/' + userPath).get();
        console.log(userRef);

        this.subscription = userRef.subscribe(user => {
            if (user.exists) {
                console.log('***1', userData);
                const originalObj = user.get('roles');
                if (originalObj) {
                    userData.roles = originalObj;
                    console.log('***2', userData);
                }
                console.log('***3', userData);
                const obj = { ...userData };
                console.log('User does not have role. Should create');
                this.db.doc('users/' + userPath).set(obj, { merge: true });
                this.cachedUser = obj;
            } else {
                // Create user doc.
                const obj = { ...userData };
                console.log('User does not have role. Should create');
                this.db.doc('users/' + userPath).set(obj);
            }
        });
    }
}


