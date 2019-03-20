import { Component, OnInit, Input } from '@angular/core';
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

  constructor(private playersSvc: PlayersService) {
  }

  ngOnInit() {
  }

  public playerDisplayName(): string {
    return getDisplayName(this.player);
  }

  onSelected() {
    this.playersSvc.playerSelectedEvent.emit(this.player);
  }
}
