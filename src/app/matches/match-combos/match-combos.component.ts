import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Player } from 'src/app/shared/player.model';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-match-combos',
  templateUrl: './match-combos.component.html',
  styleUrls: ['./match-combos.component.css']
})
export class MatchCombosComponent implements OnInit, OnDestroy {
  @Input() playerList: Player[];
  @Input() makeTeamsEvent: Observable<void>;
  private eventsSubscription: Subscription;

  showDetailedSelection = false;

  listOfOptions = new Array<{ value: number, diff: number, combination: string }>();
  displayedMatchCombos = new Array<{
    value: number,
    diff: number,
    combination: string
  }>();

  // one to one mapping for the same index with the displayedMatchCombos array
  displayedMatchDetails = new Array<{
    team1: Array<Player>,
    team2: Array<Player>
  }>();

  constructor() {

  }

  ngOnInit() {
    console.log('[combos] init');
    this.eventsSubscription = this.makeTeamsEvent.subscribe(
      () => this.prepareTeams());

    // also do it immediately?
    if (this.playerList.length > 0) {
      this.prepareTeams();
    }
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  onMatchSelected(data: {
    team1: Array<Player>,
    team2: Array<Player>
  }) {
    console.log('match selected', data);
  }

  prepareTeams() {
    console.log('preparing teams');

    // sort the players.
    this.playerList.sort((a, b) => {
      if (a.rating < b.rating) {
        return -1;
      } else if (a.rating === b.rating) {
        return 0;
      }
      return 1;
    });

    this.getAllCombinations(this.playerList);

    const displayedLength = this.listOfOptions.length > 10
      ? 10
      : this.listOfOptions.length;

    this.displayedMatchCombos = this.listOfOptions.slice(0, displayedLength);
    this.displayedMatchDetails = new Array<{
      team1: Array<Player>,
      team2: Array<Player>
    }>();

    this.displayedMatchCombos.forEach(element => {

      const detailedElement: {
        team1: Array<Player>,
        team2: Array<Player>
      } = {
        team1: [],
        team2: []
      };

      const stringifiedBinary = element.combination;
      // split the string to an array and add the names
      stringifiedBinary.split('').forEach((value, index, array) => {
        if (value === '1') {
          detailedElement.team1.push(this.playerList[index]);
        } else {
          detailedElement.team2.push(this.playerList[index]);
        }
      });
      this.displayedMatchDetails.push(detailedElement);
    });
  }

  getAllCombinations(players: Player[]) {
    // Create 2 teams; use combinations.
    // Basically: choose 6 players from a list of 12.
    // C(n, k) = n! / (n-k)! * k!
    // C(12, 6) = 479001600 / 720 * 720 = 924
    // Try to get the players in combinations that get to a certain ideal sum (half of their overall sum)

    // start with 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 => 000000111111
    // basically: first 6 in a team, last 6 in another.
    // increase number keeping amount of 1s. E.g. 000001011111

    // 000111
    // 001000
    // 001001
    // 001010
    // 001011
    this.listOfOptions = new Array<{ value: number, diff: number, combination: string }>();
    const totalNumberOfPlayers = players.length;
    const idealNumberOfPlayers = players.length / 2;
    let totalSum = 0;
    players.forEach(player => {
      totalSum += player.rating;
    });

    let customCounter = Math.pow(2, idealNumberOfPlayers) - 2;
    const maxValue = Math.pow(2, players.length - 1) - 1;
    console.log('maxval:', maxValue);
    while (customCounter < maxValue) {
      customCounter++;
      let stringifiedBinary = customCounter.toString(2);
      if (stringifiedBinary.split('1').length - 1 !== idealNumberOfPlayers) {
        continue;
      }

      stringifiedBinary = stringifiedBinary.padStart(totalNumberOfPlayers, '0');
      let sum = 0;
      stringifiedBinary.split('').forEach((value, index, array) => {
        if (value === '1') {
          sum += players[index].rating;
        }
      });

      // Compute the sum
      let diff = sum - totalSum / 2;
      if (diff < 0) {
        diff = -diff;
      }
      this.listOfOptions.push({ value: sum, diff, combination: stringifiedBinary });
      // console.log(++numOptions + ')' + stringifiedBinary + ' - sum: ' + sum + ' - diff: ' + diff);
    }

    // sort the list according to the difference
    this.listOfOptions.sort((a, b) => {
      if (a.diff < b.diff) {
        return -1;
      } else if (a.diff === b.diff) {
        return 0;
      }
      return 1;
    });

    // this.listOfOptions.forEach((item, index) => {
    //   console.log(1 + index + ')' + item.combination + ' - diff: ' + item.diff);
    // });

    // if (this.listOfOptions.length > 10) {
    //   for (let i = 0; i < 10; ++i) {
    //     const stringifiedBinary = this.listOfOptions[i].combination;
    //     let names = '';
    //     let otherNames = '';
    //     // split the string to an array and add the names
    //     stringifiedBinary.split('').forEach((value, index, array) => {
    //       if (value === '1') {
    //         names += players[index].name + ', ';
    //       } else {
    //         otherNames += players[index].name + ', ';
    //       }
    //     });
    //     console.log(1 + i + ')' + stringifiedBinary + ' - diff: ' + this.listOfOptions[i].diff + '; ' + names);
    //   }
    // }

    // console.log('Ideal balance value', totalSum / 2, 'from', totalSum);
  }

  onGameOptionSelected($event, i) {
    const selectedOption: { value: number, diff: number, combination: string } = $event;
    this.showDetailedSelection = true;

    // show the selection details...
    console.log('game option selected', selectedOption, i);

    console.log('1', this.displayedMatchDetails[i].team1);
    console.log('2', this.displayedMatchDetails[i].team2);

    // TODO: Augustin Preda, 2019-03-07: move to separate display, allow to store the selected match?
    // create next component.

  }
}
