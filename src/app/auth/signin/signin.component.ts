import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {

  constructor(private authSvc: AuthService, private router: Router) {
    console.log('[signin] ctor');

  }

  ngOnInit() {
    console.log('[signin] init');

    if (this.authSvc.isAuthenticated()) {
      // this.router.navigate(['/custom']);
    }
  }

  tryGoogleLogin() {
    this.authSvc.doGoogleLogin()
      .then(res => {
        console.log('[signin] navigating to root');
        this.router.navigate(['/players']);
      });
  }

}
