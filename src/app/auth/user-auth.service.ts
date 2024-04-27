import { getAuth, GoogleAuthProvider, signInWithPopup, User, UserCredential } from '@angular/fire/auth';
import { inject, Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, catchError, defer, from, map, of, shareReplay, Subject, Subscription, switchMap, tap } from 'rxjs';
import { NotificationService } from '../utils/notification/notification.service';

@Injectable()
export class UserAuthService implements OnDestroy {

  private readonly notificationService = inject(NotificationService);

  dataRetrievalSubject$ = new Subject<void>();
  dataRetrieval$ = this.dataRetrievalSubject$.asObservable().pipe(
    tap(_ => console.log("*** dataRetrievalSubject$")),
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
    tap(data => console.log("*** loggedInUser$", data)),
    shareReplay(1)
  );

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
    console.log("[user-auth] Logging in via Google Service...");
    this.dataRetrievalSubject$.next();
    // TODO: also use postNavi.successRoute ?
  }

  signOut() {
    // this.auth
    //   .signOut()
    //   .then(() => {
    //     this.token = null;
    //     console.log('[guard] navigating in place');
    //     this.router.navigate(['']);
    //   });
  }
}