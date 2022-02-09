import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

import { NgbCollapseModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgcCookieConsentModule, NgcCookieConsentConfig } from 'ngx-cookieconsent';
import { AuthService } from './auth/auth.service';
import { PlayersService } from './shared/players.service';
import { MatchService } from './shared/match.service';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PlayersComponent } from './players/players.component';
import { PlayerRoutedCardComponent } from './players/player/player-routed-card.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerEditComponent } from './players/player-edit/player-edit.component';
import { RecentMatchesComponent } from './matches/previous-matches/recent-matches.component';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { PlayerStartComponent } from './players/player-start/player-start.component';
import { PlayerNewComponent } from './players/player-new/player-new.component';
import { PlayerFilterPipe } from './matches/player-filter.pipe';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../environments/environment';
import { AuthGuard } from './auth/auth-guard.service';
import { OrganizerGuard } from './auth/organizer-guard.service';
import { CustomgameComponent } from './customgame/customgame.component';
import { PlayerCardComponent } from './player-card/player-card.component';
import { MatchCombosComponent } from './matches/match-combos/match-combos.component';
import { MatchVersusComponent } from './matches/match-versus/match-versus.component';
import { MatchStorageComponent } from './matches/match-storage/match-storage.component';
import { CopyClipboardDirective } from './shared/copy-clipboard.directive';
import { PrevMatchDetailComponent } from './matches/prev-match-detail/prev-match-detail.component';
import { PlayerMiniCardComponent } from './players/player-mini-card/player-mini-card.component';

import { AppStorage } from './shared/app-storage';
import { LoadingSpinnerComponent } from './ui/loading-spinner/loading-spinner.component';
import { DraftComponent } from './draft/draft/draft.component';
import { PlayerCardPrefComponent } from './player-card-pref/player-card-pref.component';
import { MessagingService } from './shared/messaging.service';

// types: opt-out, opt-in, info
const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: environment.cookieConsentDomain // it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
  },
  palette: {
    popup: {
      background: '#000'
    },
    button: {
      background: '#3CB9FC'
    }
  },
  theme: 'edgeless',
  type: 'info'
};

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    PlayersComponent,
    PlayerRoutedCardComponent,
    PlayerDetailsComponent,
    PlayerEditComponent,
    RecentMatchesComponent,
    AboutComponent,
    PlayerStartComponent,
    PlayerNewComponent,
    PlayerFilterPipe,
    SigninComponent,
    SignupComponent,
    CustomgameComponent,
    PlayerCardComponent,
    MatchCombosComponent,
    MatchVersusComponent,
    MatchStorageComponent,
    CopyClipboardDirective,
    PrevMatchDetailComponent,
    PlayerMiniCardComponent,
    LoadingSpinnerComponent,
    DraftComponent,
    PlayerCardPrefComponent
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
    AngularFireMessagingModule,
    AngularFireFunctionsModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbCollapseModule,
    NgbTooltipModule,
    NgbModule,
    NgcCookieConsentModule.forRoot(cookieConfig)
  ],
  providers: [
    PlayersService,
    MatchService,
    MessagingService,
    AuthService,
    AuthGuard,
    OrganizerGuard,
    AppStorage,
    AsyncPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
