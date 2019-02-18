import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
import { MatchService } from './shared/match.service';
import { PlayersService } from './shared/players.service';
import { AppRoutingModule } from './app-routing.module';
import { PlayerStartComponent } from './players/player-start/player-start.component';
import { PlayerNewComponent } from './players/player-new/player-new.component';
import { PlayerFilterPipe } from './matches/player-filter.pipe';
import { MatchPlayerComponent } from './players/match-player/match-player.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AuthService } from './auth/auth.service';

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
    SignupComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [PlayersService, MatchService, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
