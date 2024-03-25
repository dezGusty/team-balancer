import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import pkg from '../../../package.json';

@Component({
  imports: [DatePipe],
  selector: 'app-about',
  standalone: true,
  styles: [''],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {

  public version: string;
  public releaseDate: Date;
  public author: string;

  constructor(

  ) {
    this.author = 'Gusti';
    this.version = pkg.version;
    this.releaseDate = new Date(pkg.releaseDate);
  }

  ngOnInit() {
  }

  public isAllowedToNotify(): boolean {
    return window.Notification.permission === 'granted';
  }

}
