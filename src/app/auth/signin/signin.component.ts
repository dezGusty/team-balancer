import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserAuthService } from '../user-auth.service';

@Component({
  imports: [RouterModule],
  standalone: true,
  selector: 'app-signin',
  styles: [''],
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {

  constructor(
    private userAuthService: UserAuthService,
    private router: Router) {
  }

  ngOnInit() {
  }

  async tryGoogleLogin() {
    this.userAuthService.doGoogleLogin();
  }

  async tryFacebookLogin() {
    const success = await this.userAuthService.doFacebookLoginAsync({ successRoute: [] });
    if (success) {
      this.router.navigate(['/players']);
    }
  }

}
