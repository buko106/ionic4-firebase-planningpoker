import { TestBed } from '@angular/core/testing';

import { FirebaseBackendService } from './firebase-backend.service';

describe('FirebaseBackendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseBackendService = TestBed.get(FirebaseBackendService);
    expect(service).toBeTruthy();
  });
});
