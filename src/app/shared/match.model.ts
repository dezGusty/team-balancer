import { Player } from './player.model';

export class Match {
    public description: string;
    public players: Player[];

    constructor(public date: Date) {

    }
}
