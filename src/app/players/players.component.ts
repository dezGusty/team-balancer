import { Component, OnInit } from '@angular/core';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css'],
  providers: [PlayersService]
})
export class PlayersComponent implements OnInit {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;

  constructor(private playersSvc: PlayersService) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();
    this.playersSvc.playerSelected
      .subscribe(
        (player: Player) => {
          console.log('selected: ' + player.name);
          this.selectedPlayer = player;
        }
      );
  }

  public canAddPlayers(): boolean {
    return true;
  }

  public playerIsSelected(): boolean {
    return this.selectedPlayer != null;
  }

  public editDone($event): void {
    console.log('editing done', $event);
    const changedObject: { saved: boolean, playername: string, playerrating: number } = $event;
    if (changedObject.saved) {
      // update the player in the service.
      const clonedPlayer = { ...this.selectedPlayer };
      clonedPlayer.name = changedObject.playername;
      clonedPlayer.rating = changedObject.playerrating;

      if (this.playersSvc.updatePlayer(this.selectedPlayer, clonedPlayer)) {
        // re-init?
        this.players = this.playersSvc.getPlayers();
        this.selectedPlayer = clonedPlayer;
      }
    }
    this.editMode = false;
  }


  public onNewPlayerClicked($event): void {
    console.log('new player clicked', $event);
    // double check?
    if (!this.canAddPlayers()) {
      return;
    }
    this.selectedPlayer = this.playersSvc.createDefaultPlayer();
    this.playersSvc.addPlayer(
      this.selectedPlayer
    );
    // re-init?
    this.players = this.playersSvc.getPlayers();

    // auto-edit
    this.editMode = true;
  }

  public onEditPlayerClicked($event): void {
    console.log('edit player clicked', $event);
    this.editMode = true;
  }
}
