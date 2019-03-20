import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player, getDisplayName } from '../shared/player.model';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css']
})
export class PlayerCardComponent implements OnInit {
  @Input() player: Player;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  // public playerDisplayName(): string {
  //   return getDisplayName(this.player);
  // }

  onClicked($event) {
    this.playerSelected.emit(this.player);
  }
}
