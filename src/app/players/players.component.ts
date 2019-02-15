import { Component, OnInit } from '@angular/core';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css'],
  providers: [PlayersService]
})
export class PlayersComponent implements OnInit {
  players: Player[];
  selectedPlayer: Player;

  constructor(private playersSvc: PlayersService) {
    this.selectedPlayer = null;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();
    this.playersSvc.playerSelected
      .subscribe(
        (player: Player) => {
          console.log('selected: ' + player.name);
          this.selectedPlayer = player;
        }
      );
  }

  public canAddPlayers(): boolean {
    return true;
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }
}
