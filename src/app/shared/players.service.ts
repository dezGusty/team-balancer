import { Player } from './player.model';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, map, of, shareReplay, Subject, Subscription, switchMap, tap } from 'rxjs';
import { CustomPrevGame } from './custom-prev-game.model';
import { AppStorage } from './app-storage';

import { RatingSystemSettings } from './rating-system';
import { PlayerChangeInfo } from './player-change-info';
import { RatingHist } from './rating-hist.model';
import { AuthService } from '../auth/auth.service';
import { collection, doc, docData, Firestore, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { PlayerRatingSnapshot } from './player-rating-snapshot.model';
import { SettingsService } from './settings.service';

/**
 * Stores and retrieves player related information.
 */
@Injectable()
export class PlayersService implements OnDestroy {

    private dataChangeSubscriptions: Subscription[] = [];
    private currentLabel: string = '';

    // constructor.
    constructor(
        private firestore: Firestore,
        private authSvc: AuthService,
        private appStorage: AppStorage,
        private settingsSvc: SettingsService) {

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

        this.subscriptions.push(this.players$.subscribe());
        this.subscriptions.push(this.updatePlayers$.subscribe());
    }

    private readonly subscriptions: Subscription[] = [];
    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private currentPlayerList: Player[] = [];
    private archivedPlayerList: Player[] = [];

    // An observable for the current players list
    currentPlayersSubject$ = new BehaviorSubject<boolean>(true);
    public players$ = this.currentPlayersSubject$.asObservable().pipe(
        tap(_ => console.log("players$ triggered")),
        switchMap(_ => docData(doc(this.firestore, '/ratings/current2'))),
        // tap((_) => { this.loadingFlagService.setLoadingFlag(true); }),
        map(playersDocContent => {
            const snap: PlayerRatingSnapshot = playersDocContent as PlayerRatingSnapshot;
            const playersArray: Player[] = snap.players;
            return playersArray;
        }),
        // tap((_) => { this.loadingFlagService.setLoadingFlag(false); }),
        catchError((err) => {
            console.log("read game events encountered issue");
            // this.loadingFlagService.setLoadingFlag(false);
            return of<Player[]>([]);
        }),
        shareReplay(1),
    );

    uplatePlayersSubject$ = new Subject<Player[]>();
    public updatePlayers$ = this.uplatePlayersSubject$.asObservable().pipe(
        switchMap(players => setDoc(doc(this.firestore, '/ratings/current2'), { players: players }, { merge: true })),
        tap(_ => this.currentPlayersSubject$.next(true)),
        catchError((err) => {
            console.log("update players encountered issue");
            return of();
        })
    );

    updatePlayersList(allPlayers: Player[]) {
        this.uplatePlayersSubject$.next(allPlayers);
    }

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
        const backupOfCurrentPlayerList = this.currentPlayerList.slice();
        const backupOfArchivedPlayerList = this.archivedPlayerList.slice();

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

        this.savePlayersArrayToDocAsync(this.archivedPlayerList, 'archive')
            .then(_ => {
                // successfully saved archive.
                // can now also save the regular player list: we won't lose a player, at worst a duplicate
                this.savePlayersArrayToDocAsync(this.currentPlayerList, 'current')
                    .then(_ => {
                        const playerInfo = new PlayerChangeInfo(this.currentPlayerList, 'info', `moved player ${player.name} to archive.`);

                        this.playerDataChangeEvent.next(playerInfo);
                    })
                    .catch(err => {
                        console.log('[players] error saving current player list');
                        this.currentPlayerList = backupOfCurrentPlayerList;
                    });
            })
            .catch(err => {
                console.log('[players] error saving archive player list');
                this.archivedPlayerList = backupOfArchivedPlayerList;
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

        this.savePlayersArrayToDocAsync(this.currentPlayerList, 'current').then(_ => {
            // successfully saved archive.
            // can now also save the regular player list: we won't lose a player, at worst a duplicate
            this.savePlayersArrayToDocAsync(this.archivedPlayerList, 'archive').then(_ => {
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

    public async tryToStoreRecentDrawInHistory(gameObj: CustomPrevGame, matchKey: string) {
        // Go through each player and add the results to a separate item.
        gameObj.team1.concat(gameObj.team2).forEach(async playerItem => {
            let playerToUpdate = this.getPlayerById(playerItem.id);
            if (!playerToUpdate) {
                return;
            }

            const existingEntry = playerToUpdate.mostRecentMatches?.find(x => x.date == matchKey);
            if (existingEntry) {
                // update or ignore?
                // ignore 
                console.log('existing entry', existingEntry);

            } else {
                if (playerToUpdate.mostRecentMatches == null) {
                    playerToUpdate.mostRecentMatches = new Array<{ date: string, diff: number }>;
                }
                playerToUpdate.mostRecentMatches.push({ date: matchKey, diff: 0 });

                // don't keep all ratings, just the most recent ones, so sort them.
                playerToUpdate.mostRecentMatches.sort((a, b) => a.date > b.date ? -1 : 1);
                if (playerToUpdate.mostRecentMatches.length > this.settingsSvc.getMaxStoredRecentMatchesCount()) {
                    playerToUpdate.mostRecentMatches = playerToUpdate.mostRecentMatches.slice(0, this.settingsSvc.getMaxStoredRecentMatchesCount());
                }
            }

            // search for player by id
            this.updateCachedPlayerById(playerToUpdate.id, playerToUpdate);
            await this.saveAllPlayersToFirebaseAsync();
        });
    }

    public async storeRecentMatchToParticipantsHistoryAsync(gameObj: CustomPrevGame, matchKey: string) {

        if (gameObj && !gameObj.postResults && gameObj.appliedResults && gameObj.savedResult) {
            return this.tryToStoreRecentDrawInHistory(gameObj, matchKey);
        }

        // Go through each player and add the results to a separate item.
        gameObj.postResults?.forEach(async diffPair => {
            let playerToUpdate = this.getPlayerById(diffPair.id);
            if (!playerToUpdate) {
                return;
            }

            const existingEntry = playerToUpdate.mostRecentMatches?.find(x => x.date == matchKey);
            if (existingEntry) {
                // update or ignore?
                // ignore 
                console.log('existing entry', existingEntry);

            } else {
                if (playerToUpdate.mostRecentMatches == null) {
                    playerToUpdate.mostRecentMatches = new Array<{ date: string, diff: number }>;
                }
                playerToUpdate.mostRecentMatches.push({ date: matchKey, diff: diffPair.diff });

                // don't keep all ratings, just the most recent ones, so sort them.
                playerToUpdate.mostRecentMatches.sort((a, b) => a.date > b.date ? -1 : 1);
                if (playerToUpdate.mostRecentMatches.length > this.settingsSvc.getMaxStoredRecentMatchesCount()) {
                    playerToUpdate.mostRecentMatches = playerToUpdate.mostRecentMatches.slice(0, this.settingsSvc.getMaxStoredRecentMatchesCount());
                }
            }

            // search for player by id
            this.updateCachedPlayerById(diffPair.id, playerToUpdate);
            await this.saveAllPlayersToFirebaseAsync();
        });
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

    public async savePlayersArrayToDocAsync(playersArr: Player[], listName: string): Promise<void> {
        const docName = 'ratings/' + listName;
        const obj = { players: playersArr };
        const docRef = doc(this.firestore, docName);
        console.log('setting data in ' + docName, obj);
        await setDoc(docRef, obj, { merge: true });
    }

    public async savePlayersToListAsync(playersArr: Player[], listName: string): Promise<void> {
        return this.savePlayersArrayToDocAsync(playersArr, listName)
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
        var obj: any = {};
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
        difference: number): Player {
        const playerCpy: Player = { ...player };
        if (difference === 0) {
            return playerCpy;
        }

        // Winners earn points and losers lose points in some rating systems.
        // Or the other way around in other rating systems. Use the sign for this.
        let sign = 0;

        if (winners.includes(playerCpy.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForWinner();

        } else if (losers.includes(playerCpy.name)) {
            sign = RatingSystemSettings.GetSignMultiplierForLoser();
        }

        playerCpy.rating = playerCpy.rating + sign * (
            RatingSystemSettings.GetFixedMultiplierForMatch()
            + Math.abs(difference) * RatingSystemSettings.GetGoalMultiplierForMatch());
        return playerCpy;
    }

    /**
     * Obtains an updated list of all players after a game.
     * @param players The full list of players
     * @param game The game based on the result of which the ratings will be updated.
     * @param ratingSystem The rating system to use.
     * @returns The updated full list of players (new copy)
     */
    public getAllPlayersUpdatedRatingsForGame(players: Player[], game: CustomPrevGame): Player[] {
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

        return playersCpy.map(player => this.getPlayerWithUpdatedRatingForGame(player, winners, losers, difference));
    }

    /**
     * Obtains a list of players which took part in a game.
     * @param game The game based on the result of which the ratings will be updated.
     * @param ratingSystem The rating system to use.
     * @returns The list of players which were part of the game with new ratings (new copy).
     */
    public getPlayersWithUpdatedRatingsForGame(game: CustomPrevGame): Player[] {
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


        return playersCpy.map(player => this.getPlayerWithUpdatedRatingForGame(player, winners, losers, difference));
    }

}
