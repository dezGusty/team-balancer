import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

import { NgbCollapseModule, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgcCookieConsentModule, NgcCookieConsentConfig } from 'ngx-cookieconsent';
import { AuthService } from './auth/auth.service';
import { PlayersService } from './shared/players.service';

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

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore, enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';

import { getApp } from '@angular/fire/app';
import { provideAuth, connectAuthEmulator, getAuth } from '@angular/fire/auth';
import { connectDatabaseEmulator, getDatabase, provideDatabase } from '@angular/fire/database';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';

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
import { SmallLoadingSpinnerComponent } from './ui/small-loading-spinner/small-loading-spinner.component';
import { DraftComponent } from './draft/draft/draft.component';
import { PlayerCardPrefComponent } from './player-card-pref/player-card-pref.component';
import { AdminComponent } from './admin/admin.component';
import { ToastService } from './shared/toasts-service';
import { ToastsContainer } from './toast/toast-container.component';
import { AdminGuard } from './auth/admin-guard.service';
import { MatchService } from './shared/match.service';

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

let resolvePersistenceEnabled: (enabled: boolean) => void;

export const persistenceEnabled = new Promise<boolean>(resolve => {
  resolvePersistenceEnabled = resolve;
});

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
    SmallLoadingSpinnerComponent,
    DraftComponent,
    PlayerCardPrefComponent,
    AdminComponent,
    ToastsContainer
  ],
  imports: [
    provideAuth(() => {
      const auth = getAuth();
      return auth;
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      // enableMultiTabIndexedDbPersistence(firestore).then(
      //   () => resolvePersistenceEnabled(true),
      //   () => resolvePersistenceEnabled(false)
      // );
      if (!firestore['_initialized']) {
        enableMultiTabIndexedDbPersistence(firestore);
      }
      return firestore;
    }),
    provideMessaging(() => getMessaging()),
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbCollapseModule,
    NgbTooltipModule,
    NgbModule,
    NgcCookieConsentModule.forRoot(cookieConfig),

  ],
  providers: [
    PlayersService,
    MatchService,
    AuthService,
    ToastService,
    AuthGuard,
    OrganizerGuard,
    AdminGuard,
    AppStorage,
    AsyncPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
