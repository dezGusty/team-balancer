import { Component, OnInit, Input } from '@angular/core';
import { CustomGame } from '../../shared/custom-game.model';
import { Player, getDisplayName } from '../../shared/player.model';
import { MatchService } from '../../shared/match.service';

@Component({
  selector: 'app-match-storage',
  templateUrl: './match-storage.component.html',
  styleUrls: ['./match-storage.component.css']
})
export class MatchStorageComponent implements OnInit {

  @Input() customGame: CustomGame;
  public customClipText = '';
  public targetDate = '';
  constructor(private matchSvc: MatchService) {
    this.targetDate = new Date().toISOString().slice(0, 10);
  }

  ngOnInit() {
  }

  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  onStoreCliked() {
    console.log('[match-storage] click');

    // const dateRegex = '([12]\\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01]))';
    const dateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
    console.log('target date', this.targetDate);

    const regexMatchResult = this.targetDate.match(dateRegex);
    if (regexMatchResult == null) {
      this.targetDate = new Date().toISOString().slice(0, 10);
    }

    this.matchSvc.saveCustomMatch(this.targetDate, this.customGame);
  }

  onCopyClicked() {
    console.log('[match-storage] copy click');

    this.customClipText = this.customGame.toPlainTextFormat();
  }

  public notifyCpy(payload: string) {
    // Might want to notify the user that something has been pushed to the clipboard
    console.log(`'${payload}' has been copied to clipboard`);
  }

  customClipTextToClip(): string {
    this.customClipText = this.customGame.toPlainTextFormat();
    return this.customClipText;
  }
}
