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

  private topics: string[] = [];
  constructor(
    private msgSvc: MessagingService
  ) {
    this.author = 'Gusti';
    this.version = version;

    this.releaseDate = new Date('2020-03-15');
  }

  ngOnInit() {
  }

  public isAllowedToNotify(): boolean {
    return window.Notification.permission === 'granted';
  }

  isSubscribedToTopic(topic: string): boolean {
    const topics: string[] = this.msgSvc.getSubscribedTopics();
    return topics.indexOf(topic) >= 0;
  }

  isSubscribedToDrafts(): boolean {
    return this.isSubscribedToTopic('drafts') && this.isAllowedToNotify();
  }
  isSubscribedToMatches(): boolean {
    return this.isSubscribedToTopic('matches') && this.isAllowedToNotify();
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
