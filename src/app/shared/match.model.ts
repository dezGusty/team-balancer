import { Player } from './player.model';

export class Match {
    public description: string;
    public availablePlayersPool: Player[] = [];
    public draftPlayers: Player[] = [];
    public matchState: string;
    public targetCount: number;

    constructor(public date: Date) {
        this.matchState = 'draft phase';
        this.targetCount = 12; // TODO: move to constants
    }

    removePlayerFromPool(newPlayer: Player) {
        const existingPos = this.availablePlayersPool.indexOf(newPlayer);
        if (existingPos !== -1) {
            this.availablePlayersPool.splice(existingPos, 1);
        }
    }

    removePlayerFromDraft(newPlayer: Player) {
        const existingPos = this.draftPlayers.indexOf(newPlayer);
        if (existingPos !== -1) {
            this.draftPlayers.splice(existingPos, 1);
        }
    }

    movePlayerToDraft(newPlayer: Player): boolean {
        if (this.draftPlayers.includes(newPlayer)) {
            console.log('[match] player [' + newPlayer.name + '] already drafted');
            return false;
        }

        this.removePlayerFromPool(newPlayer);
        this.draftPlayers.push(newPlayer);

        return true;
    }

    movePlayerBackToPool(player: Player): boolean {
        if (!this.draftPlayers.includes(player)) {
            console.log('[match] cannot pop player [' + player.name + '] ');
            return false;
        }

        this.removePlayerFromDraft(player);
        this.availablePlayersPool.push(player);
        return true;
    }
}
