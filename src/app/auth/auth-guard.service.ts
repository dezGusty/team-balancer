import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard  {

    constructor(private authSvc: AuthService, private router: Router) {

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
