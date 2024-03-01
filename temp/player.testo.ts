export class PlayerTestO {

  id?: number;

  constructor(public name: string, public rating: number) {
  }

  public static fromNameAndRating(nameAndRating: string): PlayerTestO {
    let parsedName: string;
    let parsedRating: number;
    // E.g. Johny (Guy) : 1.952
    let splitContent = nameAndRating.split(':');
    if (splitContent.length < 2) {
      return new PlayerTestO("invalid name", 0);
    }

    parsedName = splitContent[0].trim();
    parsedRating = parseFloat(splitContent[1]);

    return new PlayerTestO(parsedName, parsedRating);
  }
}
