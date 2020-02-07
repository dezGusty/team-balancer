import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PlayersService } from 'src/app/shared/players.service';
import { Player, filterPlayerArray, getDisplayName } from 'src/app/shared/player.model';
import { Subscription } from 'rxjs';
import { DraftService } from 'src/app/shared/draft.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styles: ['']
})
export class DraftComponent implements OnInit, OnDestroy {
  searchedName: string;
  public customClipText = '';
  availablePlayerList: Player[] = [];
  selectedPlayerList: Player[] = [];
  private playerDataChangeSubscription: Subscription;
  @ViewChild('ttip') copyToClipBtn: ElementRef;

  constructor(
    private playersSvc: PlayersService,
    private draftSvc: DraftService,
    private router: Router) {
  }

  ngOnInit() {
    console.log('[draft] init');
    this.availablePlayerList = [...this.playersSvc.getPlayers()];
    this.selectedPlayerList = [...this.draftSvc.getDraftedPlayers()];
    this.availablePlayerList = this.availablePlayerList.filter(
      player => !this.selectedPlayerList.find(item => player.id === item.id)
    );

    this.playerDataChangeSubscription = this.draftSvc.playerDataChangeEvent
      .subscribe(
        (players: Player[]) => {
          this.availablePlayerList = [...this.playersSvc.getPlayers()];
          this.selectedPlayerList = [...players];
          this.availablePlayerList = this.availablePlayerList.filter(
            player => !this.selectedPlayerList.find(item => player.id === item.id)
          );
        }
      );
  }

  ngOnDestroy() {
    console.log('[draft] destroy');
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

  onClearListClicked() {
    this.selectedPlayerList = [];
    this.availablePlayerList = [...this.playersSvc.getPlayers()];
  }

  onSaveSelectionClicked() {
    this.draftSvc.saveSelectedPlayerList(this.selectedPlayerList);
  }

  onMatchUpClicked() {
    console.log('[draft] creating match from draft ...');
    this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList);
    this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  onCopyClicked() {
    this.customClipText = this.getDraftPlainTextFormat();
  }

  getDraftPlainTextFormat(): string {
    let plainText = '';
    this.selectedPlayerList.forEach((player, index) => {
      plainText += '' + (index + 1) + '. ' + getDisplayName(player) + '\n';
    });
    return plainText;
  }

  customClipTextToClip(): string {
    this.customClipText = this.getDraftPlainTextFormat();
    return this.customClipText;
  }
}
