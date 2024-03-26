import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Subject, Subscription, combineLatest, distinctUntilChanged, map, scan, shareReplay, startWith, tap, timer } from "rxjs";

export interface NotificationMessage {
  message: string;
  timestamp: number;
  durationInMillis: number;
}

const INITIAL_MSG_LIST: NotificationMessage[] = [];
const NOTIFICATIONS_MAX_ITEMS: number = 10;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private notificationSubject$ = new Subject<NotificationMessage>();
  public readonly latestNotification$ = this.notificationSubject$.asObservable().pipe(
    distinctUntilChanged(),
    shareReplay(NOTIFICATIONS_MAX_ITEMS)
  );

  public readonly notificationHistory$ = this.latestNotification$.pipe(
    scan((acc, item) => [item, ...acc], INITIAL_MSG_LIST),
    startWith(INITIAL_MSG_LIST),
    map(items => items
      .slice(0, NOTIFICATIONS_MAX_ITEMS - 1)
      .filter(notif => notif.timestamp + notif.durationInMillis > Date.now())),
    shareReplay(NOTIFICATIONS_MAX_ITEMS)
  );

  private updateSubject = new BehaviorSubject<number>(1);
  private updateAction$ = this.updateSubject.asObservable().pipe(
    startWith(1),
    shareReplay(1)
  );

  public readonly notifications$ = combineLatest([
    this.notificationHistory$,
    this.updateAction$
  ]).pipe(
    map(([history, _]) =>
      history.map(notif => ({ ...notif, durationInMillis: notif.durationInMillis - 1000 }) as NotificationMessage)
        .filter(notif => notif.timestamp + notif.durationInMillis > Date.now())
    ),
    shareReplay(NOTIFICATIONS_MAX_ITEMS)
  );


  private timedSrc$ = timer(0, 1000).pipe(
    startWith(0),
    tap(_ => this.updateSubject.next(1000)),
    shareReplay(1)
  );

  constructor() {
    this.subscriptions.push(this.timedSrc$.subscribe());
  }

  public emit(notification: NotificationMessage) {
    this.notificationSubject$.next(notification);
  }

  public emitMessage(message: string) {
    this.notificationSubject$.next({
      message,
      timestamp: Date.now(),
      durationInMillis: 5000
    } as NotificationMessage);
  }

  public show(message: string, options?: {}) {
    this.emitMessage(message);
  }



  private subscriptions: Subscription[] = [];

  ngOnDestroy(): void {
    // unsubscribe from all subscriptions
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });
  }
}