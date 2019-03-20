import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '../../shared/player.model';

@Component({
  selector: 'app-player-routed-card',
  templateUrl: './player.component.html',
  styles: ['']
})
export class PlayerRoutedCardComponent implements OnInit {
  @Input() player: Player;
  @Input() id: number;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() {
  }

  ngOnInit() {
  }

  onSelected() {
    this.playerSelected.emit(this.player);
  }
}
