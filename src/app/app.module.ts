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
    AboutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
