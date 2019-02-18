import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Match } from '../../shared/match.model';
import { Player } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';
import { MatchService } from '../../shared/match.service';

@Component({
  selector: 'app-next-match',
  templateUrl: './next-match.component.html',
  styleUrls: ['./next-match.component.css']
})
export class NextMatchComponent implements OnInit, OnDestroy {

  public matchData: Match;
  public players: Player[];
  public selectedPlayer: Player;
  private playerSelectSubscription: Subscription;

  constructor(private matchSvc: MatchService, private playersSvc: PlayersService) { }

  ngOnInit() {
    this.matchData = this.matchSvc.getNextMatch();
    this.players = this.playersSvc.getPlayers();

    this.playerSelectSubscription = this.playersSvc.playerSelectedEvent
      .subscribe(
        (player: Player) => {
          this.matchData.addPlayer(player);
        }
      );
  }


  ngOnDestroy() {
    console.log('[nextmatch] component destroy');
    this.playerSelectSubscription.unsubscribe();
  }

}
