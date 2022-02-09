import { Player } from './player.model';
import { EventEmitter, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from './custom-prev-game.model';
import { AppStorage } from './app-storage';
import firebase from 'firebase';
import { map } from 'rxjs/operators';

enum RatingSystem {
    German = 1,
    Romanian
};

/**
 * Stores and retrieves player related information.
 */
@Injectable()
export class PlayersService {
    private dataChangeSubscription: Subscription;

    // constructor.
    constructor(
        private db: AngularFirestore,
        private authSvc: AuthService,
        private appStorage: AppStorage) {
        if (!this.authSvc.isAuthenticated()) {
            console.log('[players] waiting for login...');
        }

        // Load the cached players from the session storage.
        const cachedPlayers = appStorage.getAppStorageItem('players');
        if (cachedPlayers) {
            this.playerList = JSON.parse(cachedPlayers);
        }

        // Subscribe to the login-logout events.
        this.authSvc.onSignInOut.subscribe((message) => {
            if (message === 'signout-pending') {
                this.unsubscribeFromDataSources();
            } else if (message === 'signin-done') {
                this.subscribeToDataSources();
            } else {
                console.log('[players] unexpected message from auth svc: ' + message);
            }
        });

        // if already logged in, there will be no notification for signin-done.
        // simulate the event now.
        if (this.authSvc.isAuthenticated()) {
            this.subscribeToDataSources();
        }
    }

    private playerList: Player[] = [];

    playerDataChangeEvent = new EventEmitter<Player>();

    subscribeToDataSources() {
        console.log('[players] subscribing to data sources');

        // subscribe to firebase collection changes.
        const currentRatings = this.db.doc('ratings/current').get();
        this.dataChangeSubscription = currentRatings.subscribe(playerListDoc => {
            if (!playerListDoc.exists) {
                return;
            }

            const playersArray: Player[] = playerListDoc.get('players');
            this.playerList = playersArray;
            this.appStorage.setAppStorageItem('players', JSON.stringify(this.playerList));
            this.playerDataChangeEvent.emit();
        });
    }

    unsubscribeFromDataSources() {
        console.log('[players] unsubscribing from data sources');
        if (this.dataChangeSubscription) {
            this.dataChangeSubscription.unsubscribe();
        }
    }

    getPlayers() {
        console.log("TEST");
        console.log(this.playerList);
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

    /**
     * Updates a player, based on the ID.
     * @param id The ID of the player.
     * @param newPlayer The new object (already constructed) to use.
     */
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
        const newID = this.playerList.length ? Math.max.apply(
            Math,
            this.playerList.map((item) => item.id))
            + 1 : 0;


        const newName = 'new_player_' + Date.now().toFixed() + '_' + newID;
        const result = new Player(newID, newName);

        return result;
    }

    saveAllPlayers() {
        this.savePlayersToList(this.playerList, 'current');
    }

    public savePlayersToList(playersArr: Player[], listName: string) {
        const docRef = this.db.doc('ratings/' + listName).ref;
        const obj = { players: playersArr };
        docRef.set(obj, { merge: true });
    }

    public addFieldValueToDocument(fieldName: string, value: any, documentName: string) {
        const docRef = this.db.doc('ratings/' + documentName);
        var obj = {};
        obj[fieldName] = value;
        docRef.update(obj);
    }

    public removeFieldFromDocument(fieldName: string, documentName: string) {
        const docRef = this.db.doc('ratings/' + documentName);
        docRef.update({[fieldName] : firebase.firestore.FieldValue.delete()});
    }

    public getCurrentRatings() : Observable<any> {
        return this.db.doc('ratings/current').get().pipe(
            map(currentDoc => {
                return currentDoc.data();
            })
        );
    }

    async deleteCollection(db, collectionPath, batchSize) {
        const collectionRef = db.collection(collectionPath).ref;
        const query = collectionRef.orderBy('__name__').limit(batchSize);
        return new Promise((resolve, reject) => {
          this.deleteQueryBatch(db, query, resolve).catch(reject);
        });
    }
    async deleteQueryBatch(db, query, resolve) {
        const snapshot = await query.get();
      
        const batchSize = snapshot.size;
        if (batchSize === 0) {
          resolve();
          return;
        }

        const batch = db.firestore.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        this.deleteQueryBatch(db, query, resolve);
      }

    async getNumberOfDocumentsInCollection(collectionPath) {
        let snapshot = await this.db.collection(collectionPath).get().toPromise();
        return snapshot.size;
    }

    public async dropPlayerRatings() {
        let size = await this.getNumberOfDocumentsInCollection('ratings');
        await this.deleteCollection(this.db, 'ratings', size);
    }

    saveSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }

    updateSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }

    public async getRatingHistory() : Promise<Map<string, Player[]>> {
        const ratings = this.db.collection('ratings/');
        const snapshot = await ratings.get();
        
        let history = new Map<string, Player[]>();
        snapshot.forEach(doc => {
            doc.docs.forEach(test => {
                if(test.id !== 'current') {
                    history.set(test.id, test.data() as Player[]);
                }
            });
        });
        return history;
    }

    public updateRatingsForGame(players: Player[], game: CustomPrevGame, ratingSystem = 1 /*Default old German system*/): Player[] {
        if (game.scoreTeam1 == null || game.scoreTeam2 == null
            || game.scoreTeam1 === game.scoreTeam2) {
            // nothing to do
            return players.slice();
        }

        // (deep) clone the array
        const playersCpy = players.map(x => ({ ...x }));

        const difference = game.scoreTeam1 - game.scoreTeam2;
        let winners: string[] = [];
        let losers: string[] = [];
        if (difference > 0) {
            winners = game.team1.map((player) => player.name);
            losers = game.team2.map((player) => player.name);
        } else {
            losers = game.team1.map((player) => player.name);
            winners = game.team2.map((player) => player.name);
        }

        switch(ratingSystem) {
            case 1:
                return playersCpy.map(player => {
                    // if the game contains the player name in the winner list
                    // or the loser list modify the rating.
                    // otherwise, just leave it as it is.
                    if (winners.includes(player.name)) {
                        // improve rating (lower numerical value)
                        player.rating -= player.rating * (0.02 + difference * 0.002);
                        return player;
                    } else if (losers.includes(player.name)) {
                        // worsen rating (higher numerical value)
                        player.rating += player.rating * (0.02 + difference * 0.002);
                        return player;
                    } else {
                        return player;
                    }
                });
            case 2:
                return playersCpy.map(player => {
                    if (winners.includes(player.name)) {
                        player.rating += player.rating * (0.02 + difference * 0.002);
                        if(player.rating > 10) {
                            player.rating = 10;
                        }
                        return player;
                    } else if (losers.includes(player.name)) {
                        player.rating -= player.rating * (0.02 + difference * 0.002);
                        if(player.rating < 1) {
                            player.rating = 1;
                        }
                        return player;
                    } else {
                        return player;
                    }
                });
        }
    }
}
