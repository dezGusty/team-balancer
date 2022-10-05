import { Player } from './player.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CustomPrevGame } from './custom-prev-game.model';
import { AppStorage } from './app-storage';

import { RatingSystem, RatingSystemSettings } from './rating-system';
import { PlayerChangeInfo } from './player-change-info';
import { RatingHist } from './rating-hist.model';
import { AuthService } from '../auth/auth.service';
import { collection, doc, docData, Firestore, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { PlayerRatingSnapshot } from './player-rating-snapshot.model';

/**
 * Stores and retrieves player related information.
 */
@Injectable()
export class PlayersService {

    private dataChangeSubscriptions: Subscription[] = [];
    private currentRatingSystem: RatingSystem = RatingSystem.Progressive;
    private currentLabel: string = '';

    // constructor.
    constructor(
        private firestore: Firestore,
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

    playerDataChangeEvent = new BehaviorSubject<PlayerChangeInfo | undefined>(undefined);


    subscribeToDataSources() {
        console.log('[players] subscribing to data sources');

        // Emit an event to signal that the app is fetching / loading data
        const playerInfo = new PlayerChangeInfo([], 'loading', 'Fetching player data...');
        console.log('emitting ', playerInfo);
        this.playerDataChangeEvent.next(playerInfo);

        // subscribe to firebase collection changes.
        const ratingsDocRef = doc(this.firestore, '/ratings/current');
        this.dataChangeSubscriptions.push(docData(ratingsDocRef).subscribe({
            next: playerListDoc => {

                console.log('[players] current ratings watcher notified');

                // if (!playerListDoc.exists) {
                //     this.playerDataChangeEvent.next(new PlayerChangeInfo(null, 'error', 'Could not connect to DB'));
                //     return;
                // }
                const snap: PlayerRatingSnapshot = playerListDoc as PlayerRatingSnapshot;
                const playersArray: Player[] = snap.players; //playerListDoc.get('players');
                this.currentRatingSystem = snap.ratingSystem; //playerListDoc.get('ratingSystem');
                this.currentLabel = snap.label; //playerListDoc.get('label');
                this.currentPlayerList = playersArray;

                this.appStorage.setAppStorageItem('players', JSON.stringify(this.currentPlayerList));
                this.playerDataChangeEvent.next(new PlayerChangeInfo(this.currentPlayerList, 'info', 'Players loaded'));
            },
            error: err => console.log('[players-svc] some error encountered', err),
            complete:
                () => { console.log('[players-svc] complete') }
        }));

        const archiveDocRef = doc(this.firestore, 'ratings/archive');
        // const archivedRatings = this.db.doc('ratings/archive').get();
        this.dataChangeSubscriptions.push(docData(archiveDocRef).subscribe(playerListDoc => {
            console.log('[players] archived ratings watcher notified');

            // if (!playerListDoc.exists) {
            //     this.playerDataChangeEvent.next(new PlayerChangeInfo(null, 'error', 'Could not connect to DB'));
            //     return;
            // }

            const snap: PlayerRatingSnapshot = playerListDoc as PlayerRatingSnapshot;
            const playersArray: Player[] = snap.players; //playerListDoc.get('players');
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

    getCurrentLabel() {
        return this.currentLabel;
    }

    movePlayerToArchive(player: Player) {
        console.log('[playerscv] archiving player', player);

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
        console.log('[playerscv] unarchiving player', player);

        // remove the element from the current player array
        const tempPlayerList = this.archivedPlayerList.filter(x => x != player);
        if (tempPlayerList.length === this.archivedPlayerList.length) {
            // we should have removed an entry.
            // this should not happen!
            return;
        }

        // ensure that the player is available in the current list
        this.currentPlayerList.push(player);
        this.archivedPlayerList = tempPlayerList;

        this.savePlayersArrayToDoc(this.currentPlayerList, 'current').then(_ => {
            // successfully saved archive.
            // can now also save the regular player list: we won't lose a player, at worst a duplicate
            this.savePlayersArrayToDoc(this.archivedPlayerList, 'archive').then(_ => {
                const playerInfo = new PlayerChangeInfo(this.archivedPlayerList, 'info', `moved player ${player.name} to current.`);

                this.playerDataChangeEvent.next(playerInfo);
            });
        });
    }

    getPlayerById(id: number): Player | undefined {
        const searchedPlayer: Player | undefined = this.currentPlayerList.find(
            item => item.id === id);

        if (null != searchedPlayer) {
            return searchedPlayer;
        }

        return this.archivedPlayerList.find(
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

    /**
     * Updates a player, based on the ID.
     * @param id The ID of the player.
     * @param newPlayer The new object (already constructed) to use.
     */
    async updatePlayerByIdAsync(id: number, newPlayer: Player): Promise<boolean> {
        const oldIndex = this.currentPlayerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.currentPlayerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);

        await this.updateSinglePlayerToFirebase(newPlayer);
        return true;
    }

    /**
     * Updates a player, based on the ID.
     * @param id The ID of the player.
     * @param newPlayer The new object (already constructed) to use.
     */
    updateCachedPlayerById(id: number, newPlayer: Player): boolean {
        const oldIndex = this.currentPlayerList.findIndex((playerItem) => (playerItem.id === id));
        if (oldIndex === -1) {
            // old entry not found?
            console.warn('Tried to update a player, but did not find it in the previous entries list');
            return false;
        }

        this.currentPlayerList[oldIndex] = newPlayer;
        console.log('[players.svc] Replaced player for id ' + id + '. New one', newPlayer);
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

    async saveAllPlayers() {
        await this.savePlayersToListAsync(this.currentPlayerList, 'current');
    }

    public async savePlayersArrayToDoc(playersArr: Player[], listName: string): Promise<void> {
        const docName = 'ratings/' + listName;
        const obj = { players: playersArr };
        const docRef = doc(this.firestore, docName);
        console.log('setting data in ' + docName, obj);
        await setDoc(docRef, obj, { merge: true });
    }

    public async savePlayersToListAsync(playersArr: Player[], listName: string): Promise<void> {
        return this.savePlayersArrayToDoc(playersArr, listName)
            .then(_ => {
                const playerInfo = new PlayerChangeInfo(playersArr, 'info', 'Saved players to list ' + listName);
                console.log('emitting ', playerInfo);

                this.playerDataChangeEvent.next(playerInfo);
            }
            ).catch(reason =>
                this.playerDataChangeEvent.next(new PlayerChangeInfo(playersArr, 'error', 'Failed to save player list because of ' + reason))
            );
    }

    public async addFieldValueToDocumentAsync(fieldName: string, value: any, documentName: string) {
        const docName = 'ratings/' + documentName;
        const docRef = doc(this.firestore, docName);
        var obj = {};
        obj[fieldName] = value;
        await setDoc(docRef, obj, { merge: true });
    }

    public async getCurrentRatingsAsync(): Promise<any> {

        const docName = '/ratings/current';
        const docRef = doc(this.firestore, docName);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        else {
            console.log('Could not find document for ', docName);
        }
    }

    saveSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }

    updateSinglePlayerToFirebase(player: Player) {
        this.saveAllPlayers();
    }

    saveAllPlayersToFirebaseAsync() {
        this.savePlayersToListAsync(this.currentPlayerList, 'current');
    }

    public getCurrentRatingSystem(): RatingSystem {
        return this.currentRatingSystem;
    }

    public async getRatingHistoryAsync(): Promise<Map<string, RatingHist>> {

        const collectionRef = collection(this.firestore, 'ratings');
        const docsSnap = await getDocs(collectionRef);

        let history = new Map<string, RatingHist>();
        docsSnap.forEach(
            // doc => {
            // doc.docs.forEach(
            test => {
                if (test.id !== 'current') {
                    const histItem: RatingHist = new RatingHist();
                    const data: any = test.data();
                    histItem.players = data.players as Player[];
                    histItem.ratingSystem = data.ratingSystem as RatingSystem;
                    history.set(test.id, histItem);
                }
                // });
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
     * @returns A player obect
     */
    private getPlayerWithUpdatedRatingForGame(
        player: Player,
        winners: string[],
        losers: string[],
        difference: number,
        ratingSystem: RatingSystem = RatingSystem.German): Player {
        const playerCpy: Player = { ...player };
        if (difference === 0) {
            return playerCpy;
        }

        // Winners earn points and losers lose points in some rating systems.
        // Or the other way around in other rating systems. Use the sign for this.
        let sign = 0;

        if (winners.includes(playerCpy.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForWinner(ratingSystem);

        } else if (losers.includes(playerCpy.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForLoser(ratingSystem);
        }

        playerCpy.rating = playerCpy.rating + sign * (
            RatingSystemSettings.GetFixedMultiplierForMatch(ratingSystem)
            + Math.abs(difference) * RatingSystemSettings.GetGoalMultiplierForMatch(ratingSystem));
        return playerCpy;
    }

    /**
     * Obtains an updated list of all players after a game.
     * @param players The full list of players
     * @param game The game based on the result of which the ratings will be updated.
     * @param ratingSystem The rating system to use.
     * @returns The updated full list of players (new copy)
     */
    public getAllPlayersUpdatedRatingsForGame(players: Player[], game: CustomPrevGame, ratingSystem: RatingSystem = RatingSystem.German): Player[] {
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

        return playersCpy.map(player => this.getPlayerWithUpdatedRatingForGame(player, winners, losers, difference, ratingSystem));
    }

    /**
     * Obtains a list of players which took part in a game.
     * @param game The game based on the result of which the ratings will be updated.
     * @param ratingSystem The rating system to use.
     * @returns The list of players which were part of the game with new ratings (new copy).
     */
    public getPlayersWithUpdatedRatingsForGame(game: CustomPrevGame, ratingSystem: RatingSystem = RatingSystem.German): Player[] {
        if (game.scoreTeam1 == null || game.scoreTeam2 == null
            || game.scoreTeam1 === game.scoreTeam2) {
            // nothing to do
            return [];
        }

        let playersCpy: Player[] = [...game.team1.concat([...game.team2])];
        // let playersCpy: Player[] = [...game.team1];
        // playersCpy = [...game.team2];

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

        console.log('winners', winners);
        console.log('losers', losers);


        return playersCpy.map(player => this.getPlayerWithUpdatedRatingForGame(player, winners, losers, difference, ratingSystem));
    }

    // async getPlayersFromHist(documentName: string): Promise<Player[]> {
    //     let players: Player[];

    //     console.log('***getPlayersFromHist');


    //     const docName = 'ratings/' + documentName;
    //     const docRef = doc(this.firestore, docName);
    //     const docSnap = await getDoc(docRef);
    //     if (docSnap.exists()) {
    //         players = docSnap.data() as Player[];
    //         console.log('***getPlayersFromHist', players);
    //     }
    //     else {
    //         console.log('Could not find document for ', docName);
    //     }

    //     return players;
    // }
}
