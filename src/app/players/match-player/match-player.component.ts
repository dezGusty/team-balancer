import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-match-player',
  templateUrl: './match-player.component.html',
  styleUrls: ['./match-player.component.css']
})
export class MatchPlayerComponent implements OnInit {
  @Input() player: Player;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  onClicked($event) {
    this.playerSelected.emit(this.player);
  }
}
