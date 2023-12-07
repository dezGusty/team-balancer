import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CopyClipboardDirective } from '../shared/copy-clipboard.directive';
import { DraftService } from '../shared/draft.service';
import { DraftSelectionService } from './data-access/draft-selection.service';
import { NotificationService } from '../utils/notification/notification.service';
import { CurrentPlayersData, CurrentPlayersService } from './data-access/current-players.service';
import { PlayerCardComponent } from "../player-card/player-card.component";
import { Player } from '../shared/player.model';

@Component({
    selector: 'app-draft-new',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    templateUrl: './draft-new.component.html',
    styleUrl: './draft-new.component.css',
    imports: [CommonModule, FormsModule, PlayerCardComponent]
})
export class DraftNewComponent {

  nextMatches$ = this.draftService.nextMatches$;

  playersData$ = this.playersService.currentPlayers$;


  @ViewChild('srcNameArea') srcNameArea: ElementRef | undefined;
  constructor(
    private draftService: DraftSelectionService,
    private playersService: CurrentPlayersService,
    private notificationService: NotificationService) {
  }
  
  searchedName: string = '';

  onClearListClicked() {
    // this.selectedPlayerList = [];
    // this.availablePlayerList = [...this.playersSvc.getPlayers()];
  }

  onSaveSelectionClicked() {
    // this.showLoading = true;
    // await this.draftSvc.saveSelectedPlayerListAsync(this.selectedPlayerList);
    // this.showLoading = false;
  }

  onCopyClicked() {
    // this.customClipText = this.draftSvc.getDraftPlainTextFormat(this.selectedPlayerList);
    // this.toastSvc.showWithHeader('Copied to clipboard.', this.customClipText);
  }

  getDraftPlainTextFormat(): string {
    return "blabla";
    // return this.draftSvc.getDraftPlainTextFormat(this.selectedPlayerList);
  }

  customClipTextToClip(): string {
    return "";
    // this.customClipText = this.getDraftPlainTextFormat();
    // return this.customClipText;
  }

  public canChangePlayersInDraft(): boolean {
    return true;
    // return this.authSvc.isAuthenticatedAsOrganizer();
  }

  onSearchContentChange($event: any) {
    // if ($event.code === 'Enter') {
    //   // try to apply the target value.
    //   const filteredPlayers = filterPlayerArray(this.availablePlayerList, $event.target.value);
    //   if (filteredPlayers.length === 1) {
    //     this.movePlayerToDraft(filteredPlayers[0]);
    //   }

    //   this.searchedName = '';
    // } else {

    //   // try to apply the target value.
    //   const filteredPlayers = filterPlayerArray(this.availablePlayerList, $event.target.value);
    //   if (filteredPlayers.length === 1) {
    //     // show special marker?
    //   }
    // }
  }

  onMatchUpClicked() {
    console.log('[draft] creating match from draft ...');
    // this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList);
    // this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  /**
   * Use a match with only the top 12 (if 12 or more players available) or the top 10 players (if 10 or 11 players are available).
   */
  onMatchUpTopClicked() {
    console.log('[draft] filtering to top 12/10 players and creating match from draft ...');

    // if (this.selectedPlayerList.length < 10) {
    //   // Cannot use this functionaliry
    //   this.toastSvc.showWithHeader('Insufficient players', `Cannot use this functionality with only ${this.selectedPlayerList.length} players.`);
    //   return;
    // }

    // if (this.selectedPlayerList.length >= 12) {
    //   // limit to 12
    //   this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList.slice(0, 12));
    // }
    // else {
    //   // limit to 10
    //   this.draftSvc.storePlayersInMemoryOnly(this.selectedPlayerList.slice(0, 10));
    // }
    // this.router.navigate(['/custom'], { queryParams: { draft: true } });
  }

  onPlayerSelected($event: any, player: Player) {
    // this.movePlayerToDraft(player);
  
  }
}
