import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatchService } from '../../shared/match.service';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { Observable, Subscription } from 'rxjs';
import { isNgTemplate } from '@angular/compiler';

@Component({
  selector: 'app-prev-match-detail',
  templateUrl: './prev-match-detail.component.html',
  styleUrls: ['./prev-match-detail.component.css']
})
export class PrevMatchDetailComponent implements OnInit, OnDestroy {

  customGame: CustomPrevGame;
  // @Input() customGameObj: Observable<CustomPrevGame>;
  private subscriptions: Subscription[] = [];

  extractedTeam1: Array<Player> = [];
  extractedTeam2: Array<Player> = [];

  public team1Score = 0;
  public team2Score = 0;
  appliedResults = false;

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
        if (customGame.scoreTeam1 != null) {
          this.team1Score = customGame.scoreTeam1;
        } else {
          this.team1Score = 0;
        }
        if (customGame.scoreTeam2 != null) {
          this.team2Score = customGame.scoreTeam2;
        } else {
          this.team2Score = 0;
        }
        this.appliedResults = customGame.appliedResults;

        console.log('score1:', this.team1Score);
        console.log('score2:', this.team2Score);
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
