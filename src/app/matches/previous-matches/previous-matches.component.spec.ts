import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousMatchesComponent } from './previous-matches.component';

describe('PreviousMatchesComponent', () => {
  let component: PreviousMatchesComponent;
  let fixture: ComponentFixture<PreviousMatchesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviousMatchesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
