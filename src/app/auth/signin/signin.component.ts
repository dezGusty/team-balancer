import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {

  constructor(private authSvc: AuthService) { 
    console.log('[signin] ctor');
  }
  
  ngOnInit() {
    console.log('[signin] init');
  }

}
