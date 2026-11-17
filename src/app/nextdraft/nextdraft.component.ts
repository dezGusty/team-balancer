import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DraftSelectionService } from './data-access/draft-selection.service';
import { NotificationService } from '../utils/notification/notification.service';
import { CurrentPlayersService } from './data-access/current-players.service';
import { PlayerCardComponent } from "../player-card/player-card.component";
import { Player } from '../shared/player.model';
import { BehaviorSubject, Subject, combineLatest, firstValueFrom, map, scan, shareReplay, startWith, switchMap, tap, withLatestFrom } from 'rxjs';
import { exportPlayersToJsonFile } from './export-players';
import { Router } from '@angular/router';
import { DraftService } from '../shared/draft.service';

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
  selector: 'app-draft',
    changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nextdraft.component.html',
  styleUrl: './nextdraft.component.css',
    imports: [CommonModule, FormsModule, PlayerCardComponent]
})
export class NextDraftComponent {

  public customClipboardText = '';

  actionSubject$ = new Subject<PlayerDraftAction>();
  action$ = this.actionSubject$.asObservable().pipe(
    tap(x => console.log("*** action", x)),
  );

  nextMatchDraft$ = this.draftService.nextMatchDraft$.pipe(
    switchMap(initialDraft =>
      this.action$.pipe(
        startWith({ action: DraftAction.None, player: null! }),
        scan((draftData, action) => {
          switch (action.action) {
            case DraftAction.AddPlayer:
              if (draftData.players.some(p => p.id === action.player.id)) {
                return draftData;
              }
              return { ...draftData, players: [...draftData.players, action.player] };
            case DraftAction.RemovePlayer:
              return {
                ...draftData,
                players: draftData.players.filter(p => p.id !== action.player.id),
              };
            case DraftAction.RemoveAllPlayers:
              return { ...draftData, players: [] };
            default:
              return draftData;
          }
        }, { ...initialDraft, players: [...(initialDraft?.players ?? [])] })
      )
    ),
    shareReplay(1)
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
      const playersById = new Map(playersData.players.map(player => [player.id, player]));
      const selectedPlayers = draftData.players
        .map(draftPlayer => playersById.get(draftPlayer.id))
        .filter((player): player is Player => player !== undefined);
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

  copyToClipboardSubject$ = new Subject<void>();
  copyToClipboard$ = this.copyToClipboardSubject$.asObservable().pipe(
    withLatestFrom(this.selectedPlayersData$),
    tap(([_, selectedPlayersData]) => {
      this.customClipboardText = this.draftService.getDraftPlainTextFormat(selectedPlayersData.players);
      navigator['clipboard'].writeText(this.customClipboardText);
      this.notificationService.emitMessage('Copied to clipboard:' + this.customClipboardText);
    }),
  );

  exportToJsonSubject$ = new Subject<void>();
  exportToJson$ = this.exportToJsonSubject$.asObservable().pipe(
    withLatestFrom(this.selectedPlayersData$),
    tap(([_, selectedPlayersData]) => {
      exportPlayersToJsonFile(selectedPlayersData.players);
      this.notificationService.emitMessage(`Exported ${selectedPlayersData.players.length} players to JSON file.`);
    }),
  );


  @ViewChild('srcNameArea') srcNameArea: ElementRef | undefined;
  constructor(
    private draftService: DraftSelectionService,
    private playersService: CurrentPlayersService,
    private notificationService: NotificationService,
    private sharedDraftSvc: DraftService,
    private router: Router) {
  }

  searchedName: string = '';
  @HostListener('window:keydown.control./', ['$event'])
  startSearching(event: Event) {
    setTimeout(() => { // this will make the execution after the above boolean has changed
      this.srcNameArea?.nativeElement.focus();
    }, 0);
  }

  onClearListClicked() {
    this.actionSubject$.next({ action: DraftAction.RemoveAllPlayers, player: null! });
  }

  onReloadClicked() {
    this.actionSubject$.next({ action: DraftAction.None, player: null! });
    this.draftService.triggerDataRetrieval$.next(true);
    this.playersService.triggerDataRetrieval$.next(true);
  }

  onSaveSelectionClicked() {
    this.uploadDataSubject$.next();
    // this.showLoading = true;
    // await this.draftSvc.saveSelectedPlayerListAsync(this.selectedPlayerList);
    // this.showLoading = false;
  }

  onCopyClicked() {
    this.copyToClipboardSubject$.next();
    // this.customClipTextToClip = this.draftService.getDraftPlainTextFormat(this.selectedPlayerList);
    // this.toastSvc.showWithHeader('Copied to clipboard.', this.customClipText);
  }

  onExportToJsonClicked() {
    this.exportToJsonSubject$.next();
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

  async onMatchUpClicked() {
    console.log('[draft] creating match from draft ...');
    const { players } = await firstValueFrom(this.selectedPlayersData$);
    this.sharedDraftSvc.storePlayersInMemoryOnly(players);
    this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  /**
   * Use a match with only the top 12 (if 12 or more players available) or the top 10 players (if 10 or 11 players are available).
   */
  async onMatchUpTopClicked() {
    console.log('[draft] filtering to top 12/10 players and creating match from draft ...');
    const { players } = await firstValueFrom(this.selectedPlayersData$);

    if (players.length < 10) {
      this.notificationService.emitMessage(`Insufficient players: cannot use this functionality with only ${players.length} players.`);
      return;
    }

    const topPlayers = players.length >= 12 ? players.slice(0, 12) : players.slice(0, 10);
    this.sharedDraftSvc.storePlayersInMemoryOnly(topPlayers);
    this.router.navigate(['/custom'], { queryParams: { draft: true } });
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
