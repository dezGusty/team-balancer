import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Player, getDisplayName } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';
import { AuthService } from 'src/app/auth/auth.service';
import { AuthAltService } from 'src/app/auth/auth-alt.service';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styles: ['']
})
export class PlayerDetailsComponent implements OnInit {
  player: Player;
  id: number;

  constructor(
    private authSvc: AuthService,
    private authAltSvc: AuthAltService,
    private playersSvc: PlayersService,
    private router: Router,
    private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.id = +params.id;
        const auxPlayer = this.playersSvc.getPlayerById(this.id);
        if (null == auxPlayer) {
          // trigger a reroute?
          console.warn('[player details] invalid id:' + this.id);
          this.router.navigate(['..'], { relativeTo: this.route });
          return;
        } else {
          this.player = auxPlayer;
        }
      }
    );
  }

  public canEditPlayers(): boolean {
    return this.authAltSvc.isAuthenticatedAsOrganizer();
  }

  public canArchivePlayer(): boolean {
    return this.authAltSvc.isAuthenticatedAsOrganizer() && (!this.player.isArchived);
  }

  public canUnarchivePlayer(): boolean {
    return this.authAltSvc.isAuthenticatedAsOrganizer() && this.player.isArchived;
  }

  public onEditPlayerClicked($event): void {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }

  public onArchivePlayer($event): void {
    this.playersSvc.movePlayerToArchive(this.player);
  }

  public onUnarchivePlayer($event): void {
    this.playersSvc.pullPlayerFromArchive(this.player);
  }

  public playerDisplayName(): string {
    return getDisplayName(this.player);
  }
}
