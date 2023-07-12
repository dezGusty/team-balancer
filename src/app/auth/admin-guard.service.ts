import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * @description
 * A navigation guard to allow access restrictions based on the admin role.
 */
@Injectable()
export class AdminGuard  {

    constructor(
        private authSvc: AuthService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean> | Promise<boolean> | boolean {
        if (this.authSvc.isAuthenticatedAsAdmin()) {
            return true;
        } else {
            return false;
        }
    }
}
