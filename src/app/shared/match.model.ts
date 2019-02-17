import { Player } from './player.model';

export class Match {
    public description: string;
    public players: Player[] = [];
    public matchState: string;
    public targetCount: number;

    constructor(public date: Date) {
        this.matchState = 'draft phase';
        this.targetCount = 12; // TODO: move to constants
    }

    addPlayer(newPlayer: Player): boolean {
        if (this.players.includes(newPlayer)) {
            return false;
        }

        this.players.push(newPlayer);
        return true;
    }
}
