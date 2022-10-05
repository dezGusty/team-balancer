import { Player } from "./player.model";
import { RatingSystem } from "./rating-system";

export class PlayerRatingSnapshot {
  public players: Player[];
  public ratingSystem: RatingSystem;
  public label: string;
  public version: number;
}