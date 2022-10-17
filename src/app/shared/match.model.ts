import { Player } from './player.model';

export class Match {
    public description: string = '';
    public availablePlayersPool: Player[] = [];
    public draftPlayers: Player[] = [];
    public matchState: string;

    constructor(public date: Date) {
        this.matchState = 'draft phase';
    }

    removePlayerFromPool(newPlayer: Player) {
        const existingPos = this.availablePlayersPool.indexOf(newPlayer);
        if (existingPos !== -1) {
            this.availablePlayersPool.splice(existingPos, 1);
            // Also reassign to force Angular to identify that the object
            // was modified and a refresh of the bound data is issued.
            this.availablePlayersPool = [...this.availablePlayersPool];
        } else {
            console.log('[match] failed to remove player from pool', newPlayer);
        }
    }

    removePlayerFromDraft(newPlayer: Player) {
        const existingPos = this.draftPlayers.indexOf(newPlayer);
        if (existingPos !== -1) {
            this.draftPlayers.splice(existingPos, 1);
            // Also reassign to force Angular to identify that the object
            // was modified and a refresh of the bound data is issued.
            this.draftPlayers = [...this.draftPlayers];
        } else {
            console.log('[match] failed to remove player from draft', newPlayer);
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

    setMultiPlayersToDraftById(draftedPlayerIDs: number[]): boolean {

        this.draftPlayers = this.availablePlayersPool.filter(
            player => draftedPlayerIDs.findIndex(item => item === player.id) !== -1
        );
        this.availablePlayersPool = this.availablePlayersPool.filter(
            player => draftedPlayerIDs.findIndex(item => item === player.id) === -1
        );
        return true;
    }

    movePlayerBackToPool(player: Player): boolean {
        if (!this.draftPlayers.includes(player)) {
            console.log('[match] cannot pop player [' + player.name + '] ');
            return false;
        }

        console.log('moving player[' + player.name + '] back to the pool');
        this.removePlayerFromDraft(player);
        this.availablePlayersPool.push(player);
        // Also reassign to force Angular to identify that the object
        // was modified and a refresh of the bound data is issued.
        this.availablePlayersPool = [...this.availablePlayersPool];
        return true;
    }
}
