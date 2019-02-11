import { Component, OnInit } from '@angular/core';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-next-match',
  templateUrl: './next-match.component.html',
  styleUrls: ['./next-match.component.css']
})
export class NextMatchComponent implements OnInit {

  players: Player[] = [
    new Player(1, 'johny'),
    new Player(2, 'gus'),
    new Player(3, 'iulian')
  ];
  constructor() { }

  ngOnInit() {
  }

}
