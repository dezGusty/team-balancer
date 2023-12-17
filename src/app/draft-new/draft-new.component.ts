import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CopyClipboardDirective } from '../shared/copy-clipboard.directive';
import { DraftService } from '../shared/draft.service';
import { DraftSelectionService } from './data-access/draft-selection.service';
import { NotificationService } from '../utils/notification/notification.service';
import { CurrentPlayersData, CurrentPlayersService } from './data-access/current-players.service';
import { PlayerCardComponent } from "../player-card/player-card.component";
import { Player } from '../shared/player.model';
import { BehaviorSubject, Subject, combineLatest, map, shareReplay, startWith, switchMap, tap, withLatestFrom } from 'rxjs';

export enum DraftAction {
  None = 0,
  AddPlayer = 1,
  RemovePlayer = 2,
  RemoveAllPlayers = 3,
}

export class PlayerDraftAction {
  constructor(public action: DraftAction, public player: Player) { }
}

@Component({
  selector: 'app-draft-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: './draft-new.component.html',
  styleUrl: './draft-new.component.css',
  imports: [CommonModule, FormsModule, PlayerCardComponent]
})
export class DraftNewComponent {


  // TODO: combine with add player / remove player, remove all
  actionSubject$ = new BehaviorSubject<PlayerDraftAction>({ action: DraftAction.None, player: null! });
  action$ = this.actionSubject$.asObservable().pipe(
    tap(x => console.log("*** action", x)),
    shareReplay(1)
  );

  nextMatchDraft$ = combineLatest([this.draftService.nextMatchDraft$, this.action$]).pipe(
    map(([draftData, action]) => {
      switch (action.action) {
        case DraftAction.AddPlayer:
          draftData.players.push(action.player);
          break;
        case DraftAction.RemovePlayer:
          draftData.players = draftData.players.filter(p => p.id !== action.player.id);
          break;
        case DraftAction.RemoveAllPlayers:
          draftData.players = [];
          break;
      }
      return draftData;
    }),
  );

  filterByContentSubject$ = new BehaviorSubject<string>('');
  filterByContent$ = this.filterByContentSubject$.asObservable().pipe(
    tap(x => console.log("*** filter by content", x)),
    shareReplay(1)
  );

  uploadDataSubject$ = new Subject<void>();
  uploadData$ = this.uploadDataSubject$.asObservable().pipe(
    tap(data => { console.log("*** upload data", data); }),
    withLatestFrom(this.nextMatchDraft$),
    tap(([_, draftData]) => {
      return this.draftService.triggerStoreMatchSubject$.next(draftData);
    }),
  );

  playersData$ = this.playersService.currentPlayers$.pipe(
    shareReplay(1)
  );

  selectedPlayersData$ = combineLatest([this.playersData$, this.nextMatchDraft$]).pipe(
    map(([playersData, draftData]) => {
      const selectedPlayers = playersData.players.filter(
        draftPl => draftData.players.findIndex(p => draftPl.id == p.id) != -1);
      return { players: selectedPlayers, label: playersData.label, version: playersData.version };
    }),
    tap(x => console.log("*** selected players data", x)),
    shareReplay(1)
  );

  availablePlayersData$ = combineLatest([this.playersData$, this.nextMatchDraft$]).pipe(
    map(([playersData, draftData]) => {
      const selectedPlayers = playersData.players.filter(
        draftPl => draftData.players.findIndex(p => draftPl.id == p.id) == -1);
      return { players: selectedPlayers, label: playersData.label, version: playersData.version };
    }),
    tap(x => console.log("*** available players data", x)),
    shareReplay(1)
  );

  filteredAvailablePlayersData$ = combineLatest([this.availablePlayersData$, this.filterByContent$]).pipe(
    map(([playersData, filterByContent]) => {
      if (filterByContent === '') {
        return playersData;
      }

      return {
        players: playersData.players.filter(p => p.name.toLowerCase().includes(filterByContent.toLowerCase())),
        label: playersData.label,
        version: playersData.version
      };
    }),
    tap(x => console.log("*** filtered players data", x)),
  );


  @ViewChild('srcNameArea') srcNameArea: ElementRef | undefined;
  constructor(
    private draftService: DraftSelectionService,
    private playersService: CurrentPlayersService,
    private notificationService: NotificationService) {
  }

  searchedName: string = '';
  @HostListener('window:keydown.control./', ['$event'])
  startSearching(event: KeyboardEvent) {
    setTimeout(() => { // this will make the execution after the above boolean has changed
      this.srcNameArea?.nativeElement.focus();
    }, 0);
  }

  onClearListClicked() {
    this.actionSubject$.next({ action: DraftAction.RemoveAllPlayers, player: null! });
  }

  onSaveSelectionClicked() {
    this.uploadDataSubject$.next();
    // this.showLoading = true;
    // await this.draftSvc.saveSelectedPlayerListAsync(this.selectedPlayerList);
    // this.showLoading = false;
  }

  onCopyClicked() {
    // this.customClipText = this.draftSvc.getDraftPlainTextFormat(this.selectedPlayerList);
    // this.toastSvc.showWithHeader('Copied to clipboard.', this.customClipText);
  }

  getDraftPlainTextFormat(): string {
    return "blabla";
    // return this.draftSvc.getDraftPlainTextFormat(this.selectedPlayerList);
  }

  customClipTextToClip(): string {
    return "";
    // this.customClipText = this.getDraftPlainTextFormat();
    // return this.customClipText;
  }

  public canChangePlayersInDraft(): boolean {
    return true;
    // return this.authSvc.isAuthenticatedAsOrganizer();
  }

  onSearchContentChange($event: any) {
    if ($event.code === 'Enter') {
      // try to apply the target value.
      this.filterByContentSubject$.next($event.target.value);
    } else {
      this.filterByContentSubject$.next($event.target.value);
    }
  }

  onMatchUpClicked() {
    console.log('[draft] creating match from draft ...');
    // this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList);
    // this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  /**
   * Use a match with only the top 12 (if 12 or more players available) or the top 10 players (if 10 or 11 players are available).
   */
  onMatchUpTopClicked() {
    console.log('[draft] filtering to top 12/10 players and creating match from draft ...');

    // if (this.selectedPlayerList.length < 10) {
    //   // Cannot use this functionaliry
    //   this.toastSvc.showWithHeader('Insufficient players', `Cannot use this functionality with only ${this.selectedPlayerList.length} players.`);
    //   return;
    // }

    // if (this.selectedPlayerList.length >= 12) {
    //   // limit to 12
    //   this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList.slice(0, 12));
    // }
    // else {
    //   // limit to 10
    //   this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList.slice(0, 10));
    // }
    // this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  onAvailablePlayerClicked($event: any, player: Player) {
    console.log("available player clicked", $event, player);
    this.actionSubject$.next({ action: DraftAction.AddPlayer, player: player });
  }

  onDraftedPlayerClicked($event: any, player: Player) {
    console.log("drafter player clicked", $event, player);
    this.actionSubject$.next({ action: DraftAction.RemovePlayer, player: player });
  }
}
