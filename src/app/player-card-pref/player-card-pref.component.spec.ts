import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerCardPrefComponent } from './player-card-pref.component';

describe('PlayerCardPrefComponent', () => {
  let component: PlayerCardPrefComponent;
  let fixture: ComponentFixture<PlayerCardPrefComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerCardPrefComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerCardPrefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
