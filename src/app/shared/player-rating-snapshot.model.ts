import { Player } from "./player.model";
import { RatingSystem } from "./rating-system";

export class PlayerRatingSnapshot {
  public players: Player[] = [];
  public ratingSystem: RatingSystem = RatingSystem.Progressive;
  public label: string = '';
  public version: number = 1;
}