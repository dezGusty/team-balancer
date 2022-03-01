import { Player } from "./player.model";

export class PlayerChangeInfo {


  constructor(public players: Player[], public messageType: string, public messagePayload: string) {
  }
}