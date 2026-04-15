import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Player, filterPlayerArray, getDisplayName } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserAuthService } from '../auth/user-auth.service';
import { CommonModule } from '@angular/common';
import { SmallLoadingSpinnerComponent } from '../ui/small-loading-spinner/small-loading-spinner.component';
import { FormsModule } from '@angular/forms';
import { PlayerDetailsNewComponent } from "./player-details-new/player-details-new.component";
import { NotificationService } from '../utils/notification/notification.service';

@Component({
  selector: 'app-players',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './players.component.css',
  templateUrl: './players.component.html',
  imports: [
    CommonModule,
    RouterModule,
    SmallLoadingSpinnerComponent,
    FormsModule,
    PlayerDetailsNewComponent
  ]
})
export class PlayersComponent {
  private readonly playersSvc = inject(PlayersService);
  private readonly authSvc = inject(UserAuthService);
  private readonly notificationSvc = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly showLoadingSig = signal(true);
  protected readonly selectedPlayerSig = signal<Player | undefined>(undefined);
  protected readonly isSideNavOpenSig = signal(false);
  protected readonly sortColumnSig = signal<'id' | 'name' | 'displayName' | 'rating' | 'recent' | null>(null);
  protected readonly sortDirectionSig = signal<'asc' | 'desc'>('asc');

  // Signal-backed properties for ngModel two-way binding
  private readonly loadArchiveSig = signal(false);
  get loadArchive() { return this.loadArchiveSig(); }
  set loadArchive(val: boolean) { this.loadArchiveSig.set(val); }

  private readonly searchedNameSig = signal('');
  get searchedName() { return this.searchedNameSig(); }
  set searchedName(val: string) { this.searchedNameSig.set(val); }

  private readonly playerChangeSig = toSignal(
    this.playersSvc.playerDataChangeEvent,
    { initialValue: undefined }
  );

  private readonly allPlayersSig = computed(() => {
    const info = this.playerChangeSig();
    if (!info?.players) return [];
    return this.playersSvc.getPlayers(this.loadArchiveSig());
  });

  readonly sortedFilteredPlayers = computed(() => {
    let players = this.allPlayersSig();
    const search = this.searchedNameSig();
    if (search) players = filterPlayerArray(players, search);
    const col = this.sortColumnSig();
    const dir = this.sortDirectionSig();
    if (!col) return players;
    return [...players].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (col === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else if (col === 'displayName') {
        aVal = getDisplayName(a).toLowerCase();
        bVal = getDisplayName(b).toLowerCase();
      } else if (col === 'rating') {
        aVal = a.rating;
        bVal = b.rating;
      } else if (col === 'recent') {
        aVal = a.mostRecentMatches?.at(-1)?.date ?? '';
        bVal = b.mostRecentMatches?.at(-1)?.date ?? '';
      } else {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }
      if (aVal < bVal) return dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  constructor() {
    effect(() => {
      const info = this.playerChangeSig();
      if (!info) return;
      if (!info.players) {
        if (info.messageType === 'loading') this.showLoadingSig.set(true);
        return;
      }
      this.showLoadingSig.set(false);
      this.notificationSvc.show('Reloaded all players from service. \n'
        + info.messageType + '\n' + info.messagePayload);
    });
  }

  canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  onNewPlayerClicked($event: any): void {
    const newPlayer = this.playersSvc.createDefaultPlayer();
    this.selectedPlayerSig.set(newPlayer);
    this.isSideNavOpenSig.set(true);
  }

  onLoadArchiveChange(val: boolean): void {
    this.notificationSvc.show(val ? 'Including archived players' : 'Excluding archived players');
  }

  onPlayerSelected(player: Player) {
    this.selectedPlayerSig.set(player);
    this.isSideNavOpenSig.set(true);
  }

  onSideNavOuterContainerClicked() {
    this.isSideNavOpenSig.set(false);
  }

  onCloseSideNavBtnClick() {
    this.isSideNavOpenSig.set(false);
  }

  onMovePlayerToArchive(player?: Player) {
    if (!player) return;
    this.playersSvc.movePlayerToArchive(player);
    this.isSideNavOpenSig.set(false);
  }

  onMovePlayerToActive(player?: Player) {
    if (!player) return;
    this.playersSvc.pullPlayerFromArchive(player);
    this.isSideNavOpenSig.set(false);
  }

  onSortBy(col: 'id' | 'name' | 'displayName' | 'rating' | 'recent') {
    if (this.sortColumnSig() === col) {
      this.sortDirectionSig.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumnSig.set(col);
      this.sortDirectionSig.set('asc');
    }
  }

  sortIndicator(col: 'id' | 'name' | 'displayName' | 'rating' | 'recent'): string {
    if (this.sortColumnSig() !== col) return '';
    return this.sortDirectionSig() === 'asc' ? ' ▲' : ' ▼';
  }

  getDisplayName(player: Player): string {
    return getDisplayName(player);
  }

  getRecentMatches(player: Player): Array<{ date: string; diff: number }> {
    return player.mostRecentMatches?.slice(0, 8).reverse() || [];
  }

  getMatchIcon(match: { date: string; diff: number }): string {
    if (match.diff > 0.1) return '⬆️';
    if (match.diff > 0) return '↗️';
    if (match.diff === 0) return '➡️';
    if (match.diff < -0.1) return '⬇️';
    return '↘️';
  }

  getMatchClass(match: { date: string; diff: number }): string {
    if (match.diff > 0.1) return 'player-card-recent-matches player-card-recent-matches-very-good';
    if (match.diff > 0) return 'player-card-recent-matches player-card-recent-matches-good';
    if (match.diff === 0) return 'player-card-recent-matches player-card-recent-matches-neutral';
    if (match.diff < -0.1) return 'player-card-recent-matches player-card-recent-matches-very-bad';
    return 'player-card-recent-matches player-card-recent-matches-bad';
  }
}
