import { Component, OnInit } from '@angular/core';
import { version } from '../../../package.json';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  public version: string;
  public releaseDate: Date;

  constructor() {
    this.version = version;

    this.releaseDate = new Date(2019, 3, 25);
  }

  ngOnInit() {
  }

}
