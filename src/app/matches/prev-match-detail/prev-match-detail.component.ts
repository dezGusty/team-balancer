import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { MatchService } from '../../shared/match.service';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Subscription } from 'rxjs';
import { PlayersService } from 'src/app/shared/players.service';

@Component({
  selector: 'app-prev-match-detail',
  templateUrl: './prev-match-detail.component.html',
  styleUrls: ['./prev-match-detail.component.css']
})
export class PrevMatchDetailComponent implements OnInit, OnDestroy {

  customGame: CustomPrevGame;
  private subscriptions: Subscription[] = [];

  extractedTeam1: Array<Player> = [];
  extractedTeam2: Array<Player> = [];

  public team1Score = 0;
  public team2Score = 0;

  public matchResultsStored = true;
  public matchResultsAppliedToRatings = true;

  matchSearchKey = '';

  constructor(
    private route: ActivatedRoute,
    private matchSvc: MatchService,
    private playersSvc: PlayersService) { }

  ngOnInit() {
    this.subscriptions.push(this.route.params.subscribe(
      (params: Params) => {
        this.matchSearchKey = params.id;
        this.loadCustomGameForKey(this.matchSearchKey);
      }
    ));

    this.subscriptions.push(
      this.matchSvc.matchRetrievedEvent.subscribe((customGame: CustomPrevGame) => {
        this.customGame = customGame;
        this.extractedTeam1 = customGame.team1;
        this.extractedTeam2 = customGame.team2;
        this.matchResultsStored = true;
        if (customGame.scoreTeam1 != null) {
          this.team1Score = customGame.scoreTeam1;
        } else {
          this.team1Score = 0;
          this.matchResultsStored = false;
        }
        if (customGame.scoreTeam2 != null) {
          this.team2Score = customGame.scoreTeam2;
        } else {
          this.team2Score = 0;
          this.matchResultsStored = false;
        }
        this.matchResultsAppliedToRatings = customGame.appliedResults;
      }
      ));
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  loadCustomGameForKey(matchSearchKey: string) {
    this.customGame = null;
    this.matchSvc.issueMatchRetrievalForDate(matchSearchKey);
  }


  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  onMatchSaveCliked() {

  }

  onStoreResultClick() {
    this.customGame.scoreTeam1 = this.team1Score;
    this.customGame.scoreTeam2 = this.team2Score;
    this.matchSvc.saveCustomPrevMatch(this.matchSearchKey, this.customGame);
  }

  /**
   * Updates the ratings of the user for the loaded match.
   * The old player ratings are stored to an old entry. E.g.
   *    'ratings/2018-04-02'
   * The current player ratings are stored in the standard entry. E.g.
   *    'ratings/current'
   */
  onUpdateRatingsClick() {
    const newPlayers = this.playersSvc.updateRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame
    );

    // Store the 'old' ratings under a different entry.
    this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), this.matchSearchKey);

    // Store the 'new' ratings under the 'current' entry.
    this.playersSvc.savePlayersToList(newPlayers, 'current');

    // Store the new data for the match.
    this.customGame.appliedResults = true;
    this.matchResultsAppliedToRatings = true;
    this.matchSvc.saveCustomPrevMatch(this.matchSearchKey, this.customGame);
  }
}
