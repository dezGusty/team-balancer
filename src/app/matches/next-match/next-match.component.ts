import { Component, OnInit } from '@angular/core';
import { Player } from 'src/app/shared/player.model';
import { MatchService } from 'src/app/shared/match.service';

@Component({
  selector: 'app-next-match',
  templateUrl: './next-match.component.html',
  styleUrls: ['./next-match.component.css']
})
export class NextMatchComponent implements OnInit {

  constructor(matchesSvc: MatchService) { }

  ngOnInit() {
  }

}
