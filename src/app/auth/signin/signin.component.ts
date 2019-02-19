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
  }

  tryGoogleLogin() {
    this.authSvc.doGoogleLogin()
      .then(res => {
        this.router.navigate(['/players']);
      });
  }

}
