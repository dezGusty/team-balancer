import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { MatchService } from 'src/app/shared/match.service';
import { Match } from 'src/app/shared/match.model';
import { PlayersService } from 'src/app/shared/players.service';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-next-match',
  templateUrl: './next-match.component.html',
  styleUrls: ['./next-match.component.css']
})
export class NextMatchComponent implements OnInit, OnDestroy {

  public matchData: Match;
  public players: Player[];
  public selectedPlayer: Player;

  constructor(private matchSvc: MatchService, private playersSvc: PlayersService) { }

  ngOnInit() {
    this.matchData = this.matchSvc.getNextMatch();
    this.players = this.playersSvc.getPlayers();

    this.playersSvc.playerSelected
      .subscribe(
        (player: Player) => {
          this.matchData.addPlayer(player);
        }
      );
  }


  ngOnDestroy() {
    this.playersSvc.playerSelected.unsubscribe();
  }

}
