import { Player } from "./player.model";

export class DraftChangeInfo {


  constructor(public players: Player[], public messageType: string, public messagePayload: string) {
  }
}