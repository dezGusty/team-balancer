import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Injectable, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { User, UserRoles } from '../shared/user.model';
import { Subscription } from 'rxjs';
import { AppStorage } from '../shared/app-storage';

@Injectable()
export class AuthService {

    constructor(
        private router: Router,
        private db: AngularFirestore,
        private afAuth: AngularFireAuth,
        private appStorage: AppStorage) {

        this.token = this.appStorage.getAppStorageItem('token');
        if (this.appStorage.cacheUserData) {
            const tempCacheData = this.appStorage.getAppStorageItem('user');
            if (tempCacheData !== undefined) {
                this.cachedUser = JSON.parse(tempCacheData);
            }
        }

        this.afAuth.authState.subscribe(
            (auth) => {
                if (auth) {
                    this.afAuth.auth.currentUser.getIdToken()
                        .then(
                            (token: string) => {
                                this.token = token;
                                this.appStorage.setAppStorageItem('token', this.token);
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

    public getCachedUser(): User {
        return this.cachedUser;
    }

    /**
     * Use this event emitter to inform subscribers that a sign-in event took place or sign-out event
     * is about to take place.
     */
    public onSignInOut: EventEmitter<string> = new EventEmitter<string>();

    /**
     * Perform the login into the application via Google.
     * @param postNavi: navigation route to be applied upon a successful log-in.
     * It consists of an array of strings. Defaults to : ['/'].
     * To avoid any redirect upon log-in, set this to an empty array:
     * @example
     * // login without redirect
     * doGoogleLogin({ successRoute: [] });
     * @example
     * // login with default redirect to root.
     * doGoogleLogin();
     * @example
     * // login with default redirect to /base.
     * doGoogleLogin({ successRoute: ['base'] });
     */
    public doGoogleLogin(postNavi: { successRoute: string[] } = { successRoute: ['/'] }) {
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
                    if (postNavi?.successRoute?.length > 0) {
                        console.log('[login] navigating to route ', postNavi.successRoute);
                        this.router.navigate(postNavi.successRoute);
                    }
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
        if (role && role.organizer) {
            return role.organizer;
        }
        return false;
    }

    isAuthenticatedAsOrganizer(): boolean {
        if (!this.cachedUser || !this.cachedUser.roles) {
            const storedValue = this.appStorage.getAppStorageItem('roles');
            if (!storedValue) {
                return this.doesRoleContainOrganizer(this.cachedUser.roles);
            }
            const roles: UserRoles = JSON.parse(storedValue);
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
                this.appStorage.setAppStorageItem('roles', JSON.stringify(this.cachedUser.roles));
                if (this.appStorage.cacheUserData) {
                    this.appStorage.setAppStorageItem('user', JSON.stringify(this.cachedUser));
                }
            } else {
                // New user. Create the user doc.
                const obj = { ...userData };
                console.log('User does not exist. Should create');
                this.db.doc('users/' + userPath).set(obj);
                this.cachedUser = obj;
                this.appStorage.setAppStorageItem('roles', JSON.stringify(this.cachedUser.roles));
                if (this.appStorage.cacheUserData) {
                    this.appStorage.setAppStorageItem('user', JSON.stringify(this.cachedUser));
                }
            }
        });
    }
}


