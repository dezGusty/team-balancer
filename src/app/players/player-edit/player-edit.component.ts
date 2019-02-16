import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from 'src/app/shared/player.model';

@Component({
  selector: 'app-player-edit',
  templateUrl: './player-edit.component.html',
  styleUrls: ['./player-edit.component.css']
})
export class PlayerEditComponent implements OnInit {
  @Input() player: Player;
  @Output() submitted = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  onSubmit() {
    console.log('Form submitted');
    this.submitted.emit('closed');
  }

}
