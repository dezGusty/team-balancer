import { Component, OnInit } from '@angular/core';

@Component({
    imports: [],
    selector: 'app-small-loading-spinner',
    standalone: true,
    styleUrls: ['./small-loading-spinner.component.css'],
    template: `<div class="spinner">
  <div class="rect1"></div>
  <div class="rect2"></div>
  <div class="rect3"></div>
  <div class="rect4"></div>
  <div class="rect5"></div>
</div>`
})
export class SmallLoadingSpinnerComponent {
  // generated from http://tobiasahlin.com/spinkit/
  constructor() { }

}
