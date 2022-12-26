import { TestBed } from '@angular/core/testing';

import { AuthbaseService } from './authbase.service';

describe('AuthbaseService', () => {
  let service: AuthbaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthbaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
