import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Player } from '../../shared/player.model';
import { PlayerMiniCardComponent } from '../player-mini-card/player-mini-card.component';

@Component({
  imports: [CommonModule, RouterModule, PlayerMiniCardComponent],
  selector: 'app-player-routed-card',
  standalone: true,
  styles: [''],
  templateUrl: './player-routed-card.component.html',
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
