import { Component, OnInit } from '@angular/core';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  playerInfo: Player;
  constructor() {
  }

  ngOnInit() {
  }

}
