import { AsyncPipe } from '@angular/common';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withComponentInputBinding, withDebugTracing } from '@angular/router';
// import { NgcCookieConsentConfig, NgcCookieConsentModule } from 'ngx-cookieconsent';
import { AboutComponent } from './app/about/about.component';
import { AdminComponent } from './app/admin/admin.component';
import { AppComponent } from './app/app.component';

import { AdminGuard } from './app/auth/admin-guard.service';
import { AuthGuard } from './app/auth/auth-guard.service';
import { AuthService } from './app/auth/auth.service';
import { OrganizerGuard } from './app/auth/organizer-guard.service';
import { SigninComponent } from './app/auth/signin/signin.component';
import { SignupComponent } from './app/auth/signup/signup.component';
import { CustomgameComponent } from './app/customgame/customgame.component';
import { DraftComponent } from './app/draft/draft.component';
import { PrevMatchDetailComponent } from './app/matches/prev-match-detail/prev-match-detail.component';
import { RecentMatchesComponent } from './app/matches/previous-matches/recent-matches.component';
import { PlayerDetailsComponent } from './app/players/player-details/player-details.component';
import { PlayerEditComponent } from './app/players/player-edit/player-edit.component';
import { PlayerStartComponent } from './app/players/player-start/player-start.component';
import { PlayersComponent } from './app/players/players.component';
import { AppStorage } from './app/shared/app-storage';
import { MatchService } from './app/shared/match.service';
import { PlayersService } from './app/shared/players.service';
import { ToastService } from './app/shared/toasts-service';
import { environment } from './environments/environment';
import { PrivacyComponent } from './app/auth/privacy/privacy.component';
import { GameEventsComponent } from './app/matchesnew/history/game-events.component';
import { MatchDetailsComponent } from './app/matchesnew/details/details.component';
import { UserAuthService } from './app/auth/user-auth.service';
import { NotificationService } from './app/utils/notification/notification.service';
import { LoadingFlagService } from './app/utils/loading-flag.service';
import { DraftNewComponent } from './app/draft-new/draft-new.component';
import { DraftSelectionService } from './app/draft-new/data-access/draft-selection.service';
import { CurrentPlayersService } from './app/draft-new/data-access/current-players.service';

if (environment.production) {
  enableProdMode();
}

// const cookieConfig: NgcCookieConsentConfig = {
//   cookie: {
//     domain: environment.cookieConsentDomain // it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
//   },
//   palette: {
//     popup: {
//       background: '#000'
//     },
//     button: {
//       background: '#3CB9FC'
//     }
//   },
//   theme: 'edgeless',
//   type: 'info'
// };


const appRoutes: Routes = [
  { path: '', redirectTo: '/about', pathMatch: 'full' },
  {
    path: 'players', canActivate: [AuthGuard], component: PlayersComponent, children: [
      { path: '', component: PlayerStartComponent },
      { path: 'new', canActivate: [AuthGuard, OrganizerGuard], component: PlayerEditComponent },
      { path: ':id', component: PlayerDetailsComponent },
      { path: ':id/edit', canActivate: [AuthGuard, OrganizerGuard], component: PlayerEditComponent }
    ]
  },
  {
    path: 'recent', canActivate: [AuthGuard], component: RecentMatchesComponent, children: [
      { path: ':id', component: PrevMatchDetailComponent }
    ]
  },
  {
    path: 'games', canActivate: [AuthGuard], component: GameEventsComponent, children: [
      { path: ':id', component: MatchDetailsComponent }
    ]
  },
  { path: 'draft', canActivate: [AuthGuard], component: DraftComponent },
  { path: 'draftnew', canActivate: [AuthGuard], component: DraftNewComponent },
  {
    path: 'custom', canActivate: [AuthGuard, OrganizerGuard], component: CustomgameComponent
  },
  { path: 'about', component: AboutComponent },
  { path: 'admin', canActivate: [AuthGuard, AdminGuard], component: AdminComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'privacy', component: PrivacyComponent }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(provideAuth(() => {
      return getAuth();
    })),
    importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebase))),
    importProvidersFrom(provideFirestore(() => {
      return getFirestore();
    })),
    // importProvidersFrom(NgcCookieConsentModule.forRoot(cookieConfig)),
    PlayersService,
    MatchService,
    AuthService,
    CurrentPlayersService,
    UserAuthService,
    ToastService,
    NotificationService,
    DraftSelectionService,
    LoadingFlagService,
    AuthGuard,
    OrganizerGuard,
    AdminGuard,
    AppStorage,
    AsyncPipe,

  ]
}).catch((err) => console.error(err));
