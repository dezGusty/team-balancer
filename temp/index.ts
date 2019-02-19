import { join, resolve } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Player } from './player';
import { GameInfo } from './game-info';


const relativePath = 'd:/Programe/TFL/';
const playersFile = 'players.txt';
const gamesFile = 'games.txt';

function getPlayersFile(): string {
  return resolve(join(relativePath, playersFile));
}

function getGamesFile(): string {
  return resolve(join(relativePath, gamesFile));
}

function hasFullGameInfo(date: string, difference: string, winners: string, losers: string): boolean {
  if (date.length <= 0
    || difference.length <= 0
    || winners.length <= 0
    || losers.length <= 0) {
    return false;
  }
  return true;
}

function readAllGames(sourceFile: string): GameInfo[] {
  let games: GameInfo[] = new Array<GameInfo>();
  const fileContents = fs.readFileSync(sourceFile, 'utf8');
  let lines = fileContents.split(os.EOL);

  let cachedDate = '';
  let cachedDifference = '';
  let cachedWinners = '';
  let cachedLosers = '';
  lines.forEach(singleLine => {
    if (singleLine.length <= 0) {
      if (hasFullGameInfo(cachedDate, cachedDifference, cachedWinners, cachedLosers)) {
        games.push(GameInfo.fromSimpleData(cachedDate, cachedDifference, cachedWinners, cachedLosers));
        cachedDate = '';
        cachedDifference = '';
        cachedWinners = '';
        cachedLosers = '';
      }
      return;
    }
    if (singleLine.startsWith('//')) {
      if (hasFullGameInfo(cachedDate, cachedDifference, cachedWinners, cachedLosers)) {
        games.push(GameInfo.fromSimpleData(cachedDate, cachedDifference, cachedWinners, cachedLosers));
      }
      cachedDate = '';
      cachedDifference = '';
      cachedWinners = '';
      cachedLosers = '';
      return;
    }
    if (singleLine.startsWith('date:')) {
      cachedDate = singleLine.substr(5).trim();
      return;
    }
    if (singleLine.startsWith('difference:')) {
      cachedDifference = singleLine.substr(11).trim();
      return;
    }
    if (singleLine.startsWith('winners:')) {
      cachedWinners = singleLine.substr(8).trim();
      return;
    }
    if (singleLine.startsWith('losers:')) {
      cachedLosers = singleLine.substr(7).trim();
      return;
    }
  })
  return games;
}

function readAllPlayers(sourceFile: string): Player[] {
  let players: Player[] = new Array<Player>();

  const fileContents = fs.readFileSync(sourceFile, 'utf8');

  let lines = fileContents.split(os.EOL);
  lines.forEach(singleLine => {
    singleLine = singleLine.trim();
    if (singleLine.length <= 0) {
      return;
    }
    if (singleLine.startsWith('//')) {
      return;
    }
    if (singleLine.startsWith('TempOut: ')) {
      return;
    }

    players.push(Player.fromNameAndRating(singleLine));
  });

  return players;
}

function readTempOutPlayerNames(sourceFile: string): string[] {
  let players: string[] = new Array<string>();

  const fileContents = fs.readFileSync(sourceFile, 'utf8');

  let lines = fileContents.split(os.EOL);
  lines.forEach(singleLine => {
    singleLine = singleLine.trim();
    if (singleLine.length <= 0) {
      return;
    }
    if (singleLine.startsWith('//')) {
      return;
    }
    if (singleLine.startsWith('TempOut: ')) {
      let outPlayer = singleLine.split(':');
      if (outPlayer.length >= 2) {
        players.push(outPlayer[1].trim());
      }
      return;
    }

    return;
  });

  return players;
}

function doTFLFilesExist() {
  let absolutePlayersFile = getPlayersFile();
  let absoluteGamesFile = getGamesFile();

  if (!fs.existsSync(absoluteGamesFile)) {
    console.log('Failed to locate file', absoluteGamesFile);
    return false;
  };
  if (!fs.existsSync(absolutePlayersFile)) {
    console.log('Failed to locate file', absolutePlayersFile);
    return false;
  };

  return true;
}

function updateRatingsForGame(players: Player[], game: GameInfo): Player[] {
  return players.map(player => {
    // if the game contains the player name in the winner list
    // or the loser list modify the rating.
    // otherwise, just leave it as it is.
    if (game.winnerPlayerNames.includes(player.name)) {
      // improve rating (lower numerical value)
      player.rating -= player.rating * (0.02 + game.difference * 0.002);
      return player;
    } else if (game.losingPlayerNames.includes(player.name)) {
      // worsen rating (higher numerical value)
      player.rating += player.rating * (0.02 + game.difference * 0.002);
      return player;
    } else {
      return player;
    }
  })
}

function getUpdatedActivePlayerRatings(): Player[] {

  let players = readAllPlayers(getPlayersFile());
  let tempOutPlayers = readTempOutPlayerNames(getPlayersFile());

  let filteredPlayers = players.filter((value, index, array) => {
    return !tempOutPlayers.includes(value.name);
  });

  let gamesList = readAllGames(getGamesFile());
  let count = 0;

  // console.log('----------- BEFORE ----------');
  // count = 0;
  // filteredPlayers.forEach(player => {
  //   console.log(count++ + ') ' + player.name + ' - ' + player.rating);
  // });
  // console.log('-----------');

  count = 0;
  // gamesList.forEach(game => {
  //   console.log(count++ + ') ' + game.toSimpleString());
  // });

  // apply game change to players' ratings
  gamesList.forEach(game => {
    filteredPlayers = updateRatingsForGame(filteredPlayers, game);
  });

  return filteredPlayers;
}

function main() {
  if (!doTFLFilesExist()) {
    console.log('Some files are missing');
    return;
  }

  let count = 0;
  let activePlayers = getUpdatedActivePlayerRatings();

  // console.log('----------- AFTER ---------');
  // count = 0;
  // activePlayers.forEach(player => {
  //   console.log(count++ + ') ' + player.name + ' - ' + player.rating);
  // });
  // console.log('-----------');

  // get the players for the current session.
  let currentSessionPlayerNames: string[] = [
    'Dragos (via Dani B)',
    'Florin Lascu',
    'Florin Negoita',
    'Madalin (Adam)',

    'Maxim (Cretu)',
    'Nicu (Cucu)',
    'Rares (Onescu)',
    'Vlad (Tatar)',

    'Dan (Nedelea)',
    'Lorand (Borca)',
    'Mihai (Apostolache)',
    'Sebastian (Ratiu)'
  ];

  // get the player objects matching these names.
  let currentSessionPlayers = activePlayers.filter((player, index, array) => {
    return currentSessionPlayerNames.includes(player.name);
  });

  // sort the players.
  currentSessionPlayers.sort((a, b) => {
    if (a.rating < b.rating) {
      return -1;
    } else if (a.rating === b.rating) {
      return 0;
    }
    return 1;
  });

  console.log('----------- THIS SESSION ---------');
  count = 0;
  currentSessionPlayers.forEach(player => {
    console.log(++count + ') ' + player.name + ' - ' + player.rating);
  });
  console.log('-----------');

  getAllCombinations(currentSessionPlayers);

}

function getAllCombinations(players: Player[]) {
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
  let listOfOptions = new Array<{ value: Number, diff: Number, combination: String }>();
  let totalNumberOfPlayers = players.length;
  let idealNumberOfPlayers = players.length / 2;
  let totalSum = 0;
  players.forEach(player => {
    totalSum += player.rating;
  });

  let customCounter = Math.pow(2, idealNumberOfPlayers) - 2;
  let maxValue = Math.pow(2, players.length) - 1;
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
    if (diff < 0) diff = -diff;
    listOfOptions.push({ value: sum, diff: diff, combination: stringifiedBinary });
    // console.log(++numOptions + ')' + stringifiedBinary + ' - sum: ' + sum + ' - diff: ' + diff);
  }

  // sort the list according to the difference
  listOfOptions.sort((a, b) => {
    if (a.diff < b.diff) {
      return -1;
    } else if (a.diff === b.diff) {
      return 0;
    }
    return 1;
  });

  listOfOptions.forEach((item, index) => {
    console.log(1 + index + ')' + item.combination + ' - diff: ' + item.diff);
  })

  if (listOfOptions.length > 10) {
    for (let i = 0; i < 10; ++i) {
      let stringifiedBinary = listOfOptions[i].combination;
      let names = '';
      let otherNames = '';
      // split the string to an array and add the names
      stringifiedBinary.split('').forEach((value, index, array) => {
        if (value === '1') {
          names += players[index].name + ', ';
        } else {
          otherNames += players[index].name + ', ';
        }
      });
      console.log(1 + i + ')' + stringifiedBinary + ' - diff: ' + listOfOptions[i].diff + '; ' + names);
    }
  }

  console.log('Ideal balance value', totalSum / 2, 'from', totalSum);
}

main();