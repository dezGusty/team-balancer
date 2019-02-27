import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Match } from '../../shared/match.model';
import { Player, filterPlayerArray } from '../../shared/player.model';
import { PlayersService } from '../../shared/players.service';
import { MatchService } from '../../shared/match.service';

@Component({
  selector: 'app-next-match',
  templateUrl: './next-match.component.html',
  styleUrls: ['./next-match.component.css']
})
export class NextMatchComponent implements OnInit, OnDestroy {

  searchedName: string;

  // public matchData = new Match(new Date(Date.now()));
  public matchData: Match;
  public selectedPlayer: Player;
  private playerSelectSubscription: Subscription;
  private playerDataChangeSubscription: Subscription;

  constructor(private matchSvc: MatchService, private playersSvc: PlayersService) { }

  ngOnInit() {
    this.matchData = this.matchSvc.getNextMatch();
    this.matchData.availablePlayersPool = this.playersSvc.getPlayers();
    this.matchData.draftPlayers.forEach(element => {
      this.matchData.removePlayerFromPool(element);
    });

    this.playerSelectSubscription = this.playersSvc.playerSelectedEvent
      .subscribe(
        (player: Player) => {
          this.matchData.movePlayerToDraft(player);
        }
      );

    this.playerDataChangeSubscription = this.playersSvc.playerDataChangeEvent
      .subscribe(
        (player: Player) => {
          console.log('player change');
          if (player == null) {
            // reload all
            this.matchData.availablePlayersPool = this.playersSvc.getPlayers();
          } else {
            // reload single player only.
            this.matchData.availablePlayersPool = this.playersSvc.getPlayers();
          }
        }
      );
  }

  ngOnDestroy() {
    if (this.playerSelectSubscription) {
      this.playerSelectSubscription.unsubscribe();
    }
    if (this.playerDataChangeSubscription) {
      this.playerDataChangeSubscription.unsubscribe();
    }
  }

  onSearchContentChange($event) {
    if ($event.code === 'Enter') {
      // try to apply the target value.
      const filteredPlayers = filterPlayerArray(this.matchData.availablePlayersPool, $event.target.value);
      if (filteredPlayers.length === 1) {
        this.matchData.movePlayerToDraft(filteredPlayers[0]);
      }

      this.searchedName = '';
    }
  }

  onPlayerSelected($event) {
    const selectedPlayer: Player = $event;
    if (null == selectedPlayer) {
      return;
    }

    const currentPosition = this.matchData.draftPlayers.indexOf(selectedPlayer);
    if (currentPosition !== -1) {
      this.matchData.movePlayerBackToPool(selectedPlayer);
      this.searchedName = '';
      return;
    } else {
      this.matchData.movePlayerToDraft(selectedPlayer);
      this.searchedName = '';
      return;
    }
  }
}
