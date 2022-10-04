import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styles: ['']
})
export class SigninComponent implements OnInit {

  constructor(
    private authSvc: AuthService,
    private router: Router) {
  }

  ngOnInit() {
  }

  async tryGoogleLogin() {

    const success = await this.authSvc.doGoogleLoginAsync({ successRoute: [] });
    if (success) {
      console.log('[signin] navigating to root');
      this.router.navigate(['/players']);
    } else {
      console.log('[signin] failed when logging in');
    }
  }

}
