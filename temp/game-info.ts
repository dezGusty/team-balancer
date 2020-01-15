export class GameInfo {
  public date: string;
  public difference: number;
  public winnerPlayerNames: string[];
  public losingPlayerNames: string[];

  public static fromSimpleData(date: string, diff: string, winners: string, losers: string): GameInfo {
    const game = new GameInfo();
    game.date = date;
    game.difference = parseInt(diff, 10);
    game.winnerPlayerNames = winners.split(',');
    game.losingPlayerNames = losers.split(',');

    game.winnerPlayerNames = game.winnerPlayerNames.map(playerName => {
      return playerName.trim();
    });

    game.losingPlayerNames = game.losingPlayerNames.map(playerName => {
      return playerName.trim();
    });

    return game;
  }

  public toSimpleString(): string {
    let description = 'Game on [' + this.date + '] had a diff of [' + this.difference
      + '] won by [' + '\n';
    this.winnerPlayerNames.forEach(playerName => {
      description += '+ (' + playerName + ')' + '\n';
    });
    description += '] against ' + '\n';
    this.losingPlayerNames.forEach(playerName => {
      description += '- (' + playerName + ')' + '\n';
    });
    description += ']';
    return description;
  }
}
