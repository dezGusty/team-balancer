import { Component, OnInit, Input } from '@angular/core';
import { Player } from './../../shared/player.model';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PlayersService } from '../../shared/players.service';

@Component({
  selector: 'app-player-edit',
  templateUrl: './player-edit.component.html',
  styleUrls: ['./player-edit.component.css']
})
export class PlayerEditComponent implements OnInit {
  @Input() player: Player;

  id: number;
  editMode = false;

  constructor(
    private playersSvc: PlayersService,
    private router: Router,
    private route: ActivatedRoute) {

  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        this.id = +params.id;
        this.editMode = params.id != null;
        console.log('id: ' + this.id + '; edit? ' + this.editMode);
        if (!this.editMode) {
          // New mode.
          this.player = this.playersSvc.createDefaultPlayer();
        } else {
          this.player = this.playersSvc.getPlayerById(this.id);
          if (null == this.player) {
            // trigger a reroute?
            console.warn('[player edit] invalid id');
            this.router.navigate(['..'], { relativeTo: this.route });
          }
        }
      }
    );
  }

  onSubmit(form: NgForm) {
    const changedObject: {
      playerid: number,
      playername: string,
      playerrating: number,
      keywords: string,
      displayName: string
    } = form.value;
    console.log(changedObject);

    // update the player in the service.
    const clonedPlayer: Player = Object.assign({}, this.player);
    clonedPlayer.name = changedObject.playername;
    clonedPlayer.rating = changedObject.playerrating;
    clonedPlayer.keywords = changedObject.keywords;
    clonedPlayer.displayName = changedObject.displayName;

    if (this.editMode) {
      // edit mode

      this.playersSvc.updatePlayerById(this.id, clonedPlayer);
    } else {
      // New mode.
      clonedPlayer.id = changedObject.playerid;
      this.playersSvc.addPlayer(clonedPlayer);
    }

    this.playersSvc.playerDataChangeEvent.emit(null);
    form.reset();

    this.router.navigate(['..'], { relativeTo: this.route });
  }

  onCancel($event) {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
