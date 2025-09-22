import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add JWT token to requests
    const token = this.authService.tokenValue;
    
    if (token && this.isApiRequest(request)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('JWT Interceptor: HTTP Error', error.status, error.message);
        // Handle 401 Unauthorized errors (token expired/invalid)
        if (error.status === 401 && this.isApiRequest(request)) {
          console.log('JWT Interceptor: 401 error, logging out');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  private isApiRequest(request: HttpRequest<unknown>): boolean {
    return request.url.startsWith('/api');
  }
}
