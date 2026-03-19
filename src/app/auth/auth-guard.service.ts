import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class AuthGuard  {

    constructor(private authSvc: UserAuthService, private router: Router) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
        Observable<boolean> | Promise<boolean> | boolean {
        if (this.authSvc.isAuthenticated() && this.authSvc.isAuthenticatedAsUser()) {
            return true;
        } else {
            this.router.navigate(['/']);
        }
        return this.authSvc.isAuthenticated() && this.authSvc.isAuthenticatedAsUser();
    }
}
