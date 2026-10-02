import { Player } from "./player.model";

/**
 * Stores player specific change information 
 */
export class PlayerChangeInfo {


  constructor(public players: Player[], public messageType: string, public messagePayload: string) {
  }
}