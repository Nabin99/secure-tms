import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function jwtInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  
  // Add JWT token to requests
  const token = authService.tokenValue;
  
  console.log('JWT Interceptor:', { 
    url: request.url, 
    hasToken: !!token, 
    isApiRequest: isApiRequest(request),
    token: token ? `${token.substring(0, 20)}...` : 'none'
  });
  
  if (token && isApiRequest(request)) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('JWT Interceptor: HTTP Error', error.status, error.message);
      // Handle 401 Unauthorized errors (token expired/invalid)
      if (error.status === 401 && isApiRequest(request)) {
        console.log('JWT Interceptor: 401 error, logging out');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
}

function isApiRequest(request: HttpRequest<unknown>): boolean {
  return request.url.startsWith('/api');
}
