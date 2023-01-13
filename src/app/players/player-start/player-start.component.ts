import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SmallLoadingSpinnerComponent } from 'src/app/ui/small-loading-spinner/small-loading-spinner.component';

@Component({
  imports: [SmallLoadingSpinnerComponent, CommonModule],
  selector: 'app-player-start',
  styles: [''],
  standalone: true,
  template: `<br>Select a player...`,
})
export class PlayerStartComponent {

  constructor() { }

}
