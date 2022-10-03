import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { AuthAltService } from '../auth-alt.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styles: ['']
})
export class SigninComponent implements OnInit {

  constructor(
    private authSvc: AuthService,
    private authAltSvc: AuthAltService,
    private router: Router) {
  }

  ngOnInit() {
  }

  tryGoogleLogin() {
    this.authAltSvc.doGoogleLogin({ successRoute: [] })
      .then(res => {
        console.log('[signin] navigating to root');
        this.router.navigate(['/players']);
      });
  }

}
