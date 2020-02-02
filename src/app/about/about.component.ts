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

  subscribeToNotifications() {
    this.msgSvc.sub('drafts');
    this.msgSvc.sub('matches');
  }

  subscribeToPermission() {
    this.msgSvc.getPermission().subscribe();
  }

}
