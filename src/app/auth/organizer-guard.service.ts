import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserAuthService } from './user-auth.service';

/**
 * @description
 * A navigation guard to allow access restrictions based on the (match) organizer role.
 */
@Injectable()
export class OrganizerGuard  {

    constructor(
        private authSvc: UserAuthService,
        private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean> | Promise<boolean> | boolean {
        if (this.authSvc.isAuthenticatedAsOrganizer()) {
            return true;
        } else {
            return false;
        }
    }
}
