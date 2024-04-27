import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, computed, effect, inject, input, model, viewChild } from '@angular/core';
import { MatchDateTitle } from '../history/match-date-title';
import { GameEventsService } from '../history/data-access/game-events.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, combineLatest, combineLatestAll, concat, concatAll, concatMap, filter, forkJoin, from, map, mergeAll, mergeMap, of, scan, shareReplay, startWith, switchMap, tap, withLatestFrom } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { AsyncPipe } from '@angular/common';
import { GameEventDBData, GameEventData } from '../history/data-access/create-game-request.model';
import { PlayersService } from 'src/app/shared/players.service';
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { Result } from '../history/result';

export interface TransposeData {
  header: string[];
  players: string[][];
}

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  @Output() onCloseBtnClicked = new EventEmitter<void>();
  private gameEventsService: GameEventsService = inject(GameEventsService);
  private firestore: Firestore = inject(Firestore);
  private playersService: PlayersService = inject(PlayersService);

  onSideNavInnerContainerClicked(event: Event) {
    event.stopPropagation();
  }

  onCloseBtnClick() {
    this.onCloseBtnClicked.emit();
  }

  private readonly players$ = this.playersService.players$;

  tab1 = viewChild<ElementRef>('tab1');

  availableEvents = input.required<MatchDateTitle[]>();

  private readonly availableEvents$ = toObservable(this.availableEvents).pipe(
    tap(data => console.log("availableEvents", data)),
    shareReplay(1),
  );


  activeMatchContents$ = this.availableEvents$.pipe(
    tap(data => console.log("*** 1", data)),
    mergeMap(matches => matches.map(match => this.gameEventsService.getMatchData(match))),
    tap(data => console.log("*** 2", data)),
    // 
    // concatMap(data => data),
    // combineLatestAll(),
    // tap(data => console.log("*** 2", data)),
    // concatMap(data => data),
    
    mergeAll(),
    tap(data => console.log("*** 3", data)),
    scan((matches, match) => [...matches, match], [] as GameEventDBData[]),
    // tap(data => console.log("*** 4", data)),
    shareReplay(1),
  );

  activeMatchPlus$ = this.activeMatchContents$.pipe(
    withLatestFrom(this.players$),
    map(([gameEventDBData, players]) => gameEventDBData.map(singleGame => {
      try {
        console.log("** singleGame", singleGame);
        let result: GameEventData = {
          appliedRandomization: false,
          matchDate: singleGame.matchDate,
          name: singleGame.name,
          label: MatchDateTitle.fromString(singleGame.name).suffix ?? "",
          registeredPlayers: singleGame.registeredPlayerIds.map(id => {
            return {
              id: id,
              name: getDisplayName(players.find(p => p.id === id) ?? Player.EMPTY),
              stars: players.find(p => p.id === id)?.stars ?? 0,
            };
          })
        };
        return result;
      } catch (err) {
        console.warn("read game event encountered issue");
        // this.notificationService.show("Failed to read game event");
      }
      return GameEventData.DEFAULT;
    })),
    tap(data => console.log("*** 5", data)),
  );

  protected readonly activeMatchesSig = toSignal(this.activeMatchPlus$, { initialValue: [] });


  // Active matches sig will contain the list of active matches.
  // We need to transpose the data to be able to display it in the table.
  public readonly transposedSignal = computed(() => {
    let header: string[] = [];
    let lines: string[][] = [];

    const localMatches = this.activeMatchesSig();

    localMatches.forEach(match => {
      let cells: string[] = [];
      const sysNewline = String.fromCharCode(0x000A);
      header.push(match.matchDate + sysNewline + match.label);
      match.registeredPlayers.forEach(player => {
        cells.push(player.name + ' ' + (player.stars > 0 ? '⭐' : ''));
      });
      lines.push(cells);
    });

    if (lines.length > 0) {
      lines = lines[0].map((col, c) => lines.map((row, r) => lines[r][c]));
    }

    return { header, players: lines } as TransposeData;
  });



  selectTable() {
    const el = this.tab1()?.nativeElement;

    let range: Range;
    let sel: Selection | null;
    if (document.createRange && window.getSelection) {
      range = document.createRange();
      sel = window.getSelection();
      if (!sel) {
        return;
      }
      sel.removeAllRanges();
      try {
        range.selectNodeContents(el);
        sel.addRange(range);
      } catch (e) {
        range.selectNode(el);
        sel.addRange(range);
      }
    }
  }

  onCopyBtnClick() {
    this.selectTable();
    // TODO(Augustin Preda, 2024-04-22): Use the Clipboard API when it is available in all browsers.
    document.execCommand('copy');
  }
}
