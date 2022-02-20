import { TestBed } from '@angular/core/testing';

import { RatingScaler } from './rating-scaler';

describe('RatingScaler', () => {
  let service: RatingScaler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RatingScaler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
