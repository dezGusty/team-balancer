import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CoreComponent } from './core/core.component';
import { HeaderComponent } from './core/header/header.component';
import { MatchesComponent } from './matches/matches.component';
import { NextMatchComponent } from './matches/next-match/next-match.component';
import { PlayersComponent } from './players/players.component';
import { PlayerComponent } from './players/player/player.component';
import { PlayerEditComponent } from './players/player-edit/player-edit.component';
import { PlayerAddComponent } from './players/player-add/player-add.component';
import { PreviousMatchesComponent } from './matches/previous-matches/previous-matches.component';

@NgModule({
  declarations: [
    AppComponent,
    CoreComponent,
    HeaderComponent,
    MatchesComponent,
    NextMatchComponent,
    PlayersComponent,
    PlayerComponent,
    PlayerEditComponent,
    PlayerAddComponent,
    PreviousMatchesComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
