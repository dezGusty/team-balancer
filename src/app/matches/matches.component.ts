import { Component, OnInit } from '@angular/core';
import { Match } from '../shared/match.model';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.component.html',
  styleUrls: ['./matches.component.css']
})
export class MatchesComponent implements OnInit {
  matches: Match[] = [
    new Match(new Date('2019-02-07')),
    new Match(new Date('2019-02-14')),
  ];
  private nextMatchCreated: boolean;
  constructor() { }

  ngOnInit() {
    this.nextMatchCreated = true;
  }

}
