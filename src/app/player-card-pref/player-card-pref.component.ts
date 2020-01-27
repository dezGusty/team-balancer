import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '../shared/player.model';

@Component({
  selector: 'app-player-card-pref',
  templateUrl: './player-card-pref.component.html',
  styles: ['']
})
export class PlayerCardPrefComponent implements OnInit {
  @Input() player: Player;
  @Output() playerSelected = new EventEmitter<Player>();
  @Output() lockTeam1Selected = new EventEmitter<Player>();
  @Output() lockTeam2Selected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  onSelected() {
    this.playerSelected.emit(this.player);
  }

  onLockTeam1($event) {
    this.lockTeam1Selected.emit(this.player);
    $event.stopPropagation();
  }

  onLockTeam2($event) {
    this.lockTeam2Selected.emit(this.player);
    $event.stopPropagation();
  }
}
