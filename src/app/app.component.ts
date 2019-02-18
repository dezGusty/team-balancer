import { Component, OnInit } from '@angular/core';
import * as firebase from 'firebase';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'team-balancer';

  ngOnInit() {
    // add data from firebase console.
    firebase.initializeApp({
      

    });
  }
}
