import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import pkg from '../../../package.json';

@Component({
  imports: [CommonModule, DatePipe],
  selector: 'app-footer',
  standalone: true,
  styles: [''],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  public version: string;
  public releaseDate: Date;
  public author: string;

  constructor(

  ) {
    this.author = 'Gusti';
    this.version = pkg.version;
    this.releaseDate = new Date(pkg.releaseDate);
  }
}
