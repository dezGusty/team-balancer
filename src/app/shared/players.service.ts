import { Player } from './player.model';
import { EventEmitter } from '@angular/core';

export class PlayersService {
    private playerList: Player[] = [
        new Player(1, 'johny'),
        new Player(2, 'gus'),
        new Player(3, 'iulian'),
        new Player(4, 'mircea')
    ];

    playerSelected = new EventEmitter<Player>();

    getPlayers() {
        return this.playerList.slice();
    }

    addPlayer(player: Player) {
        this.playerList.push(player);
    }




}
