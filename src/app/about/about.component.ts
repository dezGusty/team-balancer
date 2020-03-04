import { Component, OnInit } from '@angular/core';
import { version } from '../../../package.json';
import { MessagingService } from '../shared/messaging.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styles: ['']
})
export class AboutComponent implements OnInit {

  public version: string;
  public releaseDate: Date;
  public author: string;

  constructor(
    private msgSvc: MessagingService
  ) {
    this.author = 'Gusti';
    this.version = version;

    this.releaseDate = new Date(2020, 1, 31);
  }

  ngOnInit() {
  }

  isAllowedToNotify(): boolean {
    return window.Notification.permission === 'granted';
  }

  isSubscribedToDrafts(): boolean {
    return false;
  }
  isSubscribedToMatches(): boolean {
    return false;
  }

  subscribeToDraftsTopic() {
    this.msgSvc.sub('drafts');

    console.log('***', window.Notification.permission);
  }

  subscribeToMatchesTopic() {
    this.msgSvc.sub('matches');
  }

  subscribeToNotifications() {
    this.subscribeToDraftsTopic();
    this.subscribeToMatchesTopic();
  }

  subscribeToPermission() {
    this.msgSvc.getPermission().subscribe();
  }

}
