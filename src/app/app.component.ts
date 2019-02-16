import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'team-balancer';
  selectedScreen = '';

  onNavigate(screen: string) {
    console.log('new screen selected: ' + screen);
    this.selectedScreen = screen;
  }
}
