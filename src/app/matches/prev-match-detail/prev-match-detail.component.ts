import { Component, OnInit, OnDestroy } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { MatchService } from '../../shared/match.service';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Subscription } from 'rxjs';

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
    private matchSvc: MatchService) { }

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
}
