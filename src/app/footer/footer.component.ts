import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import pkg from '../../../package.json';

@Component({
  imports: [CommonModule, DatePipe],
  selector: 'app-footer',
  standalone: true,
  styles: [''],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
