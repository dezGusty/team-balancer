import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlayersService } from 'src/app/shared/players.service';
import { Player, filterPlayerArray } from 'src/app/shared/player.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styles: ['']
})
export class DraftComponent implements OnInit, OnDestroy {
  searchedName: string;

  availablePlayerList: Player[] = [];
  selectedPlayerList: Player[] = [];
  private playerDataChangeSubscription: Subscription;

  constructor(private playersSvc: PlayersService) {
    // this.availablePlayerList = this.playersSvc.getPlayers();
  }

  ngOnInit() {
    this.playerDataChangeSubscription = this.playersSvc.playerDataChangeEvent
      .subscribe(
        (player: Player) => {
          console.log('[draft] init');
          this.availablePlayerList = this.playersSvc.getPlayers();
          this.selectedPlayerList = [];
        }
      );
  }

  ngOnDestroy() {
    if (this.playerDataChangeSubscription) {
      this.playerDataChangeSubscription.unsubscribe();
    }
  }

  onSearchContentChange($event) {
    if ($event.code === 'Enter') {
      // try to apply the target value.
      const filteredPlayers = filterPlayerArray(this.availablePlayerList, $event.target.value);
      if (filteredPlayers.length === 1) {
        this.movePlayerToDraft(filteredPlayers[0]);
      }

      this.searchedName = '';
    } else {

      // try to apply the target value.
      const filteredPlayers = filterPlayerArray(this.availablePlayerList, $event.target.value);
      if (filteredPlayers.length === 1) {
        // show special marker?
      }
    }
  }

  onPlayerSelected($event) {
    const selectedPlayer: Player = $event;
    if (null == selectedPlayer) {
      return;
    }

    const currentPosition = this.selectedPlayerList.indexOf(selectedPlayer);
    if (currentPosition !== -1) {
      this.movePlayerBackToPool(selectedPlayer);
      this.searchedName = '';
    } else {
      this.movePlayerToDraft(selectedPlayer);
      this.searchedName = '';
    }
  }

  movePlayerToDraft(newPlayer: Player): boolean {
    if (this.selectedPlayerList.includes(newPlayer)) {
      console.log('[draft] player [' + newPlayer.name + '] already drafted');
      return false;
    }

    this.removePlayerFromPool(newPlayer);
    this.selectedPlayerList.push(newPlayer);

    return true;
  }
  removePlayerFromPool(newPlayer: Player) {
    const existingPos = this.availablePlayerList.indexOf(newPlayer);
    if (existingPos !== -1) {
      this.availablePlayerList.splice(existingPos, 1);
      // Also reassign to force Angular to identify that the object
      // was modified and a refresh of the bound data is issued.
      this.availablePlayerList = [...this.availablePlayerList];
    } else {
      console.log('[draft] failed to remove player from pool', newPlayer);
    }
  }

  removePlayerFromDraft(newPlayer: Player) {
    const existingPos = this.selectedPlayerList.indexOf(newPlayer);
    if (existingPos !== -1) {
      this.selectedPlayerList.splice(existingPos, 1);
      // Also reassign to force Angular to identify that the object
      // was modified and a refresh of the bound data is issued.
      this.selectedPlayerList = [...this.selectedPlayerList];
    } else {
      console.log('[draft] failed to remove player from draft', newPlayer);
    }
  }

  movePlayerBackToPool(player: Player): boolean {
    if (!this.selectedPlayerList.includes(player)) {
      console.log('[draft] cannot pop player [' + player.name + '] ');
      return false;
    }

    console.log('moving player[' + player.name + '] back to the pool');
    this.removePlayerFromDraft(player);
    this.availablePlayerList.push(player);
    // Also reassign to force Angular to identify that the object
    // was modified and a refresh of the bound data is issued.
    this.availablePlayerList = [...this.availablePlayerList];
    return true;
  }

  onSaveSelectionClicked() {
    console.log('[draft] saving player list...');
    // this.selectedPlayerList.splice(existingPos, 1);
  }
}
