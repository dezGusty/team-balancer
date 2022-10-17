import { Component, OnInit } from '@angular/core';
import pkg from '../../../package.json';

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

  ) {
    this.author = 'Gusti';
    this.version = pkg.version;

    this.releaseDate = new Date('2022-10-17');
  }

  ngOnInit() {
  }

  public isAllowedToNotify(): boolean {
    return window.Notification.permission === 'granted';
  }

}
