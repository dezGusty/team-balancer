import { Component, OnInit, Input } from '@angular/core';
import { Player } from './../../shared/player.model';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PlayersService } from '../../shared/players.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-player-edit',
  standalone: true,
  styleUrls: ['./player-edit.component.css'],
  templateUrl: './player-edit.component.html',
})
export class PlayerEditComponent implements OnInit {
  @Input() player: Player | undefined;

  @Input() id: string = '';
  private numericId: number = 0;
  private editMode = false;

  constructor(
    private playersSvc: PlayersService,
    private router: Router,
    private route: ActivatedRoute
    ) {

  }

  ngOnInit(): void {
    if (this.id) {
      this.numericId = +this.id;
      this.editMode = true;
    }

    console.log('id: ' + this.numericId + '; edit? ' + this.editMode);
    if (!this.editMode) {
      // New mode.
      this.player = this.playersSvc.createDefaultPlayer();
    } else {
      this.player = this.playersSvc.getPlayerById(this.numericId);
      if (!this.player) {
        // trigger a reroute?
        console.warn('[player edit] invalid id');
        
        this.router.navigate(['..'], { relativeTo: this.route });
      }
    }
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

      this.playersSvc.updatePlayerById(this.numericId, clonedPlayer);
    } else {
      // New mode.
      clonedPlayer.id = changedObject.playerid;
      this.playersSvc.addPlayer(clonedPlayer);
    }

    form.reset();

    this.router.navigate(['..'], { relativeTo: this.route });
  }

  onCancel($event: any) {
    // navigate back to the list.
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
