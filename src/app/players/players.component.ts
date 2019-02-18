import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.css']
})
export class PlayersComponent implements OnInit, OnDestroy {
  players: Player[];
  selectedPlayer: Player;
  editMode: boolean;
  playerSelectSubscription: Subscription;
  playerDataChangeSubscription: Subscription;

  constructor(private playersSvc: PlayersService, private router: Router, private route: ActivatedRoute) {
    this.selectedPlayer = null;
    this.editMode = false;
  }

  ngOnInit() {
    this.players = this.playersSvc.getPlayers();
    this.playerSelectSubscription = this.playersSvc.playerSelectedEvent
      .subscribe(
        (player: Player) => {
          console.log('selected: ' + player.name);
          this.selectedPlayer = player;
        }
      );

    this.playerDataChangeSubscription = this.playersSvc.playerDataChangeEvent
      .subscribe(
        (player: Player) => {
          console.log('player change');
          if (player == null) {
            // reload all
            this.players = this.playersSvc.getPlayers();
          } else {
            // reload single player only.
            this.players = this.playersSvc.getPlayers();
          }
        }
      );
  }

  ngOnDestroy() {
    this.playerSelectSubscription.unsubscribe();
    this.playerDataChangeSubscription.unsubscribe();
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
    this.router.navigate(['new'], { relativeTo: this.route });

    // // double check?
    // if (!this.canAddPlayers()) {
    //   return;
    // }
    // this.selectedPlayer = this.playersSvc.createDefaultPlayer();
    // this.playersSvc.addPlayer(
    //   this.selectedPlayer
    // );
    // // re-init?
    // this.players = this.playersSvc.getPlayers();

    // // auto-edit
    // this.editMode = true;
  }

  public onEditPlayerClicked($event): void {
    console.log('edit player clicked', $event);
    // this.editMode = true;
    this.router.navigate([this.selectedPlayer.id, 'edit'], { relativeTo: this.route });

    // TODO: replace with service call
    // in service: startedEditing = new Subject<number>(); // index
    // in listeners: subscription: Subscription;
    // on listeners init: sub= playersSvc.startedEditing.subscribe((index: number) => {...})
    // on destroy: unsubscribe sub
    // here
    // this.playerSvc.startedEditing.next(index);
  }
}
