import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, map, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { DraftChangeInfo } from 'src/app/shared/draft-change-info';
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { SettingsService } from 'src/app/shared/settings.service';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';

export interface DraftSelectionData {
  players: Player[];
}

@Injectable({
  providedIn: 'root'
})
export class DraftSelectionService implements OnDestroy {

  triggerDataRetrieval$ = new BehaviorSubject<boolean>(true);

  public nextMatchDraft$ = this.triggerDataRetrieval$.asObservable().pipe(
    switchMap(_ => {
      this.loadingFlagService.setLoadingFlag(true, "next-match-draft");
      return docData(doc(this.firestore, 'drafts/next'))
    }),
    map(nextMatchesDocContents => {
      const playerList = nextMatchesDocContents as DraftSelectionData;
      return playerList;
    }),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false, "next-match-draft"); }),
    catchError(this.handleError),
    shareReplay(1),
  );

  public triggerStoreMatchSubject$ = new Subject<DraftSelectionData>();
  public storedMatch$ = this.triggerStoreMatchSubject$.asObservable().pipe(
    tap(data => console.log("*** upload data ", data)),
    switchMap(data => {
      this.loadingFlagService.setLoadingFlag(true, "store-match");
      return setDoc(doc(this.firestore, 'drafts/next'), data, { merge: true });
    }),
    tap(data => console.log("*** upload data result", data)),
    tap((_) => { this.loadingFlagService.setLoadingFlag(false, "store-match"); }),
  );

  constructor(
    private firestore: Firestore,
    private loadingFlagService: LoadingFlagService,
    private settingsSvc: SettingsService) {
    this.subscriptions.push(this.storedMatch$.subscribe());
  }

  private subscriptions: Subscription[] = [];
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  // saveDraftToFirebase(draftData: DraftSelectionData) {
  //   // Emit an event to signal that the app is fetching / loading data
  //   const obj = { players: draftData.players };
  //   return setDoc(doc(this.firestore, '/drafts/next'), obj, { merge: true });
  // }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }

  public getDraftPrettyPrinted(players: Player[], newline: string): string {
    let plainText = 'Main line-up ⚽' + newline;
    plainText += '---------------' + newline
    players.slice(0, this.settingsSvc.getPreferredPlayerCount()).forEach((player, index) => {
      plainText += '' + (index + 1) + '. ' + getDisplayName(player) + newline;
    });

    let reservesArray = players.slice(this.settingsSvc.getPreferredPlayerCount());
    if (reservesArray.length > 0) {
      plainText += newline + 'Reserves 💺' + newline;
      plainText += '---------------' + newline;
      reservesArray.forEach((player, index) => {
        plainText += '' + (index + 1) + '. ' + getDisplayName(player) + newline;
      })
    }
    return plainText;
  }

  public getDraftPlainTextFormat(players: Player[]): string {
    return this.getDraftPrettyPrinted(players, '\r\n');
  }
}
