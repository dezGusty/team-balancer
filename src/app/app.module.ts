import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from './auth/auth.service';
import { PlayersService } from './shared/players.service';
import { MatchService } from './shared/match.service';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MatchesComponent } from './matches/matches.component';
import { NextMatchComponent } from './matches/next-match/next-match.component';
import { PlayersComponent } from './players/players.component';
import { PlayerComponent } from './players/player/player.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerEditComponent } from './players/player-edit/player-edit.component';
import { PreviousMatchesComponent } from './matches/previous-matches/previous-matches.component';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { PlayerStartComponent } from './players/player-start/player-start.component';
import { PlayerNewComponent } from './players/player-new/player-new.component';
import { PlayerFilterPipe } from './matches/player-filter.pipe';
import { MatchPlayerComponent } from './players/match-player/match-player.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';
import { AuthGuard } from './auth/auth-guard.service';
import { OrganizerGuard } from './auth/organizer-guard.service';
import { CustomgameComponent } from './customgame/customgame.component';
import { PlayerCardComponent } from './player-card/player-card.component';
import { MatchCombosComponent } from './matches/match-combos/match-combos.component';
import { MatchVersusComponent } from './matches/match-versus/match-versus.component';
import { MatchStorageComponent } from './matches/match-storage/match-storage.component';
import { CopyClipboardDirective } from './shared/copy-clipboard.directive';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MatchesComponent,
    NextMatchComponent,
    PlayersComponent,
    PlayerComponent,
    PlayerDetailsComponent,
    PlayerEditComponent,
    PreviousMatchesComponent,
    AboutComponent,
    PlayerStartComponent,
    PlayerNewComponent,
    PlayerFilterPipe,
    MatchPlayerComponent,
    SigninComponent,
    SignupComponent,
    CustomgameComponent,
    PlayerCardComponent,
    MatchCombosComponent,
    MatchVersusComponent,
    MatchStorageComponent,
    CopyClipboardDirective
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbCollapseModule
  ],
  providers: [PlayersService, MatchService, AuthService, AuthGuard, OrganizerGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
