import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '../../shared/player.model';

@Component({
  selector: 'app-player-routed-card',
  templateUrl: './player-routed-card.component.html',
  styles: ['']
})
export class PlayerRoutedCardComponent implements OnInit {
  @Input() player: Player | undefined;
  @Input() id: number = 0;
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
