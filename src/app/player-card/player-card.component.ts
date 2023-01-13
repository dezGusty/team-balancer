import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PlayerMiniCardComponent } from '../players/player-mini-card/player-mini-card.component';
import { Player } from '../shared/player.model';

@Component({
  imports: [CommonModule, PlayerMiniCardComponent],
  selector: 'app-player-card',
  standalone: true,
  styles: [''],
  templateUrl: './player-card.component.html',
})
export class PlayerCardComponent implements OnInit {
  @Input() player: Player | undefined;
  @Output() playerSelected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  onPlayerCardSelected() {
    if (!this.player) {
      return;
    }

    this.playerSelected.emit(this.player);
    console.log('[pcard] player selected:', this.player);
  }
}
