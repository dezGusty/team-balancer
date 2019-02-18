import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.css']
})
export class MatchesComponent implements OnInit {
  public nextMatchCreated: boolean;
  constructor() { }

  ngOnInit() {
    this.nextMatchCreated = true;
  }

}
