import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  imports: [RouterModule, CommonModule],
  standalone: true,
  selector: 'app-signin',
  styles: [''],
  templateUrl: './signin.component.html',
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

  async tryFacebookLogin() {

    const success = await this.authSvc.doFacebookLoginAsync({ successRoute: [] });
    if (success) {
      console.log('[signin] navigating to root');
      this.router.navigate(['/players']);
    } else {
      console.log('[signin] failed when logging in');
    }
  }

}
