import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ProfileComponent } from "./profile/profile.component";
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../auth/user-auth.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ProfileComponent
    ]
})
export class HeaderComponent {
  isCollapsed = true;

  menuDisplayed = false;

  public readonly authenticatedAsUserSig = this.userAuthService.authenticatedAsUserSig;
  public readonly authenticatedAsAdminSig = this.userAuthService.authenticatedAsAdminSig;
  public readonly authenticatedAsOrganizerSig = this.userAuthService.authenticatedAsOrganizerSig;
  public readonly authenticatedSig = this.userAuthService.authenticatedSig;

  /**
   * Constructor.
   * @param authSvc The authentication service
   * @param router The router. Used to listen for navigation events
   * and collapse the navbar.
   */
  constructor(
    private authSvc: AuthService,
    private router: Router,
    private userAuthService: UserAuthService) {
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationStart) {
        this.isCollapsed = true;
      }
    });
  }


  /**
   * Retrieves the authentication state from the service.
   */
  public isAuthenticated(): boolean {
    // return this.authSvc.isAuthenticated();
    return this.userAuthService.isAuthenticated();
  }

  /**
 * Retrieves the authentication state from the service.
 */
  public isAuthenticatedAsUser(): boolean {
    // return this.authSvc.isAuthenticatedAsUser();
    return this.userAuthService.isAuthenticatedAsUser();
  }

  /**
   * Retrieves the authentication state from the service.
   */
  public isAuthenticatedAsAdmin(): boolean {
    // return this.authSvc.isAuthenticatedAsAdmin();
    return this.userAuthService.isAuthenticatedAsAdmin();
  }

  /**
 * Retrieves the authentication state from the service.
 */
  public isAuthenticatedAsOrganizer(): boolean {
    // return this.authSvc.isAuthenticatedAsOrganizer();
    return this.userAuthService.isAuthenticatedAsOrganizer();
  }

  /**
   * React to the signout button being clicked from the UI.
   */
  public async onSignoutBtnClick() {
    // await this.authSvc.signOutAsync();
    this.userAuthService.signOut();
  }

  logoAreaClick($event: any) {
    // console.log("*** logoAreaClick ***", $event, "menuDisplayed=", this.menuDisplayed);
    this.menuDisplayed = !this.menuDisplayed;
  }

  navLinkClick($event: any) {
    // console.log("*** navLinkClick ***", $event, "menuDisplayed=", this.menuDisplayed);
    this.menuDisplayed = false;
  }
}
