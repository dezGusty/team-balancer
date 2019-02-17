import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Player } from 'src/app/shared/player.model';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-player-edit',
  templateUrl: './player-edit.component.html',
  styleUrls: ['./player-edit.component.css']
})
export class PlayerEditComponent implements OnInit {
  @Input() player: Player;
  @Output() submitted = new EventEmitter<{ saved: boolean, playername: string, playerrating: number }>();
  constructor() { }

  ngOnInit() {
  }

  onSubmit(form: NgForm) {
    const changedObject: { saved: boolean, playername: string, playerrating: number } = form.value;
    changedObject.saved = true;
    this.submitted.emit(changedObject);
    form.reset();
  }

  onCancel($event) {
    const changedObject: { saved: boolean, playername: string, playerrating: number } = {
      saved: false,
      playername: '',
      playerrating: 0
    };
    this.submitted.emit(changedObject);
  }

}
