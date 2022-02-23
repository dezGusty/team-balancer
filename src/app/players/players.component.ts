import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, filterPlayerArray } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MatchService } from '../shared/match.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { RatingSystem } from '../shared/rating-system';
import { ToastService } from '../shared/toasts-service';
import { PlayerChangeInfo } from '../shared/player-changed-info';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styles: ['']
})

export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;

  private subscriptions: Subscription[] = [];
  public loadArchive: boolean = false;

  searchedName = '';
  loadingConvert = -1;

  ratingHistory: Map<string, Player[]>;
  matchHistory: Map<string, CustomPrevGame>;
  ratingScale: RatingSystem;

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private toastSvc: ToastService,
    private router: Router,
    private route: ActivatedRoute) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers(this.loadArchive);
    this.subscriptions.push(this.playersSvc.playerDataChangeEvent
      .subscribe(
        (playerChangeInfo: PlayerChangeInfo) => {
          if (null === playerChangeInfo) {
            console.warn('null playerchange info received');
            return;
          }
          this.players = this.playersSvc.getPlayers(this.loadArchive);
          this.toastSvc.show('Reloaded all players from service. \n'
            + playerChangeInfo.messageType + '\n'
            + playerChangeInfo.messagePayload);
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });

  }

  public canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }

  public onNewPlayerClicked($event): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  public onSavePlayerClicked($event): void {
    this.playersSvc.saveAllPlayers();
  }

  onSearchContentChange($event) {
    // try to apply the target value.
    const filteredPlayers = filterPlayerArray(this.players, $event.target.value);
    if (filteredPlayers.length === 1) {
      // show special marker?
    }
  }

  onCheckReload($event) {
    this.loadArchive = !this.loadArchive;
    this.players = this.playersSvc.getPlayers(this.loadArchive);
  }
}
