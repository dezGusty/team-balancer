import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from 'angularfire2/firestore';
import { User, UserRoles } from '../shared/user.model';
import { Subscription } from 'rxjs';

@Injectable()
export class AuthService {

    constructor(
        private router: Router,
        private db: AngularFirestore,
        private afAuth: AngularFireAuth) {

        this.token = sessionStorage.getItem('token');
        this.afAuth.authState.subscribe(
            (auth) => {
                if (auth) {
                    this.afAuth.auth.currentUser.getIdToken()
                        .then(
                            (token: string) => {
                                this.token = token;
                                sessionStorage.setItem('token', this.token);
                            }
                        );
                    this.updateAndCacheUserAfterLogin(this.afAuth.auth.currentUser);
                    return this.db.doc('users/' + auth.uid).get();
                } else {
                    return null;
                }
            }
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

                    this.issueTokenRetrieval();
                    this.updateAndCacheUserAfterLogin(res.user);
                    this.onSignInOut.emit('signin-done');
                    console.log('[login] navigating to root');
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
                console.log('[guard] navigating in place');
                this.router.navigate(['']);
            });
    }

    private issueTokenRetrieval() {
        if (!this.afAuth.auth || !this.afAuth.auth.currentUser) {
            return;
        }

        // Request the token. Store it when received.
        this.afAuth.auth.currentUser.getIdToken()
            .then(
                (token: string) => {
                    this.token = token;
                }
            ).catch((error) => {
                console.warn('[guard] Failed to retrieve token', error);
            });
    }

    isAuthenticated(): boolean {
        const result = (this.token != null);
        return result;
    }

    public doesRoleContainOrganizer(role: UserRoles) {
        if (role.organizer) {
            return role.organizer;
        }
        return false;
    }

    isAuthenticatedAsOrganizer(): boolean {
        if (!this.cachedUser || !this.cachedUser.roles) {
            const roles: UserRoles = JSON.parse(sessionStorage.getItem('roles'));
            return this.doesRoleContainOrganizer(roles);
        }

        return this.doesRoleContainOrganizer(this.cachedUser.roles);
    }

    updateAndCacheUserAfterLogin(authdata: firebase.User) {
        const userData = new User(authdata);
        const userPath = authdata.uid;
        const userRef = this.db.doc('users/' + userPath).get();

        this.subscription = userRef.subscribe(user => {
            if (user.exists) {
                // existing user. read the roles.
                const originalObj: UserRoles = user.get('roles');
                if (originalObj) {
                    userData.roles = originalObj;
                } else {
                    console.log('User does not have role. Should create');
                }
                const obj = { ...userData };
                if (!originalObj || !originalObj.standard) {
                    // no permission property stored initially.
                    // store something.
                    console.log('[auth] storing user permissions');

                    this.db.doc('users/' + userPath).set(obj, { merge: true });
                }
                this.cachedUser = obj;
                sessionStorage.setItem('roles', JSON.stringify(this.cachedUser.roles));
            } else {
                // New user. Create the user doc.
                const obj = { ...userData };
                console.log('User does not exist. Should create');
                this.db.doc('users/' + userPath).set(obj);
                this.cachedUser = obj;
                sessionStorage.setItem('roles', JSON.stringify(this.cachedUser.roles));
            }
        });
    }
}


