export class Player {

  id?: number;

  constructor(public name: string, public rating: number) {
  }

  public static fromNameAndRating(nameAndRating: string): Player {
    let parsedName: string;
    let parsedRating: number;
    // E.g. Johny (Guy) : 1.952
    let splitContent = nameAndRating.split(':');
    if (splitContent.length < 2) {
      return new Player("invalid name", 0);
    }

    parsedName = splitContent[0].trim();
    parsedRating = parseFloat(splitContent[1]);

    return new Player(parsedName, parsedRating);
  }
}
