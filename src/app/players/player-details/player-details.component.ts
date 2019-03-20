import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Player } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.css']
})
export class PlayerDetailsComponent implements OnInit {
  player: Player;
  id: number;

  constructor(
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

  public canEditPlayer(): boolean {
    return true;
  }

}
