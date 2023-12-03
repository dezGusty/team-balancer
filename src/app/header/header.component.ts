import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RouterModule } from '@angular/router';
// import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../auth/auth.service';
import { LoadingFlagService } from '../utils/loading-flag.service';
import { tap } from 'rxjs';

@Component({
  imports: [
    CommonModule
    //, NgbCollapseModule
    , RouterModule],
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isCollapsed = true;

  loadingFlag$ = this.loadingFlagService.loadingFlag$.pipe(
    tap(flag => console.log(`[header] loadingFlag$ = ${flag}`))
  );

  /**
   * Constructor.
   * @param authSvc The authentication service
   * @param router The router. Used to listen for navigation events
   * and collapse the navbar.
   */
  constructor(
    private authSvc: AuthService,
    private router: Router,
    private loadingFlagService: LoadingFlagService) {
    this.router.events.subscribe((evt: Event) => {
      if (evt instanceof NavigationStart) {
        this.isCollapsed = true;
      }
    });
  }

  ngOnInit() {
    console.log('[header] ngOnInit');
    
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
