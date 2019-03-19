import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  public version: string;
  public releaseDate: Date;

  constructor() {
    this.version = '0.3.1';
    this.releaseDate = new Date(2019, 3, 19);
  }

  ngOnInit() {
  }

}
