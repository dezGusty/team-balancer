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

    /**
     * Store a cache for the currently logged in user.
     * This means that all permission checks (E.g. is the current user a match organizer)
     * shall be performed on the data read at the login time. The user needs to log-in
     * again in order to read any updated permissions.
     */
    private cachedUser: User;
    private token: string;
    private subscription: Subscription;

    /**
     * Use this event emitter to inform subscribers that a sign-in event took place or sign-out event
     * is about to take place.
     */
    public onSignInOut: EventEmitter<string> = new EventEmitter<string>();

    signupUser() {
        //
    }

    /**
     * Perform the login into the application via Google.
     */
    doGoogleLogin() {
        return new Promise<any>((resolve, reject) => {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            this.afAuth.auth
                .signInWithPopup(provider)
                .then(res => {
                    console.log('[firebase login]');

                    this.getToken();
                    this.updateAndCacheUser(res.user);
                    this.onSignInOut.emit('signin-done');
                    this.router.navigate(['/']);
                    resolve(res);
                })
                .catch((error) => {
                    // error.code;
                    // error.message;
                    // error.email
                    // error.credential
                    console.warn('error when logging in', error);
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
        return result;
    }

    isAuthenticatedAsOrganizer(): boolean {
        if (!this.cachedUser || !this.cachedUser.roles) {
            return false;
        }

        if (this.cachedUser.roles.organizer) {
            return this.cachedUser.roles.organizer;
        }
        return false;
    }

    updateAndCacheUser(authdata: firebase.User) {
        const userData = new User(authdata);
        const userPath = authdata.uid;
        console.log('[upd user]', userData, authdata.uid);
        const userRef = this.db.doc('users/' + userPath).get();

        this.subscription = userRef.subscribe(user => {
            if (user.exists) {
                // existing user. read the roles.
                const originalObj = user.get('roles');
                if (originalObj) {
                    userData.roles = originalObj;
                } else {
                    console.log('User does not have role. Should create');
                }
                const obj = { ...userData };
                this.db.doc('users/' + userPath).set(obj, { merge: true });
                this.cachedUser = obj;
            } else {
                // New user. Create the user doc.
                const obj = { ...userData };
                console.log('User does not exist. Should create');
                this.db.doc('users/' + userPath).set(obj);
                this.cachedUser = obj;
            }
        });
    }
}


