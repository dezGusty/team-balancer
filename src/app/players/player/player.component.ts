import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  playerId = -1;
  playerName = 'anonymous';
  constructor() { }

  ngOnInit() {
  }

}
