import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '../shared/player.model';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styles: ['']
})
export class PlayerCardComponent implements OnInit {
  @Input() player: Player;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  onSelected() {
    this.playerSelected.emit(this.player);
  }
}
