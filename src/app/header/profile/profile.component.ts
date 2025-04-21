import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { tap } from 'rxjs';
import { UserAuthService } from 'src/app/auth/user-auth.service';
import { LoadingFlagService } from 'src/app/utils/loading-flag.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {

  user$ = this.userAuthService.loggedInUser$;

  loadingFlag$ = this.loadingFlagService.loadingFlag$.pipe(
    tap(flag => console.log(`[profile] loadingFlag$ = ${flag}`))
  );

  constructor(
    private loadingFlagService: LoadingFlagService,
    private userAuthService: UserAuthService) {

  }

  onAvatarClick() {
    console.log('*** avatar click', this.loadingFlagService.getRecentSources());
  }

}
