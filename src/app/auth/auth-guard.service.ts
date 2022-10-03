import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthAltService } from './auth-alt.service';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(private authSvc: AuthAltService, private router: Router) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean> | Promise<boolean> | boolean {
        if (this.authSvc.isAuthenticated() && this.authSvc.isAuthenticatedAsUser()) {
            return true;
        } else {
            console.log('[guard] navigating to root');

            this.router.navigate(['/']);
        }
        return this.authSvc.isAuthenticated() && this.authSvc.isAuthenticatedAsUser();
    }
}
