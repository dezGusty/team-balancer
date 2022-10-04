import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isCollapsed = true;

  /**
   * Constructor.
   * @param authSvc The authentication service
   * @param router The router. Used to listen for navigation events
   * and collapse the navbar.
   */
  constructor(
    private authSvc: AuthService,
    private router: Router) {
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationStart) {
        this.isCollapsed = true;
      }
    });
  }

  ngOnInit() {
  }

  /**
   * Retrieves the authentication state from the service.
   */
  public isAuthenticated(): boolean {
    return this.authSvc.isAuthenticated();
  }

  /**
 * Retrieves the authentication state from the service.
 */
  public isAuthenticatedAsUser(): boolean {
    return this.authSvc.isAuthenticatedAsUser();
  }

  /**
   * Retrieves the authentication state from the service.
   */
  public isAuthenticatedAsAdmin(): boolean {
    return this.authSvc.isAuthenticatedAsAdmin();
  }

  /**
 * Retrieves the authentication state from the service.
 */
  public isAuthenticatedAsOrganizer(): boolean {
    return this.authSvc.isAuthenticatedAsOrganizer();
  }

  /**
   * React to the signout button being clicked from the UI.
   */
  public async onSignoutBtnClick() {
    await this.authSvc.signOutAsync();
  }
}
