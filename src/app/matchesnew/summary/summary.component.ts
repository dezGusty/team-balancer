import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { MatchDateTitle } from '../history/match-date-title';
import { GameEventsService } from '../history/data-access/game-events.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, forkJoin, map, shareReplay, switchMap, tap, withLatestFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { GameEventData } from '../history/data-access/create-game-request.model';
import { PlayersService } from 'src/app/shared/players.service';
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { NotificationService } from 'src/app/utils/notification/notification.service';

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent {
  @Output() onCloseBtnClicked = new EventEmitter<void>();
  private gameEventsService: GameEventsService = inject(GameEventsService);
  private notificationService = inject(NotificationService);
  private playersService: PlayersService = inject(PlayersService);

  onSideNavInnerContainerClicked(event: Event) {
    event.stopPropagation();
  }

  onCloseBtnClick() {
    this.onCloseBtnClicked.emit();
  }

  private readonly players$ = this.playersService.players$;

  availableEvents = input.required<MatchDateTitle[]>();

  private readonly availableEvents$ = toObservable(this.availableEvents).pipe(
    tap(data => console.log("availableEvents", data)),
    shareReplay(1),
  );

  private readonly triggerReload$ = this.gameEventsService.updatedFireData$.pipe();


  activeMatchContents$ = combineLatest([this.availableEvents$, this.triggerReload$]).pipe(
    map(([events, _]) => events),
    switchMap(matches =>
      forkJoin(matches.map(match => this.gameEventsService.getMatchData(match))).pipe(
        tap(data => console.log("forkJoin", data),
        )
      )
    ),
    shareReplay(1),
  );

  activeMatchPlus$ = this.activeMatchContents$.pipe(
    withLatestFrom(this.players$),
    map(([gameEventDBData, players]) => gameEventDBData.map(singleGame => {
      try {
        let result: GameEventData = {
          appliedRandomization: false,
          matchDate: singleGame.matchDate,
          name: singleGame.name,
          label: MatchDateTitle.fromString(singleGame.name).suffix ?? "",
          registeredPlayers: singleGame.registeredPlayerIds.map((id, index) => {
            return {
              id: id,
              name: getDisplayName(players.find(p => p.id === id) ?? Player.EMPTY),
              stars: players.find(p => p.id === id)?.stars ?? 0,
              reserve: singleGame.playerReserveStatus ? singleGame.playerReserveStatus[index] ?? false : false
            };
          })
        };
        console.log("activeMatchPlus$", result);
        return result;
      } catch (err) {
        console.warn("read game event encountered issue");
        // this.notificationService.show("Failed to read game event");
      }
      return GameEventData.DEFAULT;
    })),
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
      const sysNewline = '\n';
      header.push('📅' + match.matchDate + ' ' + sysNewline + '🕒' + match.label);
      match.registeredPlayers.forEach(player => {
        cells.push(
          player.name + ' ' + (player.stars > 0 ? '⭐' : '') + (player.reserve ? ' (rez.)' : '')
        );
      });
      lines.push(cells);
    });

    // Ensure all lines have the same length.
    const maxLineSize = Math.max(...lines.map(line => line.length));
    lines = lines.map(line => {
      while (line.length < maxLineSize) {
        line.push('');
      }
      return line;
    });

    // Transpose the data.
    if (lines.length > 0) {
      lines = lines[0].map((col, c) => lines.map((row, r) => lines[r][c]));
    }

    return { header, players: lines } as TransposeData;
  });

  private createTableInMemory(): string {
    const dataSource = this.transposedSignal();
    var headersContent = '';
    headersContent += `<th style="border-right: 1px solid">##</th>`;
    dataSource.header.forEach(element => {
      headersContent += `<th style="border-right: 1px solid">${element}</th>`
    });
    var rowsContent = '';
    dataSource.players.forEach((playerLines, index) => {
      var rowContent = `<tr><td style="border: 1px solid">${index + 1}</td>`;
      playerLines.forEach(player => {
        rowContent += `<td style="border: 1px solid">${player ?? ""}</td>`;
      });
      rowContent += '</tr>';
      rowsContent += rowContent;
    });
    var result = `<table style="border: 1px solid;" #tab1>
    <thead style="background-color: darkgray;">
      <tr>
        ${headersContent}
      </tr>
    </thead>
    <tbody>
      ${rowsContent}
    </tbody>
  </table>`
    return result;
  }

  onCopyWithAPIBtnClick() {
    const value = this.createTableInMemory();
    console.log("*** value", value);
    const spreadSheetRow = new Blob([value], { type: 'text/html' });

    // Check if ClipboardItem is defined
    if (!navigator.clipboard || !navigator.clipboard.write || !ClipboardItem) {
      console.warn('Clipboard API not available');
      this.notificationService.show('Clipboard API not available');
      return;
    }

    // if (ClipboardItem)
    navigator.clipboard.write([new ClipboardItem({ [spreadSheetRow.type]: spreadSheetRow })])
    .then(() => {
      this.notificationService.show('Table copied to clipboard');
    })
    .catch(err => {
      this.notificationService.show('Failed to copy table to clipboard');
    });
  }

  onCopyAsTextClick() {
    const localMatches = this.activeMatchesSig();
    let result = '';
    localMatches.forEach(match => {
      result += '📅' + match.matchDate + ' ' + '🕒' + match.label + '\n';
      match.registeredPlayers.forEach((player, index) => {
        result += '' + (index + 1) + '. ' 
          + player.name + ' ' 
          + (player.stars > 0 ? '⭐' : '') 
          + (player.reserve ? ' (rez.)' : '')
          + '\n';
      });
      result += '\n';
    });

    navigator.clipboard.writeText(result)
    .then(() => {
      this.notificationService.show('Table copied to clipboard');
    })
    .catch(err => {
      this.notificationService.show('Failed to copy table to clipboard');
    });
  }
}
