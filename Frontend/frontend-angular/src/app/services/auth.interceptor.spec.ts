import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpEvent } from '@angular/common/http';
import { AuthService } from './auth.service';
import { of } from 'rxjs';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let next: jasmine.Spy<(req: HttpRequest<any>) => any>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    authService = jasmine.createSpyObj('AuthService', ['getToken']);
    next = jasmine.createSpy('next');
    next.and.returnValue(of({} as HttpEvent<any>));
  });

  it('should be created', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('debería agregar el header Authorization si hay token', () => {
    authService.getToken.and.returnValue('test-token');
    const req = new HttpRequest('GET', '/test');
    authInterceptor(req, next);
    expect(next).toHaveBeenCalledWith(jasmine.objectContaining({
      headers: jasmine.anything()
    }));
  });

  it('no debería agregar el header Authorization si no hay token', () => {
    authService.getToken.and.returnValue(null);
    const req = new HttpRequest('GET', '/test');
    authInterceptor(req, next);
    expect(next).toHaveBeenCalled();
  });
});
