import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayersComponent } from './players/players.component';
import { AboutComponent } from './about/about.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerStartComponent } from './players/player-start/player-start.component';
import { PlayerEditComponent } from './players/player-edit/player-edit.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AuthGuard } from './auth/auth-guard.service';
import { OrganizerGuard } from './auth/organizer-guard.service';
import { CustomgameComponent } from './customgame/customgame.component';
import { RecentMatchesComponent } from './matches/previous-matches/recent-matches.component';
import { PrevMatchDetailComponent } from './matches/prev-match-detail/prev-match-detail.component';
import { DraftComponent } from './draft/draft/draft.component';

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
        path: 'recent', canActivate: [AuthGuard, OrganizerGuard], component: RecentMatchesComponent, children: [
            { path: ':id', component: PrevMatchDetailComponent }
        ]
    },
    { path: 'draft', canActivate: [AuthGuard], component: DraftComponent },
    {
        path: 'custom', canActivate: [AuthGuard], component: CustomgameComponent
    },
    { path: 'about', component: AboutComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'signup', component: SignupComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
