import { Component, OnInit, OnDestroy, input, signal, model } from '@angular/core';
import { Player, getDisplayName } from '../../shared/player.model';
import { ActivatedRoute, Params } from '@angular/router';
import { CustomPrevGame } from '../../shared/custom-prev-game.model';
import { BehaviorSubject, combineLatest, filter, map, Subscription, switchMap, tap } from 'rxjs';
import { PlayersService } from 'src/app/shared/players.service';
import { MatchService } from 'src/app/shared/match.service';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmallLoadingSpinnerComponent } from 'src/app/ui/small-loading-spinner/small-loading-spinner.component';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatchStatus } from 'src/app/matchesnew/match-status';

@Component({
  selector: 'app-prev-match-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SmallLoadingSpinnerComponent],
  styleUrls: ['./prev-match-detail.component.css'],
  templateUrl: './prev-match-detail.component.html'
})
export class PrevMatchDetailComponent implements OnInit, OnDestroy {

  public players$ = this.playersSvc.players$;

  team1Sum = signal<number>(0);
  team2Sum = signal<number>(0);


  public showSpinner = true;

  customGame: CustomPrevGame | undefined;
  private readonly customGameState$ = new BehaviorSubject<CustomPrevGame | undefined>(undefined);
  private subscriptions: Subscription[] = [];

  extractedTeam1 = model<Array<Player>>([]);
  extractedTeam2 = model<Array<Player>>([]);

  public team1Score = model<number>(0);
  public team2Score = model<number>(0);

  public team1ScoreObs$ = toObservable(this.team1Score);
  public team2ScoreObs$ = toObservable(this.team2Score);

  public matchResultsStored = true;
  public matchResultsAppliedToRatings = true;

  canSelectStatus = signal<boolean>(false);

  matchStatus = signal<MatchStatus>(MatchStatus.Unknown);
  readonly MatchStatus = MatchStatus;
  readonly matchStatusOptions: { value: MatchStatus; label: string; icon: string }[] = [
    { value: MatchStatus.Unknown,    label: 'Unknown',         icon: '❓' },
    { value: MatchStatus.Valid,      label: 'Result valid',    icon: '✅' },
    { value: MatchStatus.Unbalanced, label: 'Very unbalanced', icon: '⚠️' },
    { value: MatchStatus.NotPlayed,  label: 'Not played',      icon: '🚫' },
  ];

  matchSearchKey = '';

  public id = input<string>();
  public selectedCustomGameObs$ = toObservable(this.id);
  public selectedCustomGameNonNull$ = this.selectedCustomGameObs$.pipe(
    filter(id => id !== undefined),
    switchMap(id => this.matchAltSvc.getMatchForDateAsync(id ?? "")),
    filter(game => game !== undefined),
  );

  public selectedCustomGame$ = combineLatest([
    this.customGameState$.pipe(filter((game): game is CustomPrevGame => game !== undefined)),
    this.team1ScoreObs$,
    this.team2ScoreObs$
  ]).pipe(
    map(([game, score1, score2]) => {
      return this.getPreviewGame(game, score1, score2);
    }),
    tap(game => this.updateTeamSumsForGame(game))
  );

  constructor(
    private route: ActivatedRoute,
    private matchAltSvc: MatchService,
    private playersSvc: PlayersService,
    private authSvc: UserAuthService) {
  }

  private processGamePlayerRatings(game: CustomPrevGame): CustomPrevGame {
    this.populatePostResults(game, false);
    return game;
  }

  private getPreviewGame(game: CustomPrevGame, score1: number, score2: number): CustomPrevGame {
    const previewGame: CustomPrevGame = {
      ...game,
      team1: game.team1.map(player => ({ ...player })),
      team2: game.team2.map(player => ({ ...player })),
      scoreTeam1: score1,
      scoreTeam2: score2,
      postResults: game.postResults ? [...game.postResults] : []
    };

    const shouldReuseStoredResults = previewGame.appliedResults
      && previewGame.scoreTeam1 === game.scoreTeam1
      && previewGame.scoreTeam2 === game.scoreTeam2
      && previewGame.postResults.length > 0;

    if (shouldReuseStoredResults) {
      return previewGame;
    }

    return this.processGamePlayerRatings(previewGame);
  }

  private populatePostResults(game: CustomPrevGame, useDiff: boolean): void {
    const updatedPlayers = this.playersSvc.getPlayersWithUpdatedRatingsForGame(game, useDiff);
    game.postResults = [];

    updatedPlayers.forEach(player => {
      let oldRating = game.team1.find(x => x.id === player.id)?.rating;
      if (oldRating == null) {
        oldRating = game.team2.find(x => x.id === player.id)?.rating;
      }
      if (oldRating == null) {
        return;
      }

      game.postResults.push({ id: player.id, diff: player.rating - oldRating });
    });
  }

  ngOnInit() {
    this.subscriptions.push(this.route.params.subscribe(
      (params: Params) => {
        this.matchSearchKey = params['id'];
        this.loadCustomGameForKey(this.matchSearchKey);
      }
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }


  async loadCustomGameForKey(matchSearchKey: string) {
    this.customGame = undefined;
    this.customGameState$.next(undefined);
    this.showSpinner = true;

    const gameForMatch = await this.matchAltSvc.getMatchForDateAsync(matchSearchKey);
    this.showSpinner = false;
    if (gameForMatch) {
      this.customGame = { ...gameForMatch };
      this.extractedTeam1.set(this.customGame.team1);
      this.extractedTeam2.set(this.customGame.team2);

      this.matchResultsStored = this.customGame.savedResult;
      if (this.customGame.scoreTeam1 != null) {
        this.team1Score.set(this.customGame.scoreTeam1);
      } else {
        this.team1Score.set(0);
        this.matchResultsStored = false;
      }

      if (this.customGame.scoreTeam2 != null) {
        this.team2Score.set(this.customGame.scoreTeam2);
      } else {
        this.team2Score.set(0);
        this.matchResultsStored = false;
      }

      this.matchResultsAppliedToRatings = this.customGame.appliedResults;
      this.updateCanSelectStatus();
      this.matchStatus.set(
        this.customGame.status
        ?? this.matchAltSvc.getStatusForMatch(matchSearchKey.substring(0, 10))
        ?? MatchStatus.Unknown
      );
      this.customGameState$.next(this.customGame);
    }
  }

  /**
   * Wrapper function for retrieving the player display name.
   * @param player Player object to display the name for.
   */
  getDisplayNameForPlayer(player: Player): string {
    return getDisplayName(player);
  }

  getInitialRatingForPlayer(player: Player): string {
    return player.rating.toFixed(3);
  }

  getPostMatchDiffForPlayer(player: Player): string {
    if (!this.customGame) {
      return '';
    }

    if (!this.customGame.appliedResults) {
      return '';
    }

    const foundObj = this.customGame.postResults?.find(x => x.id === player.id);
    if (foundObj) {
      return foundObj.diff.toFixed(3);
    }

    return "~ 0.0";
  }

  getPostMatchDiffForPlayerAndGame(player: Player, customGame: CustomPrevGame): string {
    if (this.matchStatus() === MatchStatus.Unbalanced) {
      return '~0';
    }
    const foundObj = customGame.postResults?.find(x => x.id === player.id);
    if (foundObj) {
      return foundObj.diff.toFixed(3);
    }
    return "~ 0.0";
  }

  onMatchSaveCliked() {
    // handle elsewhere
  }

  async onStoreResultClick() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }

    // show animation
    this.showSpinner = true;

    this.customGame.scoreTeam1 = this.team1Score();
    this.customGame.scoreTeam2 = this.team2Score();
    this.customGame.savedResult = true;
    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    await this.matchAltSvc.updateMatchStatus(this.matchSearchKey.substring(0, 10), this.matchStatus());
    this.matchResultsStored = this.customGame.savedResult;
    this.updateCanSelectStatus();
    this.showSpinner = false;
  }


  isGoodRatingDiff(player: Player): boolean {
    return this.isGoodRatingDiffForGame(player, this.customGame);
  }

  isGoodRatingDiffForGame(player: Player, customGame?: CustomPrevGame): boolean {
    if (this.matchStatus() === MatchStatus.Unbalanced) return false;
    if (!customGame) {
      return false;
    }

    if (!customGame.postResults) {
      return false;
    }

    const pair = customGame.postResults.find(x => x.id === player.id);
    if (!pair) {
      return false;
    }

    return pair.diff > 0;
  }

  isBadRatingDiff(player: Player): boolean {
    return this.isBadRatingDiffForGame(player, this.customGame);
  }

  isBadRatingDiffForGame(player: Player, customGame?: CustomPrevGame): boolean {
    if (this.matchStatus() === MatchStatus.Unbalanced) return false;
    if (!customGame) {
      return false;
    }

    if (!customGame.postResults) {
      return false;
    }


    const pair = customGame.postResults.find(x => x.id === player.id);
    if (!pair) {
      return false;
    }

    return pair.diff < 0;
  }

  getCSSClassForPlayerRatingAndGame(player: Player, customGame: CustomPrevGame): string {
    if (this.isGoodRatingDiffForGame(player, customGame)) {
      return 'good-num';
    } else if (this.isBadRatingDiffForGame(player, customGame)) {
      return 'bad-num';
    }
    return '';
  }

  /**
   * Updates the ratings of the user for the loaded match.
   * The old player ratings are stored to an old entry. E.g.
   *    'ratings/2018-04-02'
   * The current player ratings are stored in the standard entry. E.g.
   *    'ratings/current'
   */
  async onUpdateRatingsClick() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }

    let currentMatch = await this.playersSvc.getCurrentRatingsAsync();

    const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame
    );

    this.populatePostResults(this.customGame, false);

    this.showSpinner = true;

    // Store the 'old' ratings under a different entry.
    if (!currentMatch || !currentMatch.label) {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey);
    } else {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey + '_' + currentMatch.label);
      await this.playersSvc.addFieldValueToDocumentAsync("label", currentMatch.label, "current");
    }

    // Store the 'new' ratings under the 'current' entry.
    await this.playersSvc.savePlayersToListAsync(newPlayers, 'current');


    // Store the new data for the match.
    this.customGame.appliedResults = true;
    this.matchResultsAppliedToRatings = true;
    this.updateCanSelectStatus();
    console.log('saving ', this.customGame);
    this.customGameState$.next(this.customGame);

    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);

    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  onMatchStatusChange(status: string) {
    const newStatus = status as MatchStatus;
    this.matchStatus.set(newStatus);
    if (newStatus === MatchStatus.NotPlayed) {
      this.team1Score.set(0);
      this.team2Score.set(0);
    }
  }

  onScoreChange() {
    if (this.matchStatus() === MatchStatus.Unknown) {
      this.matchStatus.set(MatchStatus.Valid);
    }
  }

  updateTeamSumsForCurrentGame(): void {
    if (!this.customGame) {
      return;
    }

    let team1Sum = this.customGame.team1.reduce((acc, player) => acc + player.rating, 0);
    let team2Sum = this.customGame.team2.reduce((acc, player) => acc + player.rating, 0);
    this.team1Sum.set(team1Sum);
    this.team2Sum.set(team2Sum);
  }

  updateTeamSumsForGame(game: CustomPrevGame): void {
    const team1Sum = game.team1.reduce((acc, player) => acc + player.rating, 0);
    const team2Sum = game.team2.reduce((acc, player) => acc + player.rating, 0);
    this.team1Sum.set(team1Sum);
    this.team2Sum.set(team2Sum);
  }

  /**
   * New version of the rating update function.
   * This also applies a multiplier to each rating change based on the initial rating difference between the two teams.
   * @returns 
   */
  async onUpdateRatingsV2Click() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }

    let currentMatch = await this.playersSvc.getCurrentRatingsAsync();

    const newPlayers = this.playersSvc.getAllPlayersUpdatedRatingsForGame(
      this.playersSvc.getPlayers(), this.customGame
    );

    this.updateTeamSumsForCurrentGame();
    this.populatePostResults(this.customGame, true);

    this.showSpinner = true;

    // Store the 'old' ratings under a different entry.
    if (!currentMatch || !currentMatch.label) {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey);
    } else {
      await this.playersSvc.savePlayersToListAsync(this.playersSvc.getPlayers(), this.matchSearchKey + '_' + currentMatch.label);
      await this.playersSvc.addFieldValueToDocumentAsync("label", currentMatch.label, "current");
    }

    // Store the 'new' ratings under the 'current' entry.
    await this.playersSvc.savePlayersToListAsync(newPlayers, 'current');

    // Store the new data for the match.
    this.customGame.appliedResults = true;
    this.matchResultsAppliedToRatings = true;
    this.updateCanSelectStatus();
    console.log('saving ', this.customGame);
    this.customGameState$.next(this.customGame);

    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);

    await this.playersSvc.storeRecentMatchToParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  public async onResetMatchClick() {
    if (!this.authSvc.isAuthenticatedAsOrganizer()) {
      return;
    }

    if (!this.customGame) {
      return;
    }

    this.showSpinner = true;
    this.customGame.appliedResults = false;
    this.customGame.savedResult = false;
    this.customGame.postResults = [];
    this.matchResultsStored = false;
    this.matchResultsAppliedToRatings = false;
    this.updateCanSelectStatus();
    this.customGameState$.next(this.customGame);
    await this.matchAltSvc.saveCustomPrevMatchAsync(this.matchSearchKey, this.customGame);
    await this.playersSvc.removeRecentMatchFromParticipantsHistoryAsync(this.customGame, this.matchSearchKey);

    this.showSpinner = false;
  }

  public canShowStoreResultsButton(): boolean {
    return !this.matchResultsStored && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canShowApplyResultsButton(): boolean {
    return !this.matchResultsAppliedToRatings && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canResetResults(): boolean {
    return this.matchResultsStored
      && this.authSvc.isAuthenticatedAsOrganizer();
  }

  public canChangeScore(): boolean {
    return !this.matchResultsStored && this.matchStatus() !== MatchStatus.NotPlayed;
  }

  private updateCanSelectStatus(): void {
    this.canSelectStatus.set(!this.matchResultsStored && !this.matchResultsAppliedToRatings);
    console.log('canSelectStatus updated to ', this.canSelectStatus());
  }
}
