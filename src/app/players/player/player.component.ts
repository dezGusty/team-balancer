import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
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
