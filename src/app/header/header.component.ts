import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isCollapsed = true;

  constructor(private authSvc: AuthService) { }

  ngOnInit() {
  }

  public userIsAdmin(): boolean {
    return false;
  }

  public isAuthenticated(): boolean {
    return this.authSvc.isAuthenticated();
  }

  public onSignout() {
    this.authSvc.signOut();
  }
}
