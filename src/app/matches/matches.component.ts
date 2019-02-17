import { Component, OnInit } from '@angular/core';
import { Match } from '../shared/match.model';

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
