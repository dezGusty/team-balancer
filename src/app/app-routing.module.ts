import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlayersComponent } from './players/players.component';
import { MatchesComponent } from './matches/matches.component';
import { NextMatchComponent } from './matches/next-match/next-match.component';
import { AboutComponent } from './about/about.component';
import { PlayerDetailsComponent } from './players/player-details/player-details.component';
import { PlayerStartComponent } from './players/player-start/player-start.component';
import { PlayerEditComponent } from './players/player-edit/player-edit.component';
import { SigninComponent } from './auth/signin/signin.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AuthGuard } from './auth/auth-guard.service';
import { OrganizerGuard } from './auth/organizer-guard.service';

const appRoutes: Routes = [
    { path: '', redirectTo: '/signin', pathMatch: 'full' },
    {
        path: 'players', canActivate: [AuthGuard, OrganizerGuard], component: PlayersComponent, children: [
            { path: '', component: PlayerStartComponent },
            { path: 'new', component: PlayerEditComponent },
            { path: ':id', component: PlayerDetailsComponent },
            { path: ':id/edit', component: PlayerEditComponent }
        ]
    },
    { path: 'matches', canActivate: [AuthGuard], component: MatchesComponent },
    { path: 'nextmatch', canActivate: [AuthGuard], component: NextMatchComponent },
    { path: 'about', component: AboutComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'signup', component: SignupComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
