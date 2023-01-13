import { Auth, authState, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, User } from '@angular/fire/auth';
import { doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { Injectable, EventEmitter, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser, UserRoles } from '../shared/app-user.model';
import { Subscription } from 'rxjs';
import { AppStorage } from '../shared/app-storage';

@Injectable()
export class AuthService {
    /**
     * Store a cache for the currently logged in user.
     * This means that all permission checks (E.g. is the current user a match organizer)
     * shall be performed on the data read at the login time. The user needs to log-in
     * again in order to read any updated permissions.
     */
    private cachedUser: AppUser | null = null;
    private token: string | null;
    private subscription: Subscription = Subscription.EMPTY;

    constructor(
        private router: Router,
        private firestore: Firestore,
        @Optional() private auth: Auth,
        private appStorage: AppStorage) {

        console.log('[auth-alt] ctor');
        this.token = this.appStorage.getAppStorageItem('token');
        if (this.appStorage.cacheUserData) {
            const tempCacheData = this.appStorage.getAppStorageItem('user');
            if (tempCacheData) {
                this.cachedUser = JSON.parse(tempCacheData);
            }
        }

        authState(this.auth).subscribe(profile => {
            if (profile) {
                this.token = profile.uid;
                this.appStorage.setAppStorageItem('token', this.token);
                this.updateAndCacheUserAfterLogin(profile);
            }
        });
    }

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

            signInWithPopup(this.auth,
                new GoogleAuthProvider(),
                browserPopupRedirectResolver).then((res) => {
                    // Success
                    this.issueTokenRetrieval();
                    this.updateAndCacheUserAfterLogin(res.user);
                    this.onSignInOut.emit('signin-done');
                    if (postNavi?.successRoute?.length > 0) {
                        console.log('[login] navigating to route ', postNavi.successRoute);
                        this.router.navigate(postNavi.successRoute);
                    }
                    resolve(res);
                }, (error) => {
                    // Error handling
                    console.warn('error when logging in', error);
                });
        });
    }

    /**
     * Perform the login into the application via Google.
     * @param postNavi: navigation route to be applied upon a successful log-in.
     * It consists of an array of strings. Defaults to : ['/'].
     * To avoid any redirect upon log-in, set this to an empty array:
     * @example
     * // login without redirect
     * await doGoogleLoginAsync({ successRoute: [] });
     * @example
     * // login with default redirect to root.
     * doGoogleLogin();
     * @example
     * // login with default redirect to /base.
     * doGoogleLogin({ successRoute: ['base'] });
     */
    public async doGoogleLoginAsync(postNavi: { successRoute: string[] } = { successRoute: ['/'] }): Promise<boolean> {
        console.log('doGoogleLoginAsync entered');

        const userCred = await signInWithPopup(
            this.auth,
            new GoogleAuthProvider());
        
        if (userCred) {
            this.issueTokenRetrieval();
            this.updateAndCacheUserAfterLogin(userCred.user);
            this.onSignInOut.emit('signin-done');
            if (postNavi?.successRoute?.length > 0) {
                console.log('[login] navigating to route ', postNavi.successRoute);
                this.router.navigate(postNavi.successRoute);
            }
            return true;
        }
        return false;
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
        this.auth
            .signOut()
            .then(() => {
                this.token = null;
                console.log('[guard] navigating in place');
                this.router.navigate(['']);
            });
    }

    public async signOutAsync() {
        console.log('signOutAsync');
        this.notifySubscribersOfSignout();
        // unsubscribe
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        this.token = null;
        this.cachedUser = null;
        this.appStorage.removeAppStorageItem('roles');

        await this.auth.signOut();
        console.log('[guard] navigating in place');
        this.appStorage.removeAppStorageItem('roles');
        this.router.navigate(['']);
    }

    private issueTokenRetrieval() {
        console.log('issueTokenRetrieval');

        if (!this.auth || !this.auth.currentUser) {
            return;
        }

        // Request the token. Store it when received.
        this.token = this.auth?.currentUser?.uid;
        console.log('this.token', this.token);
    }

    /**
     * Use this event emitter to inform subscribers that a sign-in event took place or sign-out event
     * is about to take place.
     */
    public onSignInOut: EventEmitter<string> = new EventEmitter<string>();

    // public getCachedUser(): AppUser {
    //     return this.cachedUser;
    // }


    isAuthenticated(): boolean {
        const result = (this.token != null);

        return result;
    }

    public doesRoleContainUser(role: UserRoles) {
        if (role && role.standard) {
            return role.standard;
        }
        return false;
    }

    public doesRoleContainOrganizer(role: UserRoles) {
        if (role && role.organizer) {
            return role.organizer;
        }
        return false;
    }

    public doesRoleContainAdmin(role: UserRoles) {
        if (role && role.admin) {
            return role.admin;
        }
        return false;
    }

    isAuthenticatedAsUser(): boolean {
        if (!this.cachedUser || !this.cachedUser?.roles) {
            const storedValue = this.appStorage.getAppStorageItem('roles');
            if (!storedValue) {
                return false;
            }
            const roles: UserRoles = JSON.parse(storedValue);
            return this.doesRoleContainUser(roles);
        }

        return this.doesRoleContainUser(this.cachedUser?.roles);
    }

    isAuthenticatedAsOrganizer(): boolean {
        if (!this.cachedUser || !this.cachedUser?.roles) {
            const storedValue = this.appStorage.getAppStorageItem('roles');
            if (!storedValue) {
                return false;
            }
            const roles: UserRoles = JSON.parse(storedValue);
            return this.doesRoleContainOrganizer(roles);
        }

        return this.doesRoleContainOrganizer(this.cachedUser?.roles);
    }

    isAuthenticatedAsAdmin(): boolean {
        if (!this.cachedUser || !this.cachedUser?.roles) {
            const storedValue = this.appStorage.getAppStorageItem('roles');
            if (!storedValue) {
                return false;
            }
            const roles: UserRoles = JSON.parse(storedValue);
            return this.doesRoleContainAdmin(roles);
        }

        return this.doesRoleContainAdmin(this.cachedUser?.roles);
    }

    ///TODO:XXX:This can be simplified
    async updateAndCacheUserAfterLogin(authdata: User) {
        const userData = new AppUser({email: authdata.email as string, photoURL: authdata.photoURL as string});
        const userPath = authdata.uid;
        const userDocRef = doc(this.firestore, 'users/' + userPath);
        // const userRef = this.db.doc('users/' + userPath).get();
        this.subscription = docData(userDocRef).subscribe(async user => {
            const castedUser = user as AppUser;
            if (castedUser != null) {
                // existing user. read the roles.
                const originalObj: UserRoles = castedUser.roles;
                if (originalObj) {
                    userData.roles = originalObj;
                } else {
                    console.log('User does not have role. Should create');
                }
                const obj = { ...userData };

                if (!originalObj || !originalObj.standard) {
                    // no permission property stored initially.
                    // store something.
                    userData.roles.standard = true;
                    const obj = { ...userData };

                    console.log('[auth] storing user permissions');
                    const docRef = doc(this.firestore, 'users/' + userPath);
                    await setDoc(docRef, obj, { merge: true });
                }
                this.cachedUser = obj;
                this.appStorage.setAppStorageItem('roles', JSON.stringify(this.cachedUser?.roles));
                if (this.appStorage.cacheUserData) {
                    this.appStorage.setAppStorageItem('user', JSON.stringify(this.cachedUser));
                }
            } else {
                // New user. Create the user doc.
                const obj = { ...userData };
                console.log('User does not exist. Should create');
                const docRef = doc(this.firestore, 'users/' + userPath);
                await setDoc(docRef, obj, { merge: true });
                this.cachedUser = obj;
                this.appStorage.setAppStorageItem('roles', JSON.stringify(this.cachedUser?.roles));
                if (this.appStorage.cacheUserData) {
                    this.appStorage.setAppStorageItem('user', JSON.stringify(this.cachedUser));
                }
            }
        });
    }
}


