import { Auth, authState, FacebookAuthProvider, getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, UserCredential } from '@angular/fire/auth';
import { computed, inject, Injectable, OnDestroy } from "@angular/core";
import { catchError, defer, from, map, of, shareReplay, Subject, Subscription, switchMap, tap } from 'rxjs';
import { NotificationService } from '../utils/notification/notification.service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser, UserRoles } from '../shared/app-user.model';
import { doc, Firestore, getDoc, setDoc } from '@angular/fire/firestore';

@Injectable()
export class UserAuthService implements OnDestroy {

  private readonly notificationService = inject(NotificationService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly firestore = inject(Firestore);

  /**
   * Emits 'signin-done' after a successful login and 'signout-pending' before a signout.
   * Data services subscribe to this to manage their Firestore subscriptions.
   */
  public onSignInOut$ = new Subject<string>();

  dataRetrievalSubject$ = new Subject<void>();
  dataRetrieval$ = this.dataRetrievalSubject$.asObservable().pipe(
    switchMap(_ => defer(() => from(signInWithPopup(getAuth(), new GoogleAuthProvider())))),
    tap((cred: UserCredential) => {
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      localStorage.setItem("tfl.access.token", credential?.accessToken ?? "");
      localStorage.setItem("tfl.user", JSON.stringify(cred.user));
    }),
    map(usercred => usercred.user),
    switchMap(user => from(this.updateAndCacheUserAfterLogin(user)).pipe(map(() => user))),
    tap(user => {
      this.loggedInUserSubject$.next(user);
      this.onSignInOut$.next('signin-done');
    }),
    catchError((err) => {
      this.notificationService.show("Login encountered an issue: " + err.message);
      return of(null);
    }),
    shareReplay(1)
  );

  loggedInUserSubject$ = new Subject<User | null>();
  loggedInUser$ = this.loggedInUserSubject$.asObservable().pipe(
    tap(userOrNull => { if (!userOrNull) {
      this.router.navigate(['']);
    } }),
    shareReplay(1)
  );
  loggedInUserSig = toSignal(this.loggedInUser$);

  constructor() {
    this.subscriptions.push(this.dataRetrieval$.subscribe());
    this.subscriptions.push(this.loggedInUser$.subscribe());
    this.loggedInUserSubject$.next(this.decodeUserFromStorage());

    // Listen to Firebase auth state changes (e.g. page refresh with persisted session)
    this.subscriptions.push(
      authState(this.auth).subscribe(profile => {
        if (profile) {
          localStorage.setItem("tfl.user", JSON.stringify(profile));
          this.updateAndCacheUserAfterLogin(profile);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  private subscriptions: Subscription[] = [];

  private decodeUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem("tfl.user");
      if (!userData) {
        return null;
      }
      const userObj = JSON.parse(userData) as User;
      return userObj;
    } catch (err) {
      console.warn("error when decoding user from storage", err);
      return null;
    }
  }

  /**
   * Fetch the user document from Firestore and cache the user's roles.
   */
  private async updateAndCacheUserAfterLogin(authdata: User): Promise<void> {
    const userData = new AppUser({ email: authdata.email as string, photoURL: authdata.photoURL as string });
    const userPath = authdata.uid;
    const userDocRef = doc(this.firestore, 'users/' + userPath);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const castedUser = userDocSnap.data() as AppUser;
      const originalRoles: UserRoles = castedUser.roles;
      if (originalRoles) {
        userData.roles = originalRoles;
      }

      if (!originalRoles || !originalRoles.standard) {
        userData.roles.standard = true;
        await setDoc(userDocRef, { ...userData }, { merge: true });
      }
    } else {
      // New user — create the user document.
      userData.roles.standard = true;
      await setDoc(userDocRef, { ...userData }, { merge: true });
    }

    this.cachedUser = { ...userData };
    localStorage.setItem('roles', JSON.stringify(this.cachedUser.roles));
  }

  /**
   * Perform the login into the application via Google.
   */
  public doGoogleLogin(postNavi: { successRoute: string[] } = { successRoute: ['/'] }) {
    this.dataRetrievalSubject$.next();
  }

  /**
   * Perform the login into the application via Facebook.
   */
  public async doFacebookLoginAsync(postNavi: { successRoute: string[] } = { successRoute: ['/'] }): Promise<boolean> {
    try {
      const userCred = await signInWithPopup(this.auth, new FacebookAuthProvider());
      if (userCred) {
        localStorage.setItem("tfl.user", JSON.stringify(userCred.user));
        await this.updateAndCacheUserAfterLogin(userCred.user);
        this.loggedInUserSubject$.next(userCred.user);
        this.onSignInOut$.next('signin-done');
        if (postNavi?.successRoute?.length > 0) {
          this.router.navigate(postNavi.successRoute);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      this.notificationService.show("Facebook login encountered an issue: " + err.message);
      return false;
    }
  }

  signOut() {
    this.onSignInOut$.next('signout-pending');
    signOut(this.auth)
      .then(() => {
        localStorage.removeItem('roles');
        localStorage.removeItem('tfl.access.token');
        localStorage.removeItem('tfl.user');
        localStorage.removeItem('token');
        localStorage.removeItem('players');
        localStorage.removeItem('archived_players');

        this.cachedUser = null;
        this.loggedInUserSubject$.next(null);
        this.router.navigate(['']);
      }).catch((error) => {
        this.notificationService.show("Error when signing out: " + error.message);
      });
  }


  isAuthenticated(): boolean {
    return this.loggedInUserSig() != null;
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

  private cachedUser: AppUser | null = null;

  public readonly authenticatedSig = computed(() => {
    if (! this.loggedInUserSig()) {
      return false;
    }

    return true;
  });

  public readonly authenticatedAsUserSig = computed(() => {
    if (! this.loggedInUserSig()) {
      return false;
    }

    return this.isAuthenticatedAsUser();
  });

  public readonly authenticatedAsOrganizerSig = computed(() => {
    if (! this.loggedInUserSig()) {
      return false;
    }

    return this.isAuthenticatedAsOrganizer();
  });

  public readonly authenticatedAsAdminSig = computed(() => {
    if (! this.loggedInUserSig()) {
      return false;
    }

    return this.isAuthenticatedAsAdmin();
  });

  isAuthenticatedAsUser(): boolean {
    if (!this.cachedUser || !this.cachedUser?.roles) {
      const storedValue = localStorage.getItem('roles');
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
      const storedValue = localStorage.getItem('roles');
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
      const storedValue = localStorage.getItem('roles');
      if (!storedValue) {
        return false;
      }
      const roles: UserRoles = JSON.parse(storedValue);
      return this.doesRoleContainAdmin(roles);
    }

    return this.doesRoleContainAdmin(this.cachedUser?.roles);
  }
}