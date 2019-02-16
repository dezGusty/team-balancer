import { Component, OnInit, Input } from '@angular/core';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.css']
})
export class PlayerDetailsComponent implements OnInit {
  @Input() player: Player;
  constructor() { }

  ngOnInit() {
  }

  public canEditPlayer(): boolean {
    return true;
  }

  public onEditPlayerClicked($event): void {
    console.log('Edit player clicked.', $event);
  }

}
