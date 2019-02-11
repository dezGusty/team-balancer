import { Component, OnInit } from '@angular/core';
import { Player } from '../shared/player.model';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [
    new Player(1, 'johny'),
    new Player(2, 'gus'),
    new Player(3, 'iulian'),
    new Player(4, 'mircea')
  ];
  constructor() { }

  ngOnInit() {

  }

  public canAddPlayers(): boolean {
    return true;
  }
}
