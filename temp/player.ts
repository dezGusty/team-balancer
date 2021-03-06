export class Player {
  constructor(public name: string, public rating: number) {
  }

  public static fromNameAndRating(nameAndRating: string): Player {
    let parsedName: string;
    let parsedRating: number;
    // E.g. Johny (Guy) : 1.952
    let splitContent = nameAndRating.split(':');
    if (splitContent.length < 2) {
      return null;
    }

    parsedName = splitContent[0].trim();
    parsedRating = parseFloat(splitContent[1]);

    return new Player(parsedName, parsedRating);
  }
}
