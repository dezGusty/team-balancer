import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PlayerMiniCardComponent } from '../players/player-mini-card/player-mini-card.component';
import { Player } from '../shared/player.model';

@Component({
    imports: [
        CommonModule,
        PlayerMiniCardComponent
    ],
    selector: 'app-player-card-pref',
    styles: [''],
    templateUrl: './player-card-pref.component.html'
})
export class PlayerCardPrefComponent implements OnInit {
  @Input() player: Player | undefined;
  @Output() playerSelected = new EventEmitter<Player>();
  @Output() lockTeam1Selected = new EventEmitter<Player>();
  @Output() lockTeam2Selected = new EventEmitter<Player>();

  constructor() { }

  ngOnInit() {
  }

  onSelected() {
    this.playerSelected.emit(this.player);
  }

  onLockTeam1($event: any) {
    this.lockTeam1Selected.emit(this.player);
    $event.stopPropagation();
  }

  onLockTeam2($event: any) {
    this.lockTeam2Selected.emit(this.player);
    $event.stopPropagation();
  }
}
