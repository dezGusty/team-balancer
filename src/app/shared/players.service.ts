import { Player } from './player.model';
import { EventEmitter, Injectable } from '@angular/core';
import { AngularFirestore, QuerySnapshot } from 'angularfire2/firestore';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PlayersService {
    private subscription: Subscription;

    private useDB = true;
    private testPlayerList: Player[] = [
        new Player(1, 'Johnny'),
        new Player(2, 'gus'),
        new Player(3, 'iulian'),
        new Player(4, 'mircea')
    ];

    // constructor.
    constructor(private db: AngularFirestore, private authSvc: AuthService) {

        this.authSvc.onSignInOut.subscribe((message) => {
            if (message === 'signout-pending') {
                this.unsubscribeFromDataSources();
            } else {
                //...
            }
        });

        if (!this.useDB) {
            this.playerList = this.testPlayerList;
            return;
        }

        // subscribe to firebase collection changes.
        const playersCol = this.db.collection<Player>('players');
        this.serverPlayers = playersCol.valueChanges();

        this.subscription = this.serverPlayers.subscribe(
            (values) => {
                console.log('[players] firebase data change', values);

                this.playerList = values;
                this.playerDataChangeEvent.emit();
            }
        );
    }

    private serverPlayers: Observable<Player[]>;

    private playerList: Player[] = [];

    playerSelectedEvent = new EventEmitter<Player>();
    playerDataChangeEvent = new EventEmitter<Player>();

    unsubscribeFromDataSources() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    getPlayers() {
        return this.playerList.slice();
    }

    addPlayer(player: Player) {
        console.log('[playerssvc] added player');
        this.playerList.push(player);
        this.saveSinglePlayerToFirebase(player);
    }

    getPlayerById(id: number) {
        return this.playerList.find(
            item => item.id === id);
    }

    updatePlayer(oldPlayer: Player, newPlayer: Player): boolean {
        const oldIndex = this.playerList.indexOf(oldPlayer);
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }
        if (oldPlayer.id !== newPlayer.id) {
            // old entry not found?
            console.warn('Tried to update a player using a different ID. Update is meant for the same player ID.');
            return false;
        }
        this.playerList[oldIndex] = newPlayer;
        console.log('Replaced player. New one', newPlayer);
        this.updateSinglePlayerToFirebase(newPlayer);
        return true;
    }

    updatePlayerById(id: number, newPlayer: Player): boolean {
        const oldIndex = this.playerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.playerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);

        this.updateSinglePlayerToFirebase(newPlayer);

        return true;
    }

    createDefaultPlayer(): Player {
        // get the id.
        const newID = Math.max.apply(
            Math,
            this.playerList.map((item) => item.id))
            + 1;

        const newName = 'new_player_' + Date.now().toFixed() + '_' + newID;
        const result = new Player(newID, newName);

        return result;
    }

    saveAllPlayers() {
        const playersRef = this.db.collection('/players').ref;
        this.playerList.forEach((player) => {
            let obj = {};
            obj = { ...player };
            playersRef.doc(player.id.toString()).set(obj);
        });
    }

    saveSinglePlayerToFirebase(player: Player) {
        const playersRef = this.db.collection('/players').ref;
        const obj = { ...player };
        playersRef.doc(player.id.toString()).set(obj);
    }

    updateSinglePlayerToFirebase(player: Player) {
        const playersRef = this.db.collection('/players').ref;
        const obj = { ...player };
        playersRef.doc(player.id.toString()).update(obj);
    }


}
