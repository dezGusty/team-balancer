import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CustomGame } from '../../shared/custom-game.model';
import { Player, getDisplayName } from '../../shared/player.model';
import { MatchService } from 'src/app/shared/match.service';

@Component({
  selector: 'app-match-storage',
  templateUrl: './match-storage.component.html',
  styles: ['']
})
export class MatchStorageComponent implements OnInit {

  @Input() customGame: CustomGame | undefined;
  public customClipText = '';
  public targetDate = '';
  @ViewChild('ttip') copyToClipBtn: ElementRef | undefined;
  constructor(private matchSvc: MatchService, private matchAltSvc: MatchService) {
    this.targetDate = new Date().toISOString().slice(0, 10);
  }

  ngOnInit() {
  }

  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  async onStoreCliked() {
    if (!this.customGame) {
      console.log('no game object stored!');
      return;
    }

    const dateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;

    const regexMatchResult = this.targetDate.match(dateRegex);
    if (regexMatchResult == null) {
      this.targetDate = new Date().toISOString().slice(0, 10);
    }

    await this.matchAltSvc.saveCustomMatchAsync(this.targetDate, this.customGame);
  }

  onCopyClicked() {
    if (!this.customGame) {
      return;
    }

    this.customClipText = this.customGame.toPlainTextFormat();

    if (!this.copyToClipBtn) {
      return;
    }

    try {
      const elem = this.copyToClipBtn.nativeElement;
      if (elem) {
        console.log('Try hide...');
        elem.close();
      }
    } catch (error) {
      console.log('Some error encountered...');
    }
  }

  public notifyCpy(payload: string) {
    // TODO: remove ??
    // Might want to notify the user that something has been pushed to the clipboard
    console.log(`'${payload}' has been copied to clipboard`);
  }

  customClipTextToClip(): string {
    if (!this.customGame) {
      return '';
    }

    this.customClipText = this.customGame.toPlainTextFormat();
    return this.customClipText;
  }
}
