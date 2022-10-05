import { Player } from "./player.model";
import { RatingSystem } from "./rating-system";

export class RatingHist {
  public players: Player[] = [];
  public ratingSystem: RatingSystem = RatingSystem.Progressive;
}