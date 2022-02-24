import { Player } from './player.model';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from './custom-prev-game.model';
import { AppStorage } from './app-storage';
import firebase from 'firebase/compat/app';
import { map } from 'rxjs/operators';
import { RatingSystem, RatingSystemSettings } from './rating-system';
import { PlayerChangeInfo } from './player-changed-info';
import { TemplateLiteral } from '@angular/compiler';

/**
 * Stores and retrieves player related information.
 */
@Injectable()
export class PlayersService {
    private dataChangeSubscriptions: Subscription[] = [];
    private currentRatingSystem: RatingSystem;
    private currentLabel: string;

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
            this.currentPlayerList = JSON.parse(cachedPlayers);
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

    private currentPlayerList: Player[] = [];
    private archivedPlayerList: Player[] = [];

    // playerDataChangeEvent = new EventEmitter<PlayerChangeInfo>();
    playerDataChangeEvent = new BehaviorSubject<PlayerChangeInfo>(null);

    subscribeToDataSources() {
        console.log('[players] subscribing to data sources');

        // subscribe to firebase collection changes.
        const currentRatings = this.db.doc('ratings/current').get();
        this.dataChangeSubscriptions.push(currentRatings.subscribe(playerListDoc => {
            console.log('[players] current ratings watcher notified');

            if (!playerListDoc.exists) {
                this.playerDataChangeEvent.next(new PlayerChangeInfo(null, 'error', 'Could not connect to DB'));
                return;
            }

            const playersArray: Player[] = playerListDoc.get('players');
            this.currentRatingSystem = playerListDoc.get('ratingSystem');
            this.currentLabel = playerListDoc.get('label');
            this.currentPlayerList = playersArray;
            this.appStorage.setAppStorageItem('players', JSON.stringify(this.currentPlayerList));
            this.playerDataChangeEvent.next(new PlayerChangeInfo(this.currentPlayerList, 'info', 'Players loaded'));
        }));

        const archivedRatings = this.db.doc('ratings/archive').get();
        this.dataChangeSubscriptions.push(archivedRatings.subscribe(playerListDoc => {
            console.log('[players] archived ratings watcher notified');

            if (!playerListDoc.exists) {
                this.playerDataChangeEvent.next(new PlayerChangeInfo(null, 'error', 'Could not connect to DB'));
                return;
            }

            const playersArray: Player[] = playerListDoc.get('players');
            playersArray.forEach(x => x.isArchived = true);
            this.archivedPlayerList = playersArray;
            this.appStorage.setAppStorageItem('archived_players', JSON.stringify(this.archivedPlayerList));
            this.playerDataChangeEvent.next(new PlayerChangeInfo(this.archivedPlayerList, 'info', 'Archive loaded'));
        }));
    }

    unsubscribeFromDataSources() {
        console.log('[players] unsubscribing from data sources');
        this.dataChangeSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    getPlayers(includeArchive: boolean = false): Player[] {
        if (includeArchive) {
            return this.currentPlayerList.concat(this.archivedPlayerList);
        } else {
            return this.currentPlayerList.slice();
        }
    }

    addPlayer(player: Player) {
        console.log('[playerssvc] added player');
        this.currentPlayerList.push(player);
        this.saveSinglePlayerToFirebase(player);
    }

    movePlayerToArchive(player: Player) {
        console.log('[playerscv] archiving player');

        // remove the element from the current player array
        const tempPlayerList = this.currentPlayerList.filter(x => x != player);
        if (tempPlayerList.length === this.currentPlayerList.length) {
            // we should have removed an entry.
            // this should not happen!
            return;
        }

        // ensure that the player is available only once.
        this.archivedPlayerList.push(player);
        this.archivedPlayerList = [...new Set(this.archivedPlayerList)];

        this.currentPlayerList = tempPlayerList;

        this.savePlayersArrayToDoc(this.archivedPlayerList, 'archive').then(_ => {
            // successfully saved archive.
            // can now also save the regular player list: we won't lose a player, at worst a duplicate
            this.savePlayersArrayToDoc(this.currentPlayerList, 'current').then(_ => {
                const playerInfo = new PlayerChangeInfo(this.currentPlayerList, 'info', `moved player ${player.name} to archive.`);

                this.playerDataChangeEvent.next(playerInfo);
            });
        });
    }

    pullPlayerFromArchive(player: Player) {
        console.log('[playerscv] unarchiving player');

        // remove the element from the current player array
        const tempPlayerList = this.archivedPlayerList.filter(x => x === player);
        if (tempPlayerList.length === this.archivedPlayerList.length) {
            // we should have removed an entry.
            // this should not happen!
            return;
        }

        // ensure that the player is available in the current list
        this.currentPlayerList.push(player);

        this.savePlayersArrayToDoc(this.currentPlayerList, 'ratings/current').then(_ => {
            // successfully saved archive.
            // can now also save the regular player list: we won't lose a player, at worst a duplicate
            this.savePlayersArrayToDoc(this.archivedPlayerList, 'ratings/current').then(_ => {
                const playerInfo = new PlayerChangeInfo(this.archivedPlayerList, 'info', `moved player ${player.name} to current.`);

                this.playerDataChangeEvent.next(playerInfo);
            });
        });
    }

    getPlayerById(id: number) {
        return this.currentPlayerList.find(
            item => item.id === id);
    }

    /**
     * Updates a player, based on the ID.
     * @param id The ID of the player.
     * @param newPlayer The new object (already constructed) to use.
     */
    updatePlayerById(id: number, newPlayer: Player): boolean {
        const oldIndex = this.currentPlayerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.currentPlayerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);

        this.updateSinglePlayerToFirebase(newPlayer);

        return true;
    }

    createDefaultPlayer(): Player {
        // get the id.
        const newID = this.currentPlayerList.length ? Math.max.apply(
            Math,
            this.currentPlayerList.map((item) => item.id))
            + 1 : 0;


        const newName = 'new_player_' + Date.now().toFixed() + '_' + newID;
        const result = new Player(newID, newName);

        return result;
    }

    saveAllPlayers() {
        this.savePlayersToList(this.currentPlayerList, 'current');
    }

    public savePlayersArrayToDoc(playersArr: Player[], listName: string): Promise<void> {
        const docPath = 'ratings/' + listName;
        const docRef = this.db.doc(docPath).ref;
        const obj = { players: playersArr };
        console.log('setting data in ' + docPath, obj);
        return docRef.set(obj, { merge: true });
    }

    public savePlayersToList(playersArr: Player[], listName: string) {
        this.savePlayersArrayToDoc(playersArr, listName)
            .then(_ => {
                const playerInfo = new PlayerChangeInfo(playersArr, 'info', 'Saved players to list ' + listName);
                console.log('emitting ', playerInfo);

                this.playerDataChangeEvent.next(playerInfo);
            }
            ).catch(reason =>
                this.playerDataChangeEvent.next(new PlayerChangeInfo(playersArr, 'error', 'Failed to save player list because of ' + reason))
            );
    }

    public addFieldValueToDocument(fieldName: string, value: any, documentName: string) {
        const docRef = this.db.doc('ratings/' + documentName);
        var obj = {};
        obj[fieldName] = value;
        docRef.update(obj);
    }

    public removeFieldFromDocument(fieldName: string, documentName: string) {
        const docRef = this.db.doc('ratings/' + documentName);
        docRef.update({ [fieldName]: firebase.firestore.FieldValue.delete() });
    }

    public getCurrentRatings(): Observable<any> {
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

    public getCurrentRatingSystem(): RatingSystem {
        return this.currentRatingSystem;
    }

    public async getRatingHistory(): Promise<Map<string, Player[]>> {
        const ratings = this.db.collection('ratings/');
        const snapshot = await ratings.get();

        let history = new Map<string, Player[]>();
        snapshot.forEach(doc => {
            doc.docs.forEach(test => {
                if (test.id !== 'current') {
                    history.set(test.id, test.data() as Player[]);
                }
            });
        });
        return history;
    }

    /**
     * Updates an individual player according to the result of a game.
     * @param player The player to update
     * @param winners The winning team
     * @param losers  The losing team
     * @param difference The difference in goals
     * @param ratingSystem The used rating system
     * @returns 
     */
    private updateIndividualRatingForGame(
        player: Player,
        winners: string[],
        losers: string[],
        difference: number,
        ratingSystem: RatingSystem = RatingSystem.German): Player {
        if (difference === 0) {
            return player;
        }

        // Winners earn points and losers lose points in some rating systems.
        // Or the other way around in other rating systems. Use the sign for this.
        let sign = 0;

        if (winners.includes(player.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForWinner(ratingSystem);
        } else if (losers.includes(player.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForLoser(ratingSystem);
        }

        player.rating = player.rating + sign * (
            RatingSystemSettings.GetFixedMultiplierForMatch(ratingSystem)
            + difference * RatingSystemSettings.GetGoalMultiplierForMatch(ratingSystem));
        return player;
    }

    public updateRatingsForGame(players: Player[], game: CustomPrevGame, ratingSystem: RatingSystem = RatingSystem.German): Player[] {
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

        return playersCpy.map(player => this.updateIndividualRatingForGame(player, winners, losers, difference, ratingSystem));

        // // TODO: separate to subfunction, use RatingSystemSettings 
        // switch (ratingSystem) {
        //     case 1:
        //         return playersCpy.map(player => {
        //             // if the game contains the player name in the winner list
        //             // or the loser list modify the rating.
        //             // otherwise, just leave it as it is.
        //             if (winners.includes(player.name)) {
        //                 // improve rating (lower numerical value)
        //                 player.rating -= player.rating * (0.02 + difference * 0.002);
        //                 return player;
        //             } else if (losers.includes(player.name)) {
        //                 // worsen rating (higher numerical value)
        //                 player.rating += player.rating * (0.02 + difference * 0.002);
        //                 return player;
        //             } else {
        //                 return player;
        //             }
        //         });
        //     case 2:
        //         return playersCpy.map(player => {
        //             if (winners.includes(player.name)) {
        //                 player.rating += player.rating * (0.02 + difference * 0.002);
        //                 if (player.rating > 10) {
        //                     player.rating = 10;
        //                 }
        //                 return player;
        //             } else if (losers.includes(player.name)) {
        //                 player.rating -= player.rating * (0.02 + difference * 0.002);
        //                 if (player.rating < 1) {
        //                     player.rating = 1;
        //                 }
        //                 return player;
        //             } else {
        //                 return player;
        //             }
        //         });
        // }
    }
}
