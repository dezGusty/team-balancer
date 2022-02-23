import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../auth/auth.service';
import { CustomPrevGame } from '../shared/custom-prev-game.model';
import { MatchService } from '../shared/match.service';
import { PlayerChangeInfo } from '../shared/player-changed-info';
import { Player } from '../shared/player.model';
import { PlayersService } from '../shared/players.service';
import { RatingScaler } from '../shared/rating-scaler';
import { RatingSystem, RatingSystemSettings } from '../shared/rating-system';
import { ToastService } from '../shared/toasts-service';
import { getMessaging, getToken } from "firebase/messaging";
@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styles: ['']
})
export class AdminComponent implements OnInit, OnDestroy {

  players: Player[];
  matchHistory: Map<string, CustomPrevGame>;
  ratingHistory: Map<string, Player[]>;
  ratingSystems = [];
  ratingChosen: any;
  loadingConvert = -1;
  newBranchName: "";
  newRatingScale: RatingSystem;
  oldRatingScale: RatingSystem;

  private subscriptions: Subscription[] = [];

  constructor(
    private authSvc: AuthService,
    private playersSvc: PlayersService,
    private matchesSvc: MatchService,
    private toastSvc: ToastService) {

  }

  ngOnInit(): void {
    this.players = this.playersSvc.getPlayers();
    this.ratingSystems = Object.keys(RatingSystem).filter(p => isNaN(Number(p)));
    this.subscriptions.push(this.playersSvc.playerDataChangeEvent
      .subscribe(
        (playerChangeInfo: PlayerChangeInfo) => {
          this.players = this.playersSvc.getPlayers();
          this.toastSvc.show('Reloaded all players from service. \n'
            + playerChangeInfo.messageType + '\n'
            + playerChangeInfo.messagePayload);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    });
  }

  public canExportPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canAddPlayers(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }


  public async onConvertRatingClicked($event) {
    this.loadingConvert = 1;
    // Reset player ratings.
    for (let player of this.playersSvc.getPlayers()) {
      player.rating = 5;
    }
    this.playersSvc.saveAllPlayers();

    // Delete all rating documents.
    await this.playersSvc.dropPlayerRatings();

    // Create rating entries again, based on the matches whose results were applied.
    let recentMatchNames = [...this.matchesSvc.getRecentMatchListCached()];
    recentMatchNames.forEach(matchName => {
      this.matchesSvc.getMatchForDateAsync(matchName).subscribe((customGame: CustomPrevGame) => {

        if (customGame.appliedResults) {
          const newPlayers = this.playersSvc.updateRatingsForGame(
            this.playersSvc.getPlayers(), customGame
          );

          this.playersSvc.savePlayersToList(this.playersSvc.getPlayers(), matchName);
          this.playersSvc.savePlayersToList(newPlayers, 'current');

        }
      });
    })
    this.loadingConvert = 0;
  }

  public onExportPlayerClicked($event): void {
    // export data as json
    const content: string = JSON.stringify(this.playersSvc.getPlayers(true), null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  }

  async checkDropDown(dropdown: boolean) {
    if (dropdown == true) {
      this.ratingHistory = await this.playersSvc.getRatingHistory();
      this.matchHistory = await this.matchesSvc.getMatchList();
    }
  }

  changeAction(obj) {
    this.ratingChosen = obj;
    console.log("Chosen rating:");
    console.log(this.ratingChosen);
  }

  changeRatingDropdown(obj: string) {
    this.newRatingScale = RatingSystem[obj];
    console.log(this.newRatingScale);
  }

  async onNewBranchClicked($event) {
    this.loadingConvert = 1;
    let branchToEdit = this.ratingChosen.key;

    if (this.newBranchName) {
      branchToEdit = branchToEdit.slice(0, 10) + '_' + this.newBranchName;
    }

    let oldRatingSystem = this.ratingChosen?.value?.ratingScale;
    if (null == oldRatingSystem) {
      console.log('No rating system defined for selection; using default');
      oldRatingSystem = RatingSystem.German;
    }

    const oldPlayerList: Player[] = this.ratingChosen.value.players;

    // Perform a backup of the old ratings.
    this.playersSvc.savePlayersToList(oldPlayerList, branchToEdit + '_bck');

    const oldMinRating = Math.min(...oldPlayerList.map(x => x.rating)).toFixed(2);
    const oldMaxRating = Math.max(...oldPlayerList.map(x => x.rating)).toFixed(2);

    let scaledPlayers: Player[] = RatingScaler.rescalePlayerRatings(
      oldPlayerList,
      RatingSystemSettings.GetExpectedLowerEndRating(this.newRatingScale),
      RatingSystemSettings.GetExpectedUpperEndRating(this.newRatingScale),
      this.newRatingScale !== oldRatingSystem);
    const newMinRating = Math.min(...scaledPlayers.map(x => x.rating)).toFixed(2);
    const newMaxRating = Math.max(...scaledPlayers.map(x => x.rating)).toFixed(2);

    let messageToShow: string = 'Rating systems: \n'
      + 'old: ' + RatingSystem[oldRatingSystem] + ' (' + oldMinRating + '-' + oldMaxRating + ')\n'
      + 'new:' + RatingSystem[this.newRatingScale] + ' (' + newMinRating + '-' + newMaxRating + ')';

    this.toastSvc.show(messageToShow, { delay: 7500 });
    console.log(messageToShow);

    // console.log("Old players:");
    // this.playersSvc.getPlayers().forEach(element => {
    //   console.log(element.name + ": " + element.rating)
    // });

    this.playersSvc.savePlayersToList(scaledPlayers, 'current');
    this.playersSvc.addFieldValueToDocument('ratingSystem', this.newRatingScale, 'current');
    // if (this.newBranchName) {
    //   this.playersSvc.addFieldValueToDocument('label', this.newBranchName, branchToEdit);
    //   this.playersSvc.addFieldValueToDocument('label', this.newBranchName, 'current');
    // }


    // Update the rating from the chosen date and save it to current.
    // this.matchesSvc.getMatchForDateAsync(this.ratingChosen.key.slice(0, 10)).subscribe((customGame: CustomPrevGame) => {
    //   if (this.newBranchName) {
    //     this.playersSvc.addFieldValueToDocument('label', this.newBranchName, 'current');
    //   } else if (this.ratingChosen.value.label) {
    //     this.playersSvc.addFieldValueToDocument('label', this.ratingChosen.value.label, 'current');
    //   } else {
    //     this.playersSvc.removeFieldFromDocument('label', 'current');
    //   }

    //   this.playersSvc.addFieldValueToDocument('version', this.newRatingScale, 'current');
    //   this.ratingChosen.value.players = this.playersSvc.updateRatingsForGame(this.ratingChosen.value.players,
    //     customGame, this.newRatingScale);
    //   this.playersSvc.savePlayersToList(this.ratingChosen.value.players, 'current');

    // });
    this.loadingConvert = 0;
  }

  onTestMessageClicked($event) {
    return;
    // this.toastSvc.show($event, { delay: 7500 });
    // console.log($event);
    // const linkToUse = 'https://teams-balancer.firebaseapp.com/players/';
    // const notification = {
    //   title: 'New Match Created!',
    //   body: 'Match ID: [2022-02-22]' + ' test'
    // };
    // const payload = {
    //   notification,
    //   webpush: {
    //     notification: {
    //       vibrate: [100, 100, 200, 200, 300],
    //       icon: 'assets/ball_128.png',
    //       actions: [
    //         {
    //           action: 'ok',
    //           title: 'ok'
    //         }
    //       ]
    //     },
    //     fcmOptions: {
    //       link: linkToUse
    //     }
    //   },
    //   topic: 'matches'
    // };

    // // Get registration token. Initially this makes a network call, once retrieved
    // // subsequent calls to getToken will return from cache.
    // const messaging = getMessaging();
    
    // messaging.send(payload)
    // // fadmin.app.messaging().send(payload)
    //   .then((response) => {
    //     // Response is a message ID string.
    //     console.log('Successfully sent message:', response);
    //   })
    //   .catch((error) => {
    //     console.log('Error sending message:', error);
    //   });
  }
}
