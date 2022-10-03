import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthAltService } from './auth-alt.service';

/**
 * @description
 * A navigation guard to allow access restrictions based on the admin role.
 */
@Injectable()
export class AdminGuard implements CanActivate {

    constructor(
        private authSvc: AuthService,
        private authAltSvc: AuthAltService,
        private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean> | Promise<boolean> | boolean {
        if (this.authAltSvc.isAuthenticatedAsAdmin()) {
            return true;
        } else {
            return false;
        }
    }
}
