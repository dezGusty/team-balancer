import { Component, OnInit, Input } from '@angular/core';
import { Player, getDisplayName } from 'src/app/shared/player.model';

@Component({
  selector: 'app-player-mini-card',
  templateUrl: './player-mini-card.component.html',
  styleUrls: ['./player-mini-card.component.css']
})
export class PlayerMiniCardComponent implements OnInit {
  @Input() player: Player;
  constructor() { }

  ngOnInit() {
  }

  public playerDisplayName(): string {
    return getDisplayName(this.player);
  }

}
