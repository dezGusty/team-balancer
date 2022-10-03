import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CustomGame } from '../../shared/custom-game.model';
import { Player, getDisplayName } from '../../shared/player.model';
import { MatchService } from '../../shared/match.service';
import { MatchAltService } from 'src/app/shared/match-alt.service';

@Component({
  selector: 'app-match-storage',
  templateUrl: './match-storage.component.html',
  styles: ['']
})
export class MatchStorageComponent implements OnInit {

  @Input() customGame: CustomGame;
  public customClipText = '';
  public targetDate = '';
  @ViewChild('ttip') copyToClipBtn: ElementRef;
  constructor(private matchSvc: MatchService, private matchAltSvc: MatchAltService) {
    this.targetDate = new Date().toISOString().slice(0, 10);
  }

  ngOnInit() {
  }

  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  async onStoreCliked() {
    console.log('[match-storage] click');

    const dateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
    console.log('target date', this.targetDate);

    const regexMatchResult = this.targetDate.match(dateRegex);
    if (regexMatchResult == null) {
      this.targetDate = new Date().toISOString().slice(0, 10);
    }

    await this.matchAltSvc.saveCustomMatchAsync(this.targetDate, this.customGame);
  }

  onCopyClicked() {
    console.log('[match-storage] copy click');

    this.customClipText = this.customGame.toPlainTextFormat();

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
    this.customClipText = this.customGame.toPlainTextFormat();
    return this.customClipText;
  }
}
