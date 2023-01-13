import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  imports: [CommonModule],
  selector: 'app-signup',
  standalone: true,
  styles: [''],
  template: `<div class="row">
  <div class="col-4 col-offset-4">
    E-mail login is not yet supported.
  </div>
</div>`,
})
export class SignupComponent {

  constructor() { }

}
