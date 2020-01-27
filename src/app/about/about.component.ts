import { Component, OnInit } from '@angular/core';
import { version } from '../../../package.json';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styles: ['']
})
export class AboutComponent implements OnInit {

  public version: string;
  public releaseDate: Date;
  public author: string;

  constructor() {
    this.author = 'Gusti';
    this.version = version;

    this.releaseDate = new Date(2020, 1, 24);
  }

  ngOnInit() {
  }

}
