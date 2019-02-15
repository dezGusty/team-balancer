import { Player } from './player.model';

export class Match {
    public description: string;
    public players: Player[];
    public matchState: string;

    constructor(public date: Date) {
        this.matchState = 'draft phase';
    }
}
