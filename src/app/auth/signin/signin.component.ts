import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styles: ['']
})
export class SigninComponent implements OnInit {

  constructor(private authSvc: AuthService, private router: Router) {
  }

  ngOnInit() {
  }

  tryGoogleLogin() {
    this.authSvc.doGoogleLogin()
      .then(res => {
        console.log('[signin] navigating to root');
        this.router.navigate(['/players']);
      });
  }

}
