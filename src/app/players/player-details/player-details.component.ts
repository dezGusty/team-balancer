import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Player, getDisplayName } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';
import { AuthService } from 'src/app/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-player-details',
  standalone: true,
  styles: [''],
  templateUrl: './player-details.component.html',
})
export class PlayerDetailsComponent implements OnInit {
  player: Player | undefined;
  id: number = 0;

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private router: Router,
    private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.id = +params['id'];
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
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canArchivePlayer(): boolean {
    if (!this.player) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && (!this.player.isArchived);
  }

  public canUnarchivePlayer(): boolean {
    if (!this.player) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && this.player.isArchived;
  }

  public onEditPlayerClicked($event: any): void {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }

  public onArchivePlayer($event: any): void {
    if (!this.player) {
      return;
    }
    this.playersSvc.movePlayerToArchive(this.player);
  }

  public onUnarchivePlayer($event: any): void {
    if (!this.player) {
      return;
    }
    this.playersSvc.pullPlayerFromArchive(this.player);
  }

  public playerDisplayName(): string {
    if (!this.player) {
      return '';
    }
    return getDisplayName(this.player);
  }
}
