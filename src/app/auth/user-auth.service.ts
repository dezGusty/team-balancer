import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, UserCredential } from '@angular/fire/auth';
import { computed, inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { BehaviorSubject, catchError, defer, from, map, of, shareReplay, Subject, Subscription, switchMap, tap } from 'rxjs';
import { NotificationService } from '../utils/notification/notification.service';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppUser, UserRoles } from '../shared/app-user.model';

@Injectable()
export class UserAuthService implements OnDestroy {

  private readonly notificationService = inject(NotificationService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  dataRetrievalSubject$ = new Subject<void>();
  dataRetrieval$ = this.dataRetrievalSubject$.asObservable().pipe(
    switchMap(_ => defer(() => from(signInWithPopup(getAuth(), new GoogleAuthProvider())))),
    tap((cred: UserCredential) => {
      const credential = GoogleAuthProvider.credentialFromResult(cred);
      localStorage.setItem("tfl.access.token", credential?.accessToken ?? "");
      localStorage.setItem("tfl.user", JSON.stringify(cred.user));
    }),
    map(usercred => usercred.user),
    tap(user => this.loggedInUserSubject$.next(user)),
    catchError((err) => {
      this.notificationService.show("Data save encountered an issue." + err.message);
      return of(null);
    }),
    shareReplay(1)
  );

  loggedInUserSubject$ = new BehaviorSubject<User | null>(null);
  loggedInUser$ = this.loggedInUserSubject$.asObservable().pipe(
    // tap(data => console.log("*** loggedInUser$", data)),
    tap(userOrNull => { if (userOrNull) { this.router.navigate(['']); } }),
    shareReplay(1)
  );
  loggedInUserSig = toSignal(this.loggedInUser$);

  constructor() {
    console.log("[user-auth-service] constructor");
    this.subscriptions.push(this.dataRetrieval$.subscribe());
    this.subscriptions.push(this.loggedInUser$.subscribe());
    this.loggedInUserSubject$.next(this.decodeUserFromStorage());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  private subscriptions: Subscription[] = [];



  private decodeUserFromStorage(): User | null {
    try {
      let userData = localStorage.getItem("tfl.user");
      if (!userData) {
        return null;
      }
      let userObj = JSON.parse(userData ?? "") as User;
      return userObj;
    } catch (err) {
      console.warn("error when decoding user from storage", err);
      return null;
    }
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
    console.log("[user-auth-service] Logging in via Google Service...");
    this.dataRetrievalSubject$.next();
    // TODO: also use postNavi.successRoute ?
  }

  signOut() {
    console.log("[user-auth-service] Signing out...");
    signOut(this.auth)
      .then(() => {

        localStorage.removeItem('roles');
        localStorage.removeItem('tfl.access.token');
        localStorage.removeItem('tfl.user');
        localStorage.removeItem('token');
        // TODO(Augustin Preda, 2024.04.27): These are old items. Check if still used in code.
        localStorage.removeItem('players');
        localStorage.removeItem('archived_players');

        this.loggedInUserSubject$.next(null);

        // console.log('[guard] navigating in place');
        this.router.navigate(['']);
      }).catch((error) => {
        console.log('error when signing out', error);
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