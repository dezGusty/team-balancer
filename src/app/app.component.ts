import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { NgcCookieConsentService, NgcInitializingEvent, NgcStatusChangeEvent, NgcNoCookieLawEvent } from 'ngx-cookieconsent';
import { Subscription } from 'rxjs';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { NotificationComponent } from './utils/notification/notification.component';

@Component({
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    RouterModule,
    NotificationComponent
  ],
  selector: 'app-root',
  standalone: true,
  styles: [''],
  template: `
<div class="main-layout">
  <app-header />
  <div class="gus-page-container">
    <router-outlet/>
  </div>
  <app-footer/>
  <app-notification/>
</div>
`,
})
export class AppComponent implements OnInit, OnDestroy {
  // keep refs to subscriptions to be able to unsubscribe later
  // private popupOpenSubscription: Subscription = Subscription.EMPTY;
  // private popupCloseSubscription: Subscription = Subscription.EMPTY;
  // private initializingSubscription: Subscription = Subscription.EMPTY;
  // private initializedSubscription: Subscription = Subscription.EMPTY;
  // private statusChangeSubscription: Subscription = Subscription.EMPTY;
  // private revokeChoiceSubscription: Subscription = Subscription.EMPTY;
  // private noCookieLawSubscription: Subscription = Subscription.EMPTY;

  title = 'team-balancer';

  constructor(
    // private ccService: NgcCookieConsentService
  ) {

  }

  ngOnInit() {
    // subscribe to cookieconsent observables to react to main events
    // this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.popupCloseSubscription = this.ccService.popupClose$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.initializingSubscription = this.ccService.initializing$.subscribe(
    //   (event: NgcInitializingEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });
    // this.initializedSubscription = this.ccService.initialized$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
    //   (event: NgcStatusChangeEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
    //   () => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });

    // this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
    //   (event: NgcNoCookieLawEvent) => {
    //     // you can use this.ccService.getConfig() to do stuff...
    //   });
  }

  ngOnDestroy() {
    // unsubscribe to cookieconsent observables to prevent memory leaks
    // this.popupOpenSubscription.unsubscribe();
    // this.popupCloseSubscription.unsubscribe();
    // this.initializedSubscription.unsubscribe();
    // this.initializingSubscription.unsubscribe();
    // this.statusChangeSubscription.unsubscribe();
    // this.revokeChoiceSubscription.unsubscribe();
    // this.noCookieLawSubscription.unsubscribe();
  }
}

