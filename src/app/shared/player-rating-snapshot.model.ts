import { Player } from "./player.model";

export class PlayerRatingSnapshot {
  public players: Player[] = [];
  public label: string = '';
  public version: number = 1;
}