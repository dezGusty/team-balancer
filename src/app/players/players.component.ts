import { Component, OnInit } from '@angular/core';
import { PlayerComponent } from './player/player.component';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit {
  public players: PlayerComponent[];
  constructor() { }

  ngOnInit() {

    this.players = new Array<PlayerComponent>();
    this.players.push(new PlayerComponent(1, 'joe'));
    this.players.push(new PlayerComponent(2, 'joe2'));
    this.players.push(new PlayerComponent(3, 'joe3'));
    this.players.push(new PlayerComponent(4, 'joe4'));
  }

  public canAddPlayers(): boolean {
    return true;
  }
}
