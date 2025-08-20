
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { PlayerMiniCardComponent } from '../players/player-mini-card/player-mini-card.component';
import { Player } from '../shared/player.model';

@Component({
    imports: [PlayerMiniCardComponent],
    selector: 'app-player-card',
    styles: [''],
    templateUrl: './player-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerCardComponent {
  @Input() player: Player | undefined;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() { }

  onPlayerCardSelected() {
    if (!this.player) {
      return;
    }

    this.playerSelected.emit(this.player);
    console.log('[pcard] player selected:', this.player);
  }
}
