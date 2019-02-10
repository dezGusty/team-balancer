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
    PlayerAddComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
