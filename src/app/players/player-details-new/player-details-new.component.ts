import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { Player, getDisplayName } from 'src/app/shared/player.model';
import { PlayersService } from 'src/app/shared/players.service';

@Component({
  selector: 'app-player-details-new',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './player-details-new.component.html',
  styleUrl: './player-details-new.component.css'
})
export class PlayerDetailsNewComponent {
  @Output() onCloseBtnClicked = new EventEmitter<void>();
  @Output() onSaveBtnClicked = new EventEmitter<void>();
  @Output() onMovePlayerToArchiveClicked = new EventEmitter<void>();
  @Output() onMovePlayerToActiveClicked = new EventEmitter<void>();

  private authSvc = inject(UserAuthService);

  player = model<Player>();
  playersSvc = inject(PlayersService);

  onSideNavInnerContainerClicked(event: Event) {
    event.stopPropagation();
  }

  onCloseBtnClick() {
    this.onCloseBtnClicked.emit();
  }

  onMovePlayerToArchive() {
    this.onMovePlayerToArchiveClicked.emit();
  }

  onMovePlayerToActive() {
    this.onMovePlayerToActiveClicked.emit();
  }

  onSaveBtnClick() {
    const player = this.player();
    console.log("Save button clicked. Player is: ", player);
    if (player) {
      this.playersSvc.updatePlayerById(player.id, player);
    }

    this.onCloseBtnClicked.emit();
  }

  public playerDisplayName(): string {
    const player = this.player();
    if (!player) {
      return '';
    }

    return getDisplayName(player);
  }

  public canEditPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canArchivePlayer(): boolean {
    let playerToArchive = this.player();
    if (!playerToArchive) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && (!playerToArchive.isArchived);
  }

  public canUnarchivePlayer(): boolean {
    let playerToArchive = this.player();
    if (!playerToArchive) {
      return false;
    }
    return this.authSvc.isAuthenticatedAsOrganizer() && playerToArchive.isArchived;
  }
}
