import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '../../shared/player.model';

@Component({
  selector: 'app-player-routed-card',
  templateUrl: './player-routed-card.component.html',
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

  onPlayerRoutedCardSelected() {
    console.log('[pcr] selected', this.player);

    this.playerSelected.emit(this.player);
  }
}
